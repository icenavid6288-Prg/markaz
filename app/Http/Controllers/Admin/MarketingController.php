<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRun;
use App\Models\Order;
use App\Models\User;
use App\Services\Marketing\MarketingCampaignDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MarketingController extends Controller
{
    public function index(): Response
    {
        $campaigns = MarketingCampaign::query()
            ->with(['runs' => fn ($query) => $query->latest()->limit(5)])
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Admin/Marketing/Index', [
            'campaigns' => $campaigns->through(fn (MarketingCampaign $campaign) => $this->presentCampaign($campaign)),
            'stats' => [
                'total' => MarketingCampaign::count(),
                'active' => MarketingCampaign::where('status', 'active')->count(),
                'running' => MarketingCampaign::where('status', 'running')->count(),
                'sent' => (int) MarketingCampaign::sum('sent_count'),
                'runs' => MarketingCampaignRun::where('status', 'completed')->count(),
            ],
            'audienceCounts' => $this->audienceCounts(),
            'options' => $this->options(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Marketing/Form', [
            'campaign' => null,
            'options' => $this->options(),
            'audienceCounts' => $this->audienceCounts(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        MarketingCampaign::create($this->mergeSettings($this->validated($request)));

        return redirect()->route('admin.marketing.index')->with('success', 'کمپین اتومارکتینگ ایجاد شد.');
    }

    /** @param array<string, mixed> $validated */
    private function mergeSettings(array $validated): array
    {
        $settings = array_filter([
            'cooldown_days' => isset($validated['cooldown_days']) ? (int) $validated['cooldown_days'] : null,
        ], fn ($value) => $value !== null);

        unset($validated['cooldown_days']);

        if ($settings !== []) {
            $validated['settings'] = $settings;
        }

        return $validated;
    }

    public function edit(MarketingCampaign $campaign): Response
    {
        return Inertia::render('Admin/Marketing/Form', [
            'campaign' => $this->presentCampaign($campaign),
            'options' => $this->options(),
            'audienceCounts' => $this->audienceCounts(),
        ]);
    }

    public function update(Request $request, MarketingCampaign $campaign): RedirectResponse
    {
        abort_if($campaign->status === 'running', 422, 'کمپین در حال اجراست و فعلاً قابل ویرایش نیست.');
        $campaign->update($this->mergeSettings($this->validated($request)));

        return redirect()->route('admin.marketing.index')->with('success', 'کمپین به‌روزرسانی شد.');
    }

    public function destroy(MarketingCampaign $campaign): RedirectResponse
    {
        abort_if($campaign->status === 'running', 422, 'کمپین در حال اجراست و قابل حذف نیست.');
        $campaign->delete();

        return back()->with('success', 'کمپین حذف شد.');
    }

    public function toggle(MarketingCampaign $campaign): RedirectResponse
    {
        abort_if($campaign->status === 'running', 422, 'کمپین در حال اجراست.');
        $campaign->update(['status' => $campaign->status === 'active' ? 'paused' : 'active']);

        return back()->with('success', $campaign->fresh()->status === 'active' ? 'کمپین فعال شد.' : 'کمپین متوقف شد.');
    }

    public function run(MarketingCampaign $campaign, MarketingCampaignDispatcher $dispatcher): RedirectResponse
    {
        abort_if($campaign->status === 'running', 422, 'این کمپین در حال اجراست.');
        $campaign->update(['status' => 'active']);
        $dispatcher->queue($campaign->fresh());

        return back()->with('success', 'اجرای کمپین در صف قرار گرفت. نتیجه اجرا در تاریخچه کمپین ثبت می‌شود.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'channel' => ['required', 'in:sms,email,in_app'],
            'trigger' => ['required', 'in:manual,lead_created,course_purchased,inactive_user'],
            'audience' => ['required', 'in:all_users,leads,students,parents,customers,inactive_users,imported'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'status' => ['required', 'in:draft,active,paused'],
            'scheduled_at' => ['nullable', 'date'],
            'cooldown_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);
    }

    /** @return array<string, array<string, string>> */
    private function options(): array
    {
        return [
            'channels' => ['sms' => 'پیامک', 'email' => 'ایمیل', 'in_app' => 'اعلان داخل پنل'],
            'triggers' => ['manual' => 'اجرای دستی', 'lead_created' => 'ثبت لید جدید', 'course_purchased' => 'خرید دوره', 'inactive_user' => 'کاربر غیرفعال'],
            'audiences' => ['all_users' => 'همه کاربران فعال', 'leads' => 'لیدهای در حال پیگیری', 'students' => 'نوجوانان و دانش‌آموزان', 'parents' => 'والدین', 'customers' => 'مشتریان دارای خرید', 'inactive_users' => 'کاربران بدون خرید موفق', 'imported' => 'مخاطبان واردشده از Excel'],
            'statuses' => ['draft' => 'پیش‌نویس', 'active' => 'فعال', 'paused' => 'متوقف'],
        ];
    }

    /** @return array<string, int> */
    private function audienceCounts(): array
    {
        return [
            'all_users' => User::where('is_active', true)->count(),
            'leads' => Lead::whereIn('status', ['new', 'contacted', 'interested', 'consultation'])->count(),
            'students' => User::where('is_active', true)->whereHas('roles', fn ($query) => $query->where('name', 'student'))->count(),
            'parents' => User::where('is_active', true)->whereHas('roles', fn ($query) => $query->where('name', 'parent'))->count(),
            'customers' => User::where('is_active', true)->whereHas('orders', fn ($query) => $query->where('status', 'paid'))->count(),
            'inactive_users' => User::where('is_active', true)->whereDoesntHave('orders', fn ($query) => $query->where('status', 'paid'))->count(),
        ];
    }

    /** @return array<string, mixed> */
    private function presentCampaign(MarketingCampaign $campaign): array
    {
        $lastRun = $campaign->runs->first();

        return [
            'id' => $campaign->id,
            'name' => $campaign->name,
            'channel' => $campaign->channel,
            'trigger' => $campaign->trigger,
            'audience' => $campaign->audience,
            'subject' => $campaign->subject,
            'message' => $campaign->message,
            'status' => $campaign->status,
            'scheduled_at' => $campaign->scheduled_at?->format('Y-m-d\\TH:i'),
            'imported_count' => $campaign->recipients()->where('status', 'queued')->count(),
            'cooldown_days' => (int) ($campaign->settings['cooldown_days'] ?? 14),
            'last_run_at' => $campaign->last_run_at?->toISOString(),
            'total_recipients' => $campaign->total_recipients,
            'sent_count' => $campaign->sent_count,
            'failed_count' => $campaign->failed_count,
            'last_run' => $lastRun ? [
                'status' => $lastRun->status,
                'recipients_count' => $lastRun->recipients_count,
                'sent_count' => $lastRun->sent_count,
                'failed_count' => $lastRun->failed_count,
                'completed_at' => $lastRun->completed_at?->toISOString(),
            ] : null,
        ];
    }
}
