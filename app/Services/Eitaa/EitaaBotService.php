<?php

namespace App\Services\Eitaa;

use App\Models\Eitaa\EitaaBot;
use App\Models\Eitaa\EitaaCampaign;
use App\Models\Eitaa\EitaaCampaignTarget;
use App\Models\Eitaa\EitaaLog;
use App\Models\Eitaa\EitaaMessage;
use App\Models\Eitaa\EitaaTarget;
use App\Models\Eitaa\EitaaTemplate;
use Illuminate\Support\Facades\DB;

/**
 * Domain service for the Eitaa bot module. Controllers stay thin; all Eitaa
 * traffic flows through EitaaApiClient here.
 */
class EitaaBotService
{
    public function __construct(
        private readonly EitaaApiClient $client,
    ) {}

    // ---------------------------------------------------------------- bots

    /** @return array{ok: bool, message: string} */
    public function connect(EitaaBot $bot): array
    {
        $token = $bot->accessToken();
        if (blank($token)) {
            return ['ok' => false, 'message' => 'ابتدا Bot Token را ذخیره کنید.'];
        }

        $result = $this->client->getMe($token);
        if (! $result['ok']) {
            $bot->update(['status' => 'error', 'last_error' => $result['error']]);

            return ['ok' => false, 'message' => 'اتصال ناموفق بود: '.self::friendlyError($result['error'], $result['category'])];
        }

        $bot->update([
            'status' => 'connected',
            'is_active' => true,
            'last_connected_at' => now(),
            'last_error' => null,
        ]);
        EitaaLog::record($bot->id, 'bot.connected', 'توکن ایتایار تأیید شد.', [], 'info');

        // Eitaa has no BotFather identity: the token belongs to the eitaayar.ir
        // account and one token can post into several chats, so there is no
        // bot username/id to store here. The real requirement is that the
        // @sender program user is an admin of each target chat.
        return ['ok' => true, 'message' => 'توکن ایتایار معتبر است. مطمئن شوید برنامه @sender مدیر چنل/گروه مقصد است و مقاصد را در صفحه «مقاصد» ثبت کرده‌اید.'];
    }

    /** @return array{ok: bool, message: string} */
    public function test(EitaaBot $bot): array
    {
        $token = $bot->accessToken();
        if (blank($token)) {
            return ['ok' => false, 'message' => 'توکن ربات ذخیره نشده است.'];
        }

        $result = $this->client->getMe($token);
        if (! $result['ok']) {
            $bot->update(['status' => 'error', 'last_error' => $result['error']]);

            return ['ok' => false, 'message' => 'تست اتصال ناموفق بود: '.self::friendlyError($result['error'], $result['category'])];
        }

        $bot->update(['status' => 'connected', 'last_connected_at' => now(), 'last_error' => null]);

        return ['ok' => true, 'message' => 'اتصال سالم است.'];
    }

    public function disconnect(EitaaBot $bot): void
    {
        $bot->update(['status' => 'disconnected', 'is_active' => false, 'last_error' => null]);
        EitaaLog::record($bot->id, 'bot.disconnected', 'اتصال ربات قطع شد.');
    }

    // ------------------------------------------------------------- targets

    /** @return array{ok: bool, message: string} */
    public function verifyTarget(EitaaTarget $target): array
    {
        $bot = $target->bot ?? EitaaBot::query()->where('is_active', true)->first();
        $token = $bot?->accessToken();
        if (blank($token)) {
            return ['ok' => false, 'message' => 'ابتدا ربات را متصل کنید.'];
        }

        $probe = $this->client->sendMessage($token, $target->chat_id, '✅ اتصال این چنل/گروه توسط ربات مرکز بررسی شد.', [
            'disable_notification' => true,
        ]);

        if (! $probe['ok']) {
            $target->update(['status' => 'blocked', 'last_error' => $probe['error'], 'last_error_at' => now()]);

            return ['ok' => false, 'message' => 'ارسال آزمایشی ناموفق بود: '.self::friendlyError($probe['error'], $probe['category'])];
        }

        $target->update(['status' => 'active', 'last_error' => null, 'last_send_at' => now()]);

        return ['ok' => true, 'message' => 'ربات به این مقصد دسترسی دارد و پیام آزمایشی بی‌صدا ارسال شد.'];
    }

    // ------------------------------------------------------------ messages

    /**
     * Sends one message now. Honors Test Mode: real API calls are suppressed
     * and the message is recorded as simulated until an admin disables Test Mode.
     *
     * @return array{ok: bool, error_category: ?string, error?: ?string}
     */
    public function sendNow(EitaaBot $bot, EitaaTarget $target, string $body, string $type = 'text', ?string $filePath = null, ?EitaaCampaign $campaign = null, array $options = []): array
    {
        $message = EitaaMessage::create([
            'bot_id' => $bot->id,
            'target_id' => $target->id,
            'campaign_id' => $campaign?->id,
            'direction' => 'out',
            'chat_id' => $target->chat_id,
            'message_type' => $type,
            'body' => $body,
            'file_path' => $filePath,
            'status' => 'queued',
        ]);

        return $this->dispatchMessage($message, $options);
    }

