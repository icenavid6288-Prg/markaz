<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRun;
use App\Models\Order;
use App\Models\PageView;
use App\Models\User;
use App\Models\UserOnboardingProfile;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_crm_dashboard_shows_funnel_conversion_campaigns_and_activities(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create(['phone' => '09120000001']);
        $lead = Lead::create([
            'name' => 'سرنخ نمونه',
            'phone' => '09120000001',
            'user_id' => $user->id,
            'source' => 'registration',
            'status' => 'customer',
            'last_activity_at' => now(),
        ]);
        $lead->activities()->create(['type' => 'purchase', 'description' => 'خرید موفق: دوره نمونه']);
        Lead::create(['name' => 'سرنخ جدید', 'phone' => '09120000002', 'source' => 'website', 'status' => 'new']);

        $campaign = MarketingCampaign::create([
            'name' => 'کمپین پیگیری',
            'channel' => 'sms',
            'trigger' => 'inactive_user',
            'audience' => 'inactive_users',
            'message' => 'پیام کمپین',
            'status' => 'active',
            'total_recipients' => 10,
            'sent_count' => 4,
        ]);
        MarketingCampaignRun::create([
            'campaign_id' => $campaign->id,
            'status' => 'running',
            'recipients_count' => 10,
            'sent_count' => 4,
            'failed_count' => 1,
            'started_at' => now()->subMinute(),
        ]);

        $this->actingAs($admin)
            ->get('/admin/crm')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Crm/Dashboard')
                ->where('stats.total', 2)
                ->where('stats.customers', 1)
                ->has('funnel', 6)
                ->where('funnel.0.key', 'new')
                ->where('funnel.5.key', 'customer')
                ->has('campaigns', 1)
                ->where('campaigns.0.id', $campaign->id)
                ->where('campaigns.0.latest_run.status', 'running')
                ->where('campaigns.0.latest_run.recipients_count', 10)
                ->where('campaigns.0.latest_run.failed_count', 1)
                ->has('activities', 1)
                ->where('activities.0.type', 'purchase'));
    }

    public function test_crm_dashboard_lists_leads_needing_attention(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // Stale lead — no activity for 5 days
        Lead::create(['name' => 'بی‌پاسخ قدیمی', 'phone' => '09120000011', 'source' => 'website', 'status' => 'new', 'last_activity_at' => now()->subDays(5)]);

        // Lead with an open follow-up note (latest activity is a follow-up)
        $followUp = Lead::create(['name' => 'پیگیری باز', 'phone' => '09120000012', 'source' => 'website', 'status' => 'interested', 'last_activity_at' => now()->subHours(2)]);
        $followUp->activities()->create(['type' => 'follow_up', 'description' => 'پس از مشاوره تماس بگیرید']);

        // Lead in consultation stage
        Lead::create(['name' => 'در مشاوره', 'phone' => '09120000013', 'source' => 'website', 'status' => 'consultation', 'last_activity_at' => now()->subDay()]);

        $this->actingAs($admin)
            ->get('/admin/crm')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Crm/Dashboard')
                ->has('attention.stale', 1)
                ->where('attention.stale.0.name', 'بی‌پاسخ قدیمی')
                ->has('attention.follow_up', 1)
                ->where('attention.follow_up.0.name', 'پیگیری باز')
                ->where('attention.follow_up.0.note', 'پس از مشاوره تماس بگیرید')
                ->has('attention.consultation', 1)
                ->where('attention.consultation.0.name', 'در مشاوره'));
    }

    public function test_crm_dashboard_trend_counts_new_leads_and_customers_per_day(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create(['phone' => '09120000021']);

        // Two leads created two days ago, one created today.
        $old = Lead::create(['name' => 'لید دو روز پیش', 'phone' => '09120000021', 'source' => 'website', 'status' => 'new']);
        $old->created_at = now()->subDays(2);
        $old->save();
        $old2 = Lead::create(['name' => 'لید دو روز پیش دوم', 'phone' => '09120000022', 'source' => 'website', 'status' => 'new']);
        $old2->created_at = now()->subDays(2);
        $old2->save();
        Lead::create(['name' => 'لید امروز', 'phone' => '09120000023', 'source' => 'website', 'status' => 'new']);

        // One customer conversion yesterday.
        $activity = $old->activities()->create(['type' => 'purchase', 'description' => 'خرید موفق: دوره نمونه']);
        $activity->created_at = now()->subDay();
        $activity->save();

        $response = $this->actingAs($admin)->get('/admin/crm')->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Crm/Dashboard')
            ->has('trend', 30)
            ->where('trend_totals.new', 3)
            ->where('trend_totals.customers', 1));

        $trend = $this->inertiaProp($response, 'trend');
        $day2 = now()->subDays(2)->format('d/m');
        $day1 = now()->subDay()->format('d/m');
        $today = now()->format('d/m');

        $this->assertSame(2, collect($trend)->firstWhere('label', $day2)['new']);
        $this->assertSame(1, collect($trend)->firstWhere('label', $day1)['customers']);
        $this->assertSame(1, collect($trend)->firstWhere('label', $today)['new']);
    }

    private function inertiaProp($response, string $key)
    {
        $props = $response->getOriginalContent()->getData()['page']['props'] ?? [];

        return $props[$key];
    }

    public function test_leads_page_conversion_funnel_respects_range(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // 3 unique visitors in the last 7 days, 1 older visitor.
        foreach (['ip1', 'ip2', 'ip3'] as $ip) {
            PageView::create(['url' => '/courses', 'title' => 'دوره‌ها', 'ip_hash' => $ip, 'visited_at' => now()->subDays(2)]);
        }
        PageView::create(['url' => '/courses', 'title' => 'دوره‌ها', 'ip_hash' => 'ip4', 'visited_at' => now()->subDays(10)]);

        // 2 leads in range, 1 older.
        Lead::create(['name' => 'لید یک', 'phone' => '09120000031', 'source' => 'website', 'status' => 'new']);
        Lead::create(['name' => 'لید دو', 'phone' => '09120000032', 'source' => 'website', 'status' => 'new']);
        $oldLead = Lead::create(['name' => 'لید قدیمی', 'phone' => '09120000033', 'source' => 'website', 'status' => 'new']);
        $oldLead->created_at = now()->subDays(10);
        $oldLead->save();

        // 1 registration in range, 1 older.
        User::factory()->create(['phone' => '09120000034']);
        $oldUser = User::factory()->create(['phone' => '09120000035']);
        $oldUser->created_at = now()->subDays(10);
        $oldUser->save();

        // 1 paid order in range, 1 older.
        $buyer = User::factory()->create(['phone' => '09120000036']);
        Order::create(['order_number' => 'T-1', 'user_id' => $buyer->id, 'status' => 'paid', 'total' => 1000, 'paid_at' => now()->subDay()]);
        Order::create(['order_number' => 'T-2', 'user_id' => $buyer->id, 'status' => 'paid', 'total' => 1000, 'paid_at' => now()->subDays(10)]);

        $this->actingAs($admin)
            ->get('/admin/leads?range=7')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Leads/Index')
                ->where('funnelRange', 7)
                ->where('conversionFunnel.0.count', 3)
                ->where('conversionFunnel.1.count', 2)
                // admin + buyer + in-range registration are all new users in this window
                ->where('conversionFunnel.2.count', 3)
                ->where('conversionFunnel.3.count', 1)
                ->where('conversionFunnel.1.conversion_from_previous', round(2 / 3 * 100, 1)));

        // Wider range includes the older records.
        $this->actingAs($admin)
            ->get('/admin/leads?range=90')
            ->assertInertia(fn ($page) => $page
                ->where('funnelRange', 90)
                ->where('conversionFunnel.0.count', 4)
                ->where('conversionFunnel.1.count', 3)
                ->where('conversionFunnel.2.count', 4)
                ->where('conversionFunnel.3.count', 2));
    }

    public function test_editor_cannot_access_crm_dashboard(): void
    {
        $editor = User::factory()->create();
        $editor->assignRole('editor');

        $this->actingAs($editor)->get('/admin/crm')->assertForbidden();
    }

    public function test_leads_page_scores_and_sorts_by_priority(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // Hot lead: registration source + completed onboarding + 3 pricing views + fresh.
        $hotUser = User::factory()->create(['phone' => '09120000041']);
        UserOnboardingProfile::create(['user_id' => $hotUser->id, 'completed_at' => now()]);
        foreach (['/courses', '/courses/abc', '/checkout'] as $i => $url) {
            PageView::create(['url' => $url, 'title' => 'قیمت', 'user_id' => $hotUser->id, 'visited_at' => now()->subHours($i + 1)]);
        }
        $hot = Lead::create(['name' => 'لید داغ', 'phone' => '09120000041', 'user_id' => $hotUser->id, 'source' => 'registration', 'status' => 'new']);

        // Cold lead: website source, no user, 40 days old.
        $cold = Lead::create(['name' => 'لید سرد', 'phone' => '09120000042', 'source' => 'website', 'status' => 'new']);
        $cold->created_at = now()->subDays(40);
        $cold->save();

        $this->actingAs($admin)
            ->get('/admin/leads')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Leads/Index')
                ->where('leads.total', 2)
                ->where('filters.sort', 'score')
                ->where('leads.data.0.id', $hot->id)
                ->where('leads.data.0.lead_score', 100)
                ->where('leads.data.0.lead_score_breakdown.source', 20)
                ->where('leads.data.0.lead_score_breakdown.onboarding', 25)
                ->where('leads.data.0.lead_score_breakdown.pricing', 25)
                ->where('leads.data.0.lead_score_breakdown.age', 30)
                ->where('leads.data.1.id', $cold->id)
                ->where('leads.data.1.lead_score', 12)
                ->where('leads.data.1.lead_score_breakdown.onboarding', 0)
                ->where('leads.data.1.lead_score_breakdown.pricing', 0)
                ->where('leads.data.1.lead_score_breakdown.age', 0));

        $this->actingAs($admin)
            ->get('/admin/leads?sort=recent')
            ->assertInertia(fn ($page) => $page->where('filters.sort', 'recent'));
    }

    public function test_crm_dashboard_empty_state_is_healthy(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get('/admin/crm')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Crm/Dashboard')
                ->where('stats.total', 0)
                ->where('stats.conversion_rate', 0)
                ->has('funnel', 6)
                ->has('campaigns', 0)
                ->has('activities', 0));
    }
}
