<?php

namespace App\Console\Commands;

use App\Jobs\DispatchEitaaCampaign;
use App\Models\Eitaa\EitaaBot;
use App\Models\Eitaa\EitaaCampaign;
use App\Models\Eitaa\EitaaMessage;
use App\Services\Eitaa\EitaaBotService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * The single cron entry point for the module (shared-hosting friendly):
 * every minute it (1) pushes due queued messages through the API respecting
 * per-bot rate limits, (2) re-dispatches scheduled campaigns, (3) retries
 * failed sends, (4) finishes completed campaigns.
 */
class EitaaCron extends Command
{
    protected $signature = 'eitaa:cron {--limit=40 : Maximum API calls per run}';

    protected $description = 'Process the Eitaa module queue, campaigns and retries (run every minute)';

    public function handle(EitaaBotService $service): int
    {
        $budget = max(1, (int) $this->option('limit'));
        $processed = 0;

        // 1) Due campaign dispatchers (fast, no API calls in this loop).
        EitaaCampaign::query()
            ->whereIn('status', ['scheduled', 'running', 'paused'])
            ->where(function ($query) {
                $query->whereNull('scheduled_at')->orWhere('scheduled_at', '<=', now());
            })
            ->whereHas('recipients', fn ($q) => $q->where('status', 'pending'))
            ->each(function (EitaaCampaign $campaign): void {
                // Shared hosting has no queue worker; the cron IS the driver.
                // Run the dispatcher synchronously so campaigns actually progress
                // (the job batches to the rate limit, keeping each run bounded).
                dispatch_sync(new DispatchEitaaCampaign($campaign->id));
            });

        // 2) Rate-limited worker: oldest due messages first, budgeted per run.
        $bots = EitaaBot::query()->where('is_active', true)->get();
        foreach ($bots as $bot) {
            if ($budget <= 0) {
                break;
            }
            // A paused campaign's messages stay queued but the campaign job skips; the worker also defers them.
            $messages = EitaaMessage::query()
                ->where('bot_id', $bot->id)
                ->dispatchable(min($budget, max(1, (int) $bot->rate_limit_per_minute)))
                ->get()
                ->filter(fn (EitaaMessage $message) => $message->campaign_id === null
                    || EitaaCampaign::query()->find($message->campaign_id)?->status !== 'paused');

            foreach ($messages as $message) {
                if ($budget <= 0) {
                    break;
                }
                try {
                    $service->dispatchMessage($message);
                } catch (Throwable $exception) {
                    $message->update(['status' => 'failed', 'error' => $exception->getMessage(), 'error_category' => 'unknown']);
                }
                $budget--;
                $processed++;
            }
        }

        // 3) Campaign progress rollup + completion.
        EitaaCampaign::query()->whereIn('status', ['running', 'scheduled'])->each(function (EitaaCampaign $campaign): void {
            $job = new DispatchEitaaCampaign($campaign->id);
            $job->refreshProgress($campaign);
        });

        // 4) Light cleanup: drop simulated test-mode logs older than 7 days.
        EitaaMessage::query()
            ->where('created_at', '<', now()->subDays(7))
            ->where(fn ($q) => $q->whereJsonContains('metadata->simulated', true)->orWhereNull('external_message_id'))
            ->whereIn('status', ['sent'])
            ->whereNull('campaign_id')
            ->limit(200)
            ->delete();

        $this->info("Eitaa cron: {$processed} message(s) processed.");

        return self::SUCCESS;
    }
}
