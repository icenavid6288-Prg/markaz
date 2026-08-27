<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingCampaignRun;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmAutomationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_registration_creates_a_lead_and_dispatches_lead_campaign(): void
    {
        MarketingCampaign::create([
            'name' => 'خوش‌آمد به ثبت‌نام‌شده‌ها',
            'channel' => 'sms',
            'trigger' => 'lead_created',
            'audience' => 'leads',
            'message' => 'سلام {name}، به مسیر رشد خوش آمدید.',
            'status' => 'active',
        ]);

        // Registration is two-step: submit the form, then verify the SMS code.
        $this->post('/register', [
            'name' => 'والد جدید',
            'phone' => '09120000001',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('register', ['step' => 'code'], absolute: false));

        $code = session('register_dev_code');
        $this->assertNotNull($code);

        $this->post('/register/verify', [
            'phone' => '09120000001',
            'code' => $code,
        ])->assertRedirect('/dashboard');

        $this->assertDatabaseHas('leads', [
            'phone' => '09120000001',
            'name' => 'والد جدید',
            'source' => 'registration',
            'status' => 'registered',
        ]);

        $campaign = MarketingCampaign::firstOrFail();
        $this->assertSame(1, $campaign->fresh()->sent_count);
        $this->assertSame('completed', MarketingCampaignRun::firstOrFail()->status);
    }

    public function test_onboarding_enriches_the_existing_lead_of_the_user(): void
    {
        $user = User::factory()->create(['phone' => '09120000002']);
        Lead::create([
            'name' => $user->name,
            'phone' => $user->phone,
            'source' => 'website',
            'status' => 'new',
        ]);

        $this->actingAs($user)->post('/dashboard/onboarding', [
            'audience' => 'parent',
            'child_age' => 15,
            'grade' => 'پایه دهم',
            'primary_goal' => 'کشف استعداد و برنامه‌ریزی تحصیلی',
            'current_need' => 'ابتدای راه هستم',
        ])->assertRedirect('/dashboard');

        $this->assertDatabaseHas('leads', [
            'phone' => $user->phone,
            'child_age' => 15,
            'grade' => 'پایه دهم',
            'need' => 'کشف استعداد و برنامه‌ریزی تحصیلی',
            'service_type' => 'parent',
            'source' => 'registration',
            'status' => 'registered',
        ]);
    }

    public function test_inactive_campaign_runs_daily_records_recipients_and_respects_cooldown(): void
    {
        User::factory()->create(['name' => 'کاربر بدون خرید']);

        MarketingCampaign::create([
            'name' => 'پیگیری کاربر غیرفعال',
            'channel' => 'sms',
            'trigger' => 'inactive_user',
            'audience' => 'inactive_users',
            'message' => 'سلام {name}، هنوز منتظریم تا مسیر رشدتان را شروع کنید.',
            'status' => 'active',
            'settings' => ['cooldown_days' => 14],
        ]);

        $this->artisan('crm:dispatch-inactive-campaigns')
            ->expectsOutput('1 inactive-user campaign(s) dispatched.')
            ->assertExitCode(0);

        $campaign = MarketingCampaign::firstOrFail();
        $this->assertSame(1, $campaign->fresh()->sent_count);
        $this->assertSame('completed', MarketingCampaignRun::firstOrFail()->status);
        $this->assertDatabaseHas('marketing_campaign_recipients', [
            'campaign_id' => $campaign->id,
            'name' => 'کاربر بدون خرید',
            'status' => 'sent',
        ]);
        $this->assertNotNull(MarketingCampaignRecipient::firstOrFail()->user_id);

        // The campaign just ran, so the campaign-level cooldown blocks a second run.
        $this->artisan('crm:dispatch-inactive-campaigns')
            ->expectsOutput('0 inactive-user campaign(s) dispatched.')
            ->assertExitCode(0);
    }

    public function test_inactive_campaign_cooldown_excludes_users_already_sent_recently(): void
    {
        $user = User::factory()->create(['name' => 'دریافت‌کننده قبلی']);

        $campaign = MarketingCampaign::create([
            'name' => 'پیگیری مجدد',
            'channel' => 'sms',
            'trigger' => 'inactive_user',
            'audience' => 'inactive_users',
            'message' => 'سلام {name}',
            'status' => 'active',
            'settings' => ['cooldown_days' => 14],
            'last_run_at' => now()->subDays(30),
        ]);

        // The user already received this campaign within the cooldown window.
        MarketingCampaignRecipient::create([
            'campaign_id' => $campaign->id,
            'user_id' => $user->id,
            'name' => $user->name,
            'phone' => $user->phone,
            'status' => 'sent',
            'sent_at' => now()->subDays(2),
        ]);

        $this->artisan('crm:dispatch-inactive-campaigns')
            ->expectsOutput('1 inactive-user campaign(s) dispatched.')
            ->assertExitCode(0);

        // The per-user cooldown keeps this user out of the recipient list.
        $this->assertSame(0, $campaign->fresh()->sent_count);
        $this->assertSame('completed', MarketingCampaignRun::firstOrFail()->status);
    }
}
