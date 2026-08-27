<?php

namespace App\Services\Marketing;

use App\Jobs\RunMarketingCampaign;
use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRun;

class MarketingCampaignDispatcher
{
    /** @param array<string, mixed>|null $recipient */
    public function dispatchForTrigger(string $trigger, ?array $recipient = null): int
    {
        $count = 0;

        MarketingCampaign::query()
            ->where('status', 'active')
            ->where('trigger', $trigger)
            ->get()
            ->each(function (MarketingCampaign $campaign) use (&$count, $recipient): void {
                $this->queue($campaign, $recipient);
                $count++;
            });

        return $count;
    }

    /** @param array<string, mixed>|null $recipient */
    public function queue(MarketingCampaign $campaign, ?array $recipient = null): MarketingCampaignRun
    {
        $run = $campaign->runs()->create([
            'status' => 'queued',
            'started_at' => null,
        ]);

        $pending = RunMarketingCampaign::dispatch($campaign->id, $run->id, $recipient);

        // A manual campaign may be scheduled for a future one-time run. Event-driven
        // campaigns are dispatched immediately because the event itself is the schedule.
        if ($campaign->trigger === 'manual' && $campaign->scheduled_at?->isFuture()) {
            $pending->delay($campaign->scheduled_at);
        }

        return $run;
    }
}
