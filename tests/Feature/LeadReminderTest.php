<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Setting;
use App\Models\User;
use App\Services\Crm\LeadService;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class LeadReminderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_pipeline_statuses_move_registered_then_customer(): void
    {
        $user = User::factory()->create(['phone' => '09120000005']);

        $leads = app(LeadService::class);
        $lead = $leads->findOrCreate('09120000005', 'سرنخ پایپلاین');
        $leads->linkToUser($lead, $user, 'لید از ثبت‌نام در سایت');

        $this->assertSame('registered', $lead->fresh()->status);

        $leads->markCustomer($user, 'خرید موفق: دوره نمونه');

        $this->assertSame('customer', $lead->fresh()->status);
    }

    public function test_reminder_command_sends_sms_to_stale_leads_only(): void
    {
        Setting::set('lead_reminder_enabled', '1');
        Setting::set('lead_reminder_days', '7');
        Setting::set('lead_reminder_cooldown_days', '7');
        Setting::set('sms_driver', 'log');
        Setting::set('sms_enabled', '1');
        Setting::set('lead_reminder_sms_message', '{name} عزیز، گفتگوی ما ناتمام ماند. {site_name}');

        // 1) stale lead → should be reminded
        $stale = Lead::create([
            'name' => 'سرنخ قدیمی',
            'phone' => '09120000001',
            'source' => 'website',
            'status' => 'new',
            'last_activity_at' => now()->subDays(10),
        ]);

        // 2) fresh lead → should be skipped
        Lead::create([
            'name' => 'سرنخ تازه',
            'phone' => '09120000002',
            'source' => 'website',
            'status' => 'new',
            'last_activity_at' => now(),
        ]);

        // 3) customer → never reminded
        Lead::create([
            'name' => 'مشتری وفادار',
            'phone' => '09120000003',
            'source' => 'website',
            'status' => 'customer',
            'last_activity_at' => now()->subDays(20),
        ]);

        // 4) stale but reminded within cooldown → skipped
        Lead::create([
            'name' => 'سرنخ اخیراً یادآوری‌شده',
            'phone' => '09120000004',
            'source' => 'website',
            'status' => 'new',
            'last_activity_at' => now()->subDays(10),
            'last_reminded_at' => now()->subDays(2),
        ]);

        Artisan::call('crm:remind-stale-leads');

        $this->assertDatabaseHas('lead_activities', [
            'lead_id' => $stale->id,
            'type' => 'reminder',
        ]);
        $this->assertNotNull($stale->fresh()->last_reminded_at);

        $this->assertDatabaseMissing('lead_activities', [
            'lead_id' => Lead::where('phone', '09120000002')->value('id'),
            'type' => 'reminder',
        ]);
        $this->assertDatabaseMissing('lead_activities', [
            'lead_id' => Lead::where('phone', '09120000003')->value('id'),
            'type' => 'reminder',
        ]);
        $this->assertDatabaseMissing('lead_activities', [
            'lead_id' => Lead::where('phone', '09120000004')->value('id'),
            'type' => 'reminder',
        ]);
    }

    public function test_reminder_command_sends_a_stronger_second_message_after_fourteen_days(): void
    {
        Setting::set('lead_reminder_enabled', '1');
        Setting::set('lead_reminder_first_enabled', '1');
        Setting::set('lead_reminder_first_days', '7');
        Setting::set('lead_reminder_first_cooldown_days', '7');
        Setting::set('lead_reminder_first_sms_message', 'پیام اول برای {name}');
        Setting::set('lead_reminder_second_enabled', '1');
        Setting::set('lead_reminder_second_days', '14');
        Setting::set('lead_reminder_second_cooldown_days', '7');
        Setting::set('lead_reminder_second_sms_message', 'پیشنهاد ویژه و مشاوره رایگان برای {name}');
        Setting::set('sms_driver', 'log');
        Setting::set('sms_enabled', '1');

        $lead = Lead::create([
            'name' => 'لید دومرحله‌ای',
            'phone' => '09120000008',
            'source' => 'website',
            'status' => 'new',
            'last_activity_at' => now()->subDays(8),
        ]);

        Artisan::call('crm:remind-stale-leads');
        $this->assertSame(1, $lead->fresh()->reminder_stage);
        $this->assertDatabaseHas('lead_activities', [
            'lead_id' => $lead->id,
            'type' => 'reminder',
            'description' => 'پیامک اول یادآوری خودکار برای لید بی‌پاسخ',
        ]);

        // At day 8 the second message must not be sent yet.
        $this->assertSame(1, $lead->fresh()->activities()->count());

        $lead->last_activity_at = now()->subDays(15);
        $lead->last_reminded_at = now()->subDays(8);
        $lead->save();
        Artisan::call('crm:remind-stale-leads');

        $this->assertSame(2, $lead->fresh()->reminder_stage);
        $this->assertSame(2, $lead->fresh()->activities()->where('type', 'reminder')->count());
        $this->assertDatabaseHas('lead_activities', [
            'lead_id' => $lead->id,
            'type' => 'reminder',
            'description' => 'پیامک دوم پیگیری خودکار با پیشنهاد ویژه و مشاوره رایگان',
        ]);

        // A third scheduler run cannot send a third reminder.
        $lead->last_reminded_at = now()->subDays(30);
        $lead->save();
        Artisan::call('crm:remind-stale-leads');
        $this->assertSame(2, $lead->fresh()->activities()->where('type', 'reminder')->count());
    }

    public function test_reminder_command_respects_cooldown_and_dry_run(): void
    {
        Setting::set('lead_reminder_enabled', '1');
        Setting::set('lead_reminder_days', '7');
        Setting::set('lead_reminder_cooldown_days', '7');
        Setting::set('sms_driver', 'log');
        Setting::set('lead_reminder_sms_message', 'پیام یادآوری');

        // Cooldown elapsed → eligible again
        $eligibleAgain = Lead::create([
            'name' => 'دوباره واجد شرایط',
            'phone' => '09120000006',
            'source' => 'website',
            'status' => 'new',
            'last_activity_at' => now()->subDays(10),
            'last_reminded_at' => now()->subDays(10),
        ]);

        // Dry run must not persist anything
        $before = $eligibleAgain->fresh()->last_reminded_at;
        Artisan::call('crm:remind-stale-leads', ['--dry' => true]);
        $this->assertDatabaseMissing('lead_activities', ['lead_id' => $eligibleAgain->id, 'type' => 'reminder']);
        $this->assertTrue($eligibleAgain->fresh()->last_reminded_at->equalTo($before));

        // Real run persists
        Artisan::call('crm:remind-stale-leads');
        $this->assertDatabaseHas('lead_activities', ['lead_id' => $eligibleAgain->id, 'type' => 'reminder']);
    }

    public function test_reminder_command_skips_staff_linked_leads(): void
    {
        Setting::set('lead_reminder_enabled', '1');
        Setting::set('lead_reminder_days', '7');
        Setting::set('lead_reminder_cooldown_days', '7');
        Setting::set('sms_driver', 'log');
        Setting::set('lead_reminder_sms_message', 'پیام یادآوری');

        $staff = User::factory()->create(['phone' => '09120000007']);
        $staff->assignRole('instructor');

        $lead = Lead::create([
            'name' => 'لید کارکن',
            'phone' => '09120000007',
            'user_id' => $staff->id,
            'source' => 'registration',
            'status' => 'registered',
            'last_activity_at' => now()->subDays(15),
        ]);

        Artisan::call('crm:remind-stale-leads');

        $this->assertDatabaseMissing('lead_activities', ['lead_id' => $lead->id, 'type' => 'reminder']);
    }
}
