<?php

namespace App\Jobs;

use App\Models\Eitaa\EitaaCampaign;
use App\Models\Eitaa\EitaaCampaignTarget;
use App\Models\Eitaa\EitaaMessage;
use App\Models\Eitaa\EitaaTarget;
use App\Services\Eitaa\EitaaBotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/**
 * Processes one campaign slice per run: it releases pending recipients up to the
 * rate limit, renders the message body per target and enqueues messages for
 * dispatchMessage. Scheduled campaigns only start once scheduled_at has passed.
 * Re-dispatched by the eitaa:cron command every minute (shared-hosting friendly).
 */
class DispatchEitaaCampaign implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels, Queueable;

    public int $tries = 1;
    public int $timeout = 120;

    public function __construct(public int $campaignId) {}

    public function handle(EitaaBotService $service): void
    {
        $campaign = EitaaCampaign::query()->find($this->campaignId);
        if (! $campaign || ! in_array($campaign->status, ['scheduled', 'running'], true)) {
            return;
        }
        if ($campaign->scheduled_at && $campaign->scheduled_at->isFuture()) {
            return; // not due yet; cron will re-dispatch
        }

        $campaign->update(['status' => 'running', 'started_at' => $campaign->started_at ?? now()]);

        $perMinute = max(1, (int) $campaign->rate_limit_per_minute);
        $batchSize = min($perMinute, 25);
        $interval = (int) max(1, ceil(60 / $perMinute)); // seconds between sends

        EitaaCampaignTarget::query()
            ->where('campaign_id', $campaign->id)
            ->where('status', 'pending')
            ->orderBy('id')
            ->limit($batchSize)
            ->get()
            ->each(function (EitaaCampaignTarget $recipient, int $index) use ($campaign, $service, $interval): void {
                $target = EitaaTarget::query()->find($recipient->target_id);
                if (! $target || $target->status !== 'active' || $target->opt_in_status !== 'opted_in') {
                    $recipient->update(['status' => 'skipped', 'error' => 'مقصد فعال یا opt-in نیست.']);

                    return;
                }

                $recipient->update(['status' => 'queued']);
                $message = EitaaMessage::create([
                    'bot_id' => $campaign->bot_id,
                    'target_id' => $target->id,
                    'campaign_id' => $campaign->id,
                    'direction' => 'out',
                    'chat_id' => $target->chat_id,
                    'message_type' => 'text',
                    'body' => EitaaBotService::renderBody((string) $campaign->message_body, $target, $campaign),
                    'status' => 'queued',
                    // spread sends across the minute window to respect the rate limit
                    'available_at' => time() + $index * $interval,
                ]);

                try {
                    $service->dispatchMessage($message);
                } catch (Throwable $exception) {
                    $message->update(['status' => 'failed', 'error' => $exception->getMessage(), 'error_category' => 'unknown']);
                }

                $recipient->update([
                    'status' => $message->fresh()?->status === 'sent' ? 'sent' : ($message->fresh()?->status === 'failed' ? 'failed' : 'queued'),
                    'attempts' => $recipient->attempts + 1,
                    'error' => $message->fresh()?->error,
                    'sent_at' => $message->fresh()?->sent_at,
                ]);

                if ($message->fresh()?->status === 'failed' && $recipient->attempts < $campaign->max_retries) {
                    // Re-arm with backoff: 1m, then 5m, then 15m.
                    $delays = [60, 300, 900];
                    $delay = $delays[min($recipient->attempts - 1, count($delays) - 1)];
                    $recipient->update(['status' => 'pending', 'error' => 'تلاش دوباره پس از '.$delay.' ثانیه']);
                    $message->update(['status' => 'queued', 'available_at' => time() + $delay]);
                }
            });

        $this->refreshProgress($campaign);
    }

    public function refreshProgress(EitaaCampaign $campaign): void
    {
        $counts = EitaaCampaignTarget::query()
            ->selectRaw("status, count(*) as total")
            ->where('campaign_id', $campaign->id)
            ->groupBy('status')
            ->pluck('total', 'status');

        $sent = (int) ($counts['sent'] ?? 0);
        $failed = (int) ($counts['failed'] ?? 0);
        $pending = (int) ($counts['pending'] ?? 0) + (int) ($counts['queued'] ?? 0);
        $total = $campaign->recipients()->count();

        $campaign->update([
            'sent_count' => $sent,
            'failed_count' => $failed,
            'status' => match (true) {
                $campaign->status === 'cancelled' => 'cancelled',
                $total > 0 && $pending === 0 => 'completed',
                $campaign->status !== 'paused' => 'running',
                default => $campaign->status,
            },
            'completed_at' => ($total > 0 && $pending === 0) ? now() : null,
        ]);
    }
}
