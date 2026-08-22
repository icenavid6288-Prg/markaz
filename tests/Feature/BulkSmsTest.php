<?php

namespace Tests\Feature;

use App\Models\BulkSmsRun;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class BulkSmsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_bulk_sms_page_loads_without_channel_column(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->assertFalse(Schema::hasColumn('marketing_campaign_recipients', 'channel'));

        $this->actingAs($admin)
            ->get('/admin/marketing/bulk-sms')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Marketing/BulkSms')
                ->where('stats.totalSent', 0));
    }

    public function test_admin_can_preview_csv_recipients(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $file = UploadedFile::fake()->createWithContent('phones.csv', "موبایل,نام\n09121234567,علی\n09351112233,سارا\n123,نامعتبر\n");

        $this->actingAs($admin)
            ->post('/admin/marketing/bulk-sms/preview', ['file' => $file])
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Marketing/BulkSms')
                ->where('preview.total', 2)
                ->where('preview.skipped', 1)
                ->where('preview.contacts.0.phone', '09121234567'));
    }

    public function test_admin_can_send_bulk_sms_and_reports_open(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $file = UploadedFile::fake()->createWithContent('phones.csv', "phone,name\n09120000001,یک\n");

        $this->actingAs($admin)
            ->post('/admin/marketing/bulk-sms', [
                'file' => $file,
                'message' => 'سلام {name}',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('bulk_sms_runs', [
            'status' => 'completed',
            'recipients_count' => 1,
            'sent_count' => 1,
        ]);
        $this->assertSame(1, BulkSmsRun::count());

        $this->actingAs($admin)
            ->get('/admin/marketing/bulk-sms/reports')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Marketing/BulkSmsReports')
                ->where('stats.runs', 1)
                ->where('stats.sent', 1));
    }
}