    /** Executes one queued message against the API (or simulates in Test Mode).
     *
     * @return array{ok: bool, error_category: ?string, error?: ?string}
     */
    public function dispatchMessage(EitaaMessage $message, array $options = []): array
    {
        $bot = $message->bot;
        $target = $message->target;
        if (! $bot || ! $target) {
            $message->update(['status' => 'failed', 'error_category' => 'invalid', 'error' => 'ربات یا مقصد حذف شده است.']);

            return ['ok' => false, 'error_category' => 'invalid', 'error' => 'ربات یا مقصد حذف شده است.'];
        }

        if ($bot->test_mode) {
            $message->update(['status' => 'sent', 'sent_at' => now(), 'metadata' => array_merge((array) $message->metadata, ['simulated' => true])]);

            return ['ok' => true, 'error_category' => null, 'error' => null];
        }

        $token = $bot->accessToken();
        $result = $message->message_type === 'file' && $message->file_path
            ? $this->client->sendFile($token, $target->chat_id, $message->file_path, (string) ($message->body ?? ''))
            : $this->client->sendMessage($token, $target->chat_id, (string) ($message->body ?? ''), $options);

        if ($result['ok']) {
            $message->update([
                'status' => 'sent',
                'external_message_id' => $result['message_id'] ?: $message->external_message_id,
                'sent_at' => now(),
                'error' => null,
                'error_category' => null,
            ]);
            $target->update(['last_send_at' => now(), 'last_error' => null]);
        } else {
            $message->update([
                'status' => 'failed',
                'error' => $result['error'],
                'error_category' => $result['category'],
            ]);
            $target->update(['last_error' => $result['error'], 'last_error_at' => now()]);
            EitaaLog::record($bot->id, 'message.failed', self::friendlyError($result['error'], $result['category']), [
                'message_id' => $message->id,
                'chat_id' => $target->chat_id,
            ], 'error');
        }

        return ['ok' => $result['ok'], 'error_category' => $result['category'], 'error' => $result['ok'] ? null : self::friendlyError($result['error'], $result['category'])];
    }

    // ----------------------------------------------------------- campaigns

    /**
     * Freezes the audience into eitaa_campaign_targets rows and (if scheduled)
     * arms the dispatcher command; otherwise marks the campaign running.
     *
     * @return array{ok: bool, message: string}
     */
    public function launch(EitaaCampaign $campaign): array
    {
        if (! in_array($campaign->status, ['draft', 'scheduled', 'paused', 'failed'], true)) {
            return ['ok' => false, 'message' => 'این کمپین در وضعیت فعلی قابل اجرا نیست.'];
        }

        $bot = $campaign->bot;
        if (! $bot || ! $bot->is_active) {
            return ['ok' => false, 'message' => 'ربات این کمپین فعال نیست؛ ابتدا اتصال را کامل کنید.'];
        }

        $targets = $this->resolveAudience($campaign);
        if ($targets->isEmpty()) {
            return ['ok' => false, 'message' => 'هیچ مقصدی با فیلترهای مخاطب مطابقت نداشت.'];
        }

        DB::transaction(function () use ($campaign, $targets): void {
            EitaaCampaignTarget::query()->where('campaign_id', $campaign->id)->delete();
            foreach ($targets as $target) {
                EitaaCampaignTarget::create([
                    'campaign_id' => $campaign->id,
                    'target_id' => $target->id,
                    'status' => 'pending',
                ]);
            }
            $campaign->update([
                'status' => 'scheduled',
                'total_targets' => $targets->count(),
                'sent_count' => 0,
                'failed_count' => 0,
                'scheduled_at' => $campaign->scheduled_at ?: now(),
                'started_at' => null,
                'completed_at' => null,
            ]);
        });

        EitaaLog::record($campaign->bot_id, 'campaign.launched', "کمپین «{$campaign->name}» برای {$targets->count()} مقصد آماده شد.");

        return ['ok' => true, 'message' => "کمپین برای {$targets->count()} مقصد برنامه‌ریزی شد و توسط زمان‌بر ارسال می‌شود."];
    }

    public function pause(EitaaCampaign $campaign): void
    {
        if (in_array($campaign->status, ['scheduled', 'running'], true)) {
            $campaign->update(['status' => 'paused']);
        }
    }

    public function resume(EitaaCampaign $campaign): void
    {
        if ($campaign->status === 'paused') {
            $campaign->update(['status' => 'scheduled', 'scheduled_at' => now()]);
        }
    }

    public function cancel(EitaaCampaign $campaign): void
    {
        if (! in_array($campaign->status, ['completed', 'cancelled'], true)) {
            $campaign->update(['status' => 'cancelled']);
            EitaaCampaignTarget::query()
                ->where('campaign_id', $campaign->id)
                ->where('status', 'pending')
                ->update(['status' => 'skipped']);
        }
    }

    /** Applies the audience builder filters to the target pool. */
    private function resolveAudience(EitaaCampaign $campaign)
    {
        $filters = (array) ($campaign->audience_filters ?? []);
        $query = EitaaTarget::query()
            ->where('status', 'active')
            ->where('opt_in_status', 'opted_in');

        return match ($campaign->audience_type) {
            'tags' => $query->where(function ($q) use ($filters) {
                foreach ((array) ($filters['tags'] ?? []) as $tag) {
                    $q->orWhereJsonContains('tags', $tag);
                }
            })->get(),
            'targets' => $query->whereIn('id', (array) ($filters['target_ids'] ?? []))->get(),
            default => $query->get(),
        };
    }

    // ------------------------------------------------------------ templates

    /** Replaces supported placeholders in a template/campaign body. */
    public static function renderBody(string $body, EitaaTarget $target, ?EitaaCampaign $campaign = null): string
    {
        return str_replace(
            ['{{name}}', '{{first_name}}', '{{campaign}}', '{{date}}'],
            [$target->title ?: $target->chat_id, $target->title ?: $target->chat_id, $campaign?->name ?? '', \App\Support\FaDate::format(now())],
            $body,
        );
    }

    public static function friendlyError(?string $error, ?string $category): string
    {
        if ($category !== null && $category !== '' && $category !== 'unknown') {
            return EitaaApiClient::ERROR_CATEGORIES[$category] ?? (string) $error;
        }

        return (string) $error;
    }
}
