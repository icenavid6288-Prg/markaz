<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\MarketingCampaign;
use Inertia\Inertia;
use Inertia\Response;

class CrmDashboardController extends Controller
{
    public function __invoke(): Response
    {
        $stages = ['new', 'contacted', 'interested', 'consultation', 'registered', 'customer'];
        $counts = Lead::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $total = (int) array_sum($counts);
        $registered = (int) ($counts['registered'] ?? 0);
        $customers = (int) ($counts['customer'] ?? 0);
        $converted = $registered + $customers;

        $funnel = [];
        $runningTotal = $total;
        foreach ($stages as $index => $stage) {
            $stageCount = (int) ($counts[$stage] ?? 0);
            $funnel[] = [
                'key' => $stage,
                'count' => $stageCount,
                'percent_of_total' => $total > 0 ? round($stageCount / $total * 100, 1) : 0,
                'conversion_from_previous' => $index > 0 && $runningTotal > 0
                    ? round($stageCount / $runningTotal * 100)
                    : null,
            ];
            $runningTotal = $stageCount;
        }

        $trend = $this->trend();

        $campaigns = MarketingCampaign::query()
            ->with('latestRun')
            ->whereIn('status', ['active', 'running'])
            ->latest('last_run_at')
            ->limit(6)
            ->get()
            ->map(fn (MarketingCampaign $campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'channel' => $campaign->channel,
                'trigger' => $campaign->trigger,
                'status' => $campaign->status,
                'scheduled_at' => $campaign->scheduled_at?->diffForHumans(),
                'total_recipients' => (int) $campaign->total_recipients,
                'sent_count' => (int) $campaign->sent_count,
                'failed_count' => (int) $campaign->failed_count,
                'latest_run' => $campaign->latestRun ? [
                    'status' => $campaign->latestRun->status,
                    'recipients_count' => (int) $campaign->latestRun->recipients_count,
                    'sent_count' => (int) $campaign->latestRun->sent_count,
                    'failed_count' => (int) $campaign->latestRun->failed_count,
                    'started_at' => $campaign->latestRun->started_at?->diffForHumans(),
                    'completed_at' => $campaign->latestRun->completed_at?->diffForHumans(),
                ] : null,
            ]);

        $activities = LeadActivity::query()
            ->with('lead:id,name,phone,status')
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn (LeadActivity $activity) => [
                'id' => $activity->id,
                'type' => $activity->type,
                'description' => $activity->description,
                'created_at' => $activity->created_at?->diffForHumans(),
                'lead' => $activity->lead ? [
                    'id' => $activity->lead->id,
                    'name' => $activity->lead->name,
                    'phone' => $activity->lead->phone,
                    'status' => $activity->lead->status,
                ] : null,
            ]);

        return Inertia::render('Admin/Crm/Dashboard', [
            'stats' => [
                'total' => $total,
                'new_this_week' => Lead::where('status', 'new')->where('created_at', '>=', now()->subWeek())->count(),
                'customers' => $customers,
                'registered' => $registered,
                'linked' => Lead::whereNotNull('user_id')->count(),
                'conversion_rate' => $total > 0 ? round($converted / $total * 100, 1) : 0,
                'registration_rate' => $total > 0 ? round($converted / $total * 100, 1) : 0,
                'to_customer_rate' => $converted > 0 ? round($customers / $converted * 100) : 0,
            ],
            'funnel' => $funnel,
            'campaigns' => $campaigns,
            'trend' => $trend['days'],
            'trend_totals' => $trend['totals'],
            'attention' => [
                'stale' => $this->presentAttentionLeads(
                    Lead::query()
                        ->whereNot('status', 'customer')
                        ->where('last_activity_at', '<=', now()->subDays(3))
                        ->latest('last_activity_at')
                        ->limit(5)
                        ->get()
                ),
                'follow_up' => Lead::query()
                    ->whereHas('activities', fn ($query) => $query->where('type', 'follow_up'))
                    ->with(['activities' => fn ($query) => $query->latest()->limit(1)])
                    ->get()
                    ->filter(fn (Lead $lead) => $lead->activities->first()?->type === 'follow_up')
                    ->sortByDesc(fn (Lead $lead) => $lead->activities->first()?->created_at)
                    ->take(5)
                    ->values()
                    ->map(fn (Lead $lead) => $this->presentAttentionLead($lead) + [
                        'note' => $lead->activities->first()?->description,
                    ]),
                'consultation' => $this->presentAttentionLeads(
                    Lead::query()
                        ->where('status', 'consultation')
                        ->latest('last_activity_at')
                        ->limit(5)
                        ->get()
                ),
            ],
            'activities' => $activities,
        ]);
    }

    /**
     * Daily new-lead and customer counts for the last 30 days.
     * Customers are counted from purchase activities, so the day reflects
     * when the conversion actually happened.
     *
     * @return array{days: array<int, array<string, mixed>>, totals: array{new: int, customers: int}}
     */
    private function trend(): array
    {
        $since = now()->subDays(29)->startOfDay();

        $newByDay = Lead::query()
            ->where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $customerByDay = LeadActivity::query()
            ->where('type', 'purchase')
            ->where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $days = [];
        $totals = ['new' => 0, 'customers' => 0];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i);
            // Match the UTC date keyed by SQLite/MySQL DATE() on stored UTC timestamps.
            $key = $date->utc()->format('Y-m-d');
            $new = (int) ($newByDay[$key] ?? 0);
            $customers = (int) ($customerByDay[$key] ?? 0);
            $totals['new'] += $new;
            $totals['customers'] += $customers;
            $days[] = [
                'label' => $date->format('d/m'),
                'new' => $new,
                'customers' => $customers,
            ];
        }

        return ['days' => $days, 'totals' => $totals];
    }

    /** @param iterable<Lead> $leads @return array<int, array<string, mixed>> */
    private function presentAttentionLeads(iterable $leads): array
    {
        return collect($leads)->map(fn (Lead $lead) => $this->presentAttentionLead($lead))->all();
    }

    /** @return array<string, mixed> */
    private function presentAttentionLead(Lead $lead): array
    {
        return [
            'id' => $lead->id,
            'name' => $lead->name,
            'phone' => $lead->phone,
            'need' => $lead->need,
            'status' => $lead->status,
            'last_activity_at' => $lead->last_activity_at?->diffForHumans(),
        ];
    }
}
