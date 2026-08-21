<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Order;
use App\Models\PageView;
use App\Models\User;
use App\Models\UserOnboardingProfile;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminLeadsController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Lead::query()
            ->with(['user:id,name,phone', 'activities:id,lead_id,type,description,created_at']);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('need', 'like', "%{$search}%");
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        $range = (int) $request->integer('range', 30);
        $range = in_array($range, [7, 30, 90], true) ? $range : 30;
        $since = now()->subDays($range);

        $sort = $request->string('sort')->toString() === 'recent' ? 'recent' : 'score';
        $leads = $this->scoreLeads($query->get());

        $leads = $leads->sort(function (Lead $a, Lead $b) use ($sort): int {
            $recent = fn (Lead $lead) => $lead->last_activity_at?->timestamp ?? $lead->created_at?->timestamp ?? 0;
            $primary = $sort === 'recent' ? $recent($b) <=> $recent($a) : $b->lead_score <=> $a->lead_score;

            return $primary !== 0 ? $primary : $recent($b) <=> $recent($a);
        });

        $perPage = 12;
        $page = max(1, $request->integer('page', 1));
        $paginator = new LengthAwarePaginator(
            $leads->forPage($page, $perPage)->values(),
            $leads->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $items = $paginator->getCollection()->map(fn (Lead $lead) => [
            'id' => $lead->id,
            'name' => $lead->name,
            'phone' => $lead->phone,
            'email' => $lead->email,
            'need' => $lead->need,
            'child_age' => $lead->child_age,
            'grade' => $lead->grade,
            'service_type' => $lead->service_type,
            'source' => $lead->source,
            'status' => $lead->status,
            'created_at' => $lead->created_at?->diffForHumans(),
            'lead_score' => $lead->lead_score,
            'lead_score_breakdown' => $lead->lead_score_breakdown,
            'user' => $lead->user ? ['id' => $lead->user->id, 'name' => $lead->user->name, 'phone' => $lead->user->phone] : null,
            'activities' => $lead->activities->take(8)->values()->map(fn ($activity) => [
                'id' => $activity->id,
                'type' => $activity->type,
                'description' => $activity->description,
                'created_at' => $activity->created_at?->diffForHumans(),
            ]),
        ]);

        return Inertia::render('Admin/Leads/Index', [
            'leads' => [
                'data' => $items->all(),
                'links' => $paginator->linkCollection()->map(fn ($link) => [
                    'url' => $link['url'],
                    'label' => $link['label'],
                    'active' => $link['active'],
                ])->all(),
                'total' => $paginator->total(),
            ],
            'stats' => [
                'total' => Lead::count(),
                'new' => Lead::where('status', 'new')->count(),
                'registered' => Lead::where('status', 'registered')->count(),
                'customers' => Lead::where('status', 'customer')->count(),
                'linked' => Lead::whereNotNull('user_id')->count(),
            ],
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'sort' => $sort,
            ],
            'funnelRange' => $range,
            'conversionFunnel' => $this->conversionFunnel($range),
        ]);
    }

    /**
     * امتیاز اولویت هر لید را با یک بار کوئری دسته‌ای محاسبه می‌کند:
     * منبع + تکمیل آنبوردینگ + بازدید از صفحات قیمت + تازگی لید (مجموع ۰ تا ۱۰۰).
     */
    private function scoreLeads(Collection $leads): Collection
    {
        $userIds = $leads->pluck('user_id')->filter()->unique()->values();

        $onboarded = collect();
        $pricingViews = collect();
        if ($userIds->isNotEmpty()) {
            $onboarded = UserOnboardingProfile::whereIn('user_id', $userIds)
                ->whereNotNull('completed_at')
                ->pluck('user_id');
            $pricingViews = PageView::whereIn('user_id', $userIds)
                ->where(function ($builder): void {
                    $builder->where('url', 'like', '%/courses%')
                        ->orWhere('url', 'like', '%/services%')
                        ->orWhere('url', 'like', '%/checkout%')
                        ->orWhere('url', 'like', '%/cart%');
                })
                ->selectRaw('user_id, COUNT(*) as cnt')
                ->groupBy('user_id')
                ->pluck('cnt', 'user_id');
        }

        return $leads->map(function (Lead $lead) use ($onboarded, $pricingViews): Lead {
            $breakdown = [
                'source' => Lead::sourceScore($lead->source),
                'onboarding' => $lead->user_id && $onboarded->contains($lead->user_id) ? 25 : 0,
                'pricing' => Lead::pricingScore((int) ($pricingViews[$lead->user_id] ?? 0)),
                'age' => Lead::ageScore($lead->created_at),
            ];

            $lead->setAttribute('lead_score', array_sum($breakdown));
            $lead->setAttribute('lead_score_breakdown', $breakdown);

            return $lead;
        });
    }

    /**
     * بازدید ← لید ← ثبت‌نام ← خرید with the conversion rate between stages.
     *
     * @return array<int, array<string, mixed>>
     */
    private function conversionFunnel(int $range): array
    {
        $since = now()->subDays($range);

        $stages = [
            [
                'key' => 'visits',
                'label' => 'بازدید',
                'hint' => 'بازدیدکنندهٔ یکتا در این بازه',
                'count' => (int) PageView::query()
                    ->where('visited_at', '>=', $since)
                    ->distinct()
                    ->count(DB::raw('COALESCE(user_id, ip_hash)')),
            ],
            [
                'key' => 'leads',
                'label' => 'لید',
                'hint' => 'سرنخ ساخته‌شده در این بازه',
                'count' => (int) Lead::where('created_at', '>=', $since)->count(),
            ],
            [
                'key' => 'registrations',
                'label' => 'ثبت‌نام',
                'hint' => 'کاربر ثبت‌نام‌کرده در این بازه',
                'count' => (int) User::where('created_at', '>=', $since)->count(),
            ],
            [
                'key' => 'purchases',
                'label' => 'خرید',
                'hint' => 'سفارش پرداخت‌شده در این بازه',
                'count' => (int) Order::where('status', 'paid')->where('paid_at', '>=', $since)->count(),
            ],
        ];

        $first = $stages[0]['count'];
        foreach ($stages as $index => $stage) {
            $previous = $index > 0 ? $stages[$index - 1]['count'] : $stage['count'];
            $stages[$index]['percent_of_first'] = $first > 0 ? round($stage['count'] / $first * 100, 1) : null;
            $stages[$index]['conversion_from_previous'] = $index > 0 && $previous > 0
                ? round($stage['count'] / $previous * 100, 1)
                : null;
        }

        $stages[0]['overall'] = $first > 0
            ? round($stages[3]['count'] / $first * 100, 2)
            : null;

        return $stages;
    }
}
