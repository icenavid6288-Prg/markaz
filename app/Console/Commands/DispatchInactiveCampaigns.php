<?php

namespace App\Console\Commands;

use App\Models\MarketingCampaign;
use App\Services\Marketing\MarketingCampaignDispatcher;
use Illuminate\Console\Command;

class DispatchInactiveCampaigns extends Command
{
    protected $signature = 'crm:dispatch-inactive-campaigns';

    protected $description = 'Dispatch follow-up campaigns for users who registered but never bought';

    public function handle(MarketingCampaignDispatcher $dispatcher): int
    {
        $count = 0;

        MarketingCampaign::query()
            ->where('status', 'active')
            ->where('trigger', 'inactive_user')
            ->where('audience', 'inactive_users')
            ->get()
            ->each(function (MarketingCampaign $campaign) use (&$count, $dispatcher): void {
                $cooldownDays = (int) ($campaign->settings['cooldown_days'] ?? 14);

                // Campaign-level gate: only run again once the cooldown window
                // after the previous completed run has elapsed.
                if ($campaign->last_run_at && $campaign->last_run_at->gt(now()->subDays($cooldownDays))) {
                    return;
                }

                $dispatcher->queue($campaign->fresh());
                $count++;
            });

        $this->info("{$count} inactive-user campaign(s) dispatched.");

        return self::SUCCESS;
    }
}
