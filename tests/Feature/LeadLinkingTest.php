<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use App\Services\Crm\LeadService;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadLinkingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_website_form_links_lead_to_existing_user(): void
    {
        $user = User::factory()->create(['phone' => '09120000009']);

        $this->post('/leads', [
            'name' => 'کاربر قبلی',
            'phone' => '09120000009',
            'need' => 'کشف استعداد',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('leads', [
            'phone' => '09120000009',
            'user_id' => $user->id,
            'status' => 'registered',
        ]);
        $this->assertDatabaseHas('lead_activities', [
            'lead_id' => Lead::where('phone', '09120000009')->value('id'),
            'type' => 'registration',
            'description' => 'اتصال خودکار به حساب کاربری موجود',
        ]);
    }

    public function test_registration_links_existing_lead_to_the_new_user(): void
    {
        Lead::create([
            'name' => 'سرنخ قبلی',
            'phone' => '09120000008',
            'source' => 'website',
            'status' => 'new',
        ]);

        // Registration is two-step: submit the form, then verify the SMS code.
        $this->post('/register', [
            'name' => 'ثبت‌نام‌کننده',
            'phone' => '09120000008',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect(route('register', ['step' => 'code'], absolute: false));

        $code = session('register_dev_code');
        $this->assertNotNull($code);

        $this->post('/register/verify', [
            'phone' => '09120000008',
            'code' => $code,
        ])->assertRedirect('/dashboard');

        $lead = Lead::where('phone', '09120000008')->firstOrFail();
        $this->assertNotNull($lead->user_id);
        $this->assertSame('registered', $lead->status);
        $this->assertDatabaseHas('lead_activities', [
            'lead_id' => $lead->id,
            'type' => 'registration',
        ]);
    }

    public function test_successful_purchase_marks_lead_as_customer_with_history(): void
    {
        $user = User::factory()->create(['phone' => '09120000007']);

        $leads = app(LeadService::class);
        $leads->markCustomer($user, 'خرید موفق: دوره مهارت‌های آینده — 1405/05/20 10:00');

        $this->assertDatabaseHas('leads', [
            'phone' => '09120000007',
            'user_id' => $user->id,
            'status' => 'customer',
        ]);
        $this->assertDatabaseHas('lead_activities', [
            'lead_id' => Lead::where('phone', '09120000007')->value('id'),
            'type' => 'purchase',
        ]);
    }

    public function test_admin_crm_page_shows_lead_cards_with_activity_timeline(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $user = User::factory()->create(['phone' => '09120000006']);
        $lead = Lead::create([
            'name' => 'سرنخ نمونه',
            'phone' => '09120000006',
            'user_id' => $user->id,
            'source' => 'registration',
            'status' => 'customer',
            'last_activity_at' => now(),
        ]);
        $lead->activities()->create(['type' => 'purchase', 'description' => 'خرید موفق: دوره نمونه']);

        $this->actingAs($admin)
            ->get('/admin/leads')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Leads/Index')
                ->has('stats')
                ->has('leads.data', 1)
                ->has('leads.data.0.activities', 1));
    }

    public function test_editor_cannot_access_crm_page(): void
    {
        $editor = User::factory()->create();
        $editor->assignRole('editor');

        $this->actingAs($editor)->get('/admin/leads')->assertForbidden();
    }
}
