<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRun;
use App\Models\MarketingCampaignRecipient;
use App\Models\Order;
use App\Models\User;
use App\Notifications\MarketingCampaignNotification;
use App\Services\Sms\SmsSender;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Mail\Message;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Throwable;

class RunMarketingCampaign implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    /** @param array<string, mixed>|null $recipient */
    public function __construct(
        public readonly int $campaignId,
        public readonly int $runId,
        public readonly ?array $recipient = null,
    ) {
    }

    public function handle(SmsSender $sms): void
    {
        $campaign = MarketingCampaign::find($this->campaignId);
        $run = MarketingCampaignRun::find($this->runId);

        if (! $campaign || ! $run) {
            return;
        }

        $run->update(['status' => 'running', 'started_at' => now()]);
        $campaign->update(['status' => 'running']);

        $recipients = $this->recipient ? collect([$this->recipient]) : $this->resolveRecipients($campaign);
        $run->update(['recipients_count' => $recipients->count()]);

        $sent = 0;
        $failed = 0;

        foreach ($recipients as $recipient) {
            try {
                $this->sendTo($campaign, $recipient, $sms);
                if (! empty($recipient['recipient_id'])) {
                    MarketingCampaignRecipient::whereKey($recipient['recipient_id'])->update(['status' => 'sent', 'error' => null, 'sent_at' => now()]);
                }
                $sent++;
            } catch (Throwable $exception) {
                if (! empty($recipient['recipient_id'])) {
                    MarketingCampaignRecipient::whereKey($recipient['recipient_id'])->update(['status' => 'failed', 'error' => 'ارسال این مخاطب ناموفق بود.']);
                }
                $failed++;
                Log::warning('Marketing campaign recipient failed', [
                    'campaign_id' => $campaign->id,
                    'channel' => $campaign->channel,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $run->update([
            'status' => 'completed',
            'sent_count' => $sent,
            'failed_count' => $failed,
            'completed_at' => now(),
        ]);
        $campaign->update([
            'status' => 'active',
            'last_run_at' => now(),
            'total_recipients' => $recipients->count(),
            'sent_count' => $sent,
            'failed_count' => $failed,
        ]);
    }

    public function failed(Throwable $exception): void
    {
        MarketingCampaignRun::whereKey($this->runId)->update([
            'status' => 'failed',
            'error' => 'اجرای کمپین با خطا متوقف شد.',
            'completed_at' => now(),
        ]);
        MarketingCampaign::whereKey($this->campaignId)->update(['status' => 'paused']);
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function resolveRecipients(MarketingCampaign $campaign)
    {
        if ($campaign->audience === 'imported') {
            return MarketingCampaignRecipient::query()
                ->where('campaign_id', $campaign->id)
                ->where('status', 'queued')
                ->get(['id', 'name', 'phone', 'email'])
                ->map(fn (MarketingCampaignRecipient $recipient) => [
                    'recipient_id' => $recipient->id,
                    'name' => $recipient->name,
                    'phone' => $recipient->phone,
                    'email' => $recipient->email,
                ]);
        }

        if ($campaign->audience === 'leads') {
            $query = Lead::query()->whereIn('status', ['new', 'contacted', 'interested', 'consultation']);
            $this->excludeOptedOutPhones($query, $campaign);

            return $query->get(['id', 'name', 'phone', 'email'])
                ->map(fn (Lead $lead) => $this->persistRecipient($campaign, [
                    'name' => $lead->name,
                    'phone' => $lead->phone,
                    'email' => $lead->email,
                ]));
        }

        $query = User::query()->where('is_active', true);
        match ($campaign->audience) {
            'students' => $query->whereHas('roles', fn ($roles) => $roles->where('name', 'student')),
            'parents' => $query->whereHas('roles', fn ($roles) => $roles->where('name', 'parent')),
            'customers' => $query->whereHas('orders', fn ($orders) => $orders->where('status', 'paid')),
            'inactive_users' => $query->whereDoesntHave('orders', fn ($orders) => $orders->where('status', 'paid')),
            default => null,
        };

        $this->excludeOptedOutUsers($query, $campaign);

        // For the inactive-user follow-up trigger, never re-send to someone who
        // already received this campaign within the configured cooldown window.
        if ($campaign->trigger === 'inactive_user' && $campaign->audience === 'inactive_users') {
            $cooldownDays = (int) ($campaign->settings['cooldown_days'] ?? 14);
            $query->whereNotIn('users.id', MarketingCampaignRecipient::query()
                ->where('campaign_id', $campaign->id)
                ->whereNotNull('sent_at')
                ->where('sent_at', '>=', now()->subDays($cooldownDays))
                ->pluck('user_id'));
        }

        return $query->get(['id', 'name', 'phone', 'email'])->map(fn (User $user) => $this->persistRecipient($campaign, [
            'user_id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
        ]));
    }

    /**
     * Record the recipient in the campaign history so admins can audit every
     * send and so cooldowns can be enforced on follow-up campaigns.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function persistRecipient(MarketingCampaign $campaign, array $attributes): array
    {
        $recipient = MarketingCampaignRecipient::create([
            'campaign_id' => $campaign->id,
            'user_id' => $attributes['user_id'] ?? null,
            'name' => $attributes['name'] ?? null,
            'phone' => $attributes['phone'] ?? null,
            'email' => $attributes['email'] ?? null,
            'status' => 'queued',
        ]);

        return $attributes + ['recipient_id' => $recipient->id];
    }

    private function excludeOptedOutPhones($query, MarketingCampaign $campaign): void
    {
        $field = $this->consentField($campaign);
        $query->whereNotExists(function ($subquery) use ($field): void {
            $subquery->selectRaw('1')->from('marketing_consents')
                ->whereColumn('marketing_consents.phone', 'leads.phone')
                ->where(function ($blocked) use ($field): void {
                    $blocked->where("marketing_consents.{$field}", false)
                        ->orWhere(function ($all) {
                            $all->whereNotNull('marketing_consents.revoked_at')->where('marketing_consents.sms', false)->where('marketing_consents.email_marketing', false)->where('marketing_consents.in_app', false);
                        });
                });
        });
    }

    private function excludeOptedOutUsers($query, MarketingCampaign $campaign): void
    {
        $field = $this->consentField($campaign);
        $query->whereNotExists(function ($subquery) use ($field): void {
            $subquery->selectRaw('1')->from('marketing_consents')
                ->whereColumn('marketing_consents.user_id', 'users.id')
                ->where(function ($blocked) use ($field): void {
                    $blocked->where("marketing_consents.{$field}", false)
                        ->orWhere(function ($all) {
                            $all->whereNotNull('marketing_consents.revoked_at')->where('marketing_consents.sms', false)->where('marketing_consents.email_marketing', false)->where('marketing_consents.in_app', false);
                        });
                });
        });
    }

    private function consentField(MarketingCampaign $campaign): string
    {
        return match ($campaign->channel) {
            'sms' => 'sms',
            'email' => 'email_marketing',
            default => 'in_app',
        };
    }

    /** @param array<string, mixed> $recipient */
    private function sendTo(MarketingCampaign $campaign, array $recipient, SmsSender $sms): void
    {
        $message = $this->renderMessage($campaign->message, $recipient);

        match ($campaign->channel) {
            'sms' => $this->sendSms($sms, (string) ($recipient['phone'] ?? ''), $message),
            'email' => $this->sendEmail($recipient, $message, (string) ($campaign->subject ?: $campaign->name)),
            'in_app' => $this->sendInApp($recipient, $campaign, $message),
            default => throw new \RuntimeException('کانال کمپین معتبر نیست.'),
        };
    }

    private function sendSms(SmsSender $sms, string $phone, string $message): void
    {
        if ($phone === '') {
            throw new \RuntimeException('شماره موبایل گیرنده ثبت نشده است.');
        }
        $sms->send($phone, $message);
    }

    /** @param array<string, mixed> $recipient */
    private function sendEmail(array $recipient, string $message, string $subject): void
    {
        $email = (string) ($recipient['email'] ?? '');
        if ($email === '') {
            throw new \RuntimeException('ایمیل گیرنده ثبت نشده است.');
        }
        Mail::raw($message, function (Message $mail) use ($email, $subject): void {
            $mail->to($email)->subject($subject);
        });
    }

    /** @param array<string, mixed> $recipient */
    private function sendInApp(array $recipient, MarketingCampaign $campaign, string $message): void
    {
        $userId = (int) ($recipient['user_id'] ?? 0);
        $user = $userId > 0 ? User::find($userId) : null;
        if (! $user) {
            throw new \RuntimeException('گیرنده درون‌برنامه‌ای معتبر نیست.');
        }
        $user->notify(new MarketingCampaignNotification($campaign->name, $message, (string) $campaign->id));
    }

    /** @param array<string, mixed> $recipient */
    private function renderMessage(string $message, array $recipient): string
    {
        return strtr($message, [
            '{name}' => (string) ($recipient['name'] ?? 'دوست عزیز'),
            '{phone}' => (string) ($recipient['phone'] ?? ''),
            '{site_name}' => (string) config('app.name'),
        ]);
    }
}
