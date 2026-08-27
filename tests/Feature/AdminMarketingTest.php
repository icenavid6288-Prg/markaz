<?php

namespace Tests\Feature;

use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Models\MarketingCampaignRun;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminMarketingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_admin_can_create_and_run_a_marketing_campaign(): void
    {
        $admin = User::factory()->create(['name' => 'مدیر کمپین']);
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get('/admin/marketing')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Marketing/Index')
                ->has('stats')
                ->has('audienceCounts')
                ->has('options'));

        $this->actingAs($admin)
            ->post('/admin/marketing', [
                'name' => 'خوش‌آمدگویی کاربران جدید',
                'channel' => 'sms',
                'trigger' => 'manual',
                'audience' => 'all_users',
                'message' => 'سلام {name}، به مسیر رشد خوش آمدید.',
                'status' => 'active',
            ])
            ->assertRedirect('/admin/marketing');

        $campaign = MarketingCampaign::firstOrFail();
        $this->assertSame('active', $campaign->status);

        $this->actingAs($admin)
            ->post("/admin/marketing/{$campaign->id}/run")
            ->assertSessionHas('success');

        $this->assertSame('active', $campaign->fresh()->status);
        $this->assertSame(1, $campaign->fresh()->sent_count);
        $this->assertSame('completed', MarketingCampaignRun::firstOrFail()->status);
    }

    public function test_admin_can_import_csv_recipients_and_start_campaign(): void
    {
        $admin = User::factory()->create(['name' => 'مدیر ورود فایل']);
        $admin->assignRole('admin');
        $campaign = MarketingCampaign::create([
            'name' => 'کمپین فایل Excel',
            'channel' => 'sms',
            'trigger' => 'manual',
            'audience' => 'all_users',
            'message' => 'سلام {name}، پیام اختصاصی شما.',
            'status' => 'draft',
        ]);
        $file = UploadedFile::fake()->createWithContent('recipients.csv', "نام,موبایل,ایمیل\nمخاطب اول,09120000000,first@example.com\nمخاطب تکراری,09120000000,duplicate@example.com\nردیف نامعتبر,123,not-an-email\n");

        $this->actingAs($admin)->post(route('admin.marketing.import', $campaign), [
            'file' => $file,
            'replace' => true,
            'start_campaign' => true,
        ])->assertSessionHas('success');

        $campaign = $campaign->fresh();
        $this->assertSame('imported', $campaign->audience);
        $this->assertSame('active', $campaign->status);
        $this->assertSame(1, MarketingCampaignRecipient::where('campaign_id', $campaign->id)->count());
        $this->assertSame(1, $campaign->sent_count);
        $this->assertSame('sent', MarketingCampaignRecipient::where('campaign_id', $campaign->id)->value('status'));
        $this->assertSame('completed', MarketingCampaignRun::where('campaign_id', $campaign->id)->firstOrFail()->status);
    }

    public function test_editor_and_student_cannot_manage_marketing(): void
    {
        $editor = User::factory()->create();
        $editor->assignRole('editor');
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->actingAs($editor)->get('/admin/marketing')->assertForbidden();
        $this->actingAs($student)->get('/admin/marketing')->assertForbidden();
    }

    public function test_admin_can_import_xlsx_with_persian_headers(): void
    {
        if (! class_exists('ZipArchive')) {
            $this->markTestSkipped('ZipArchive extension is required for XLSX tests.');
        }
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $campaign = MarketingCampaign::create(['name' => 'کمپین XLSX', 'channel' => 'sms', 'trigger' => 'manual', 'audience' => 'all_users', 'message' => 'سلام {name}', 'status' => 'draft']);
        $path = tempnam(sys_get_temp_dir(), 'marketing-xlsx-');
        $zip = new \ZipArchive();
        $zip->open($path, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        $zip->addFromString('xl/worksheets/sheet1.xml', '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row><c r="A1" t="inlineStr"><is><t>نام</t></is></c><c r="B1" t="inlineStr"><is><t>موبایل</t></is></c></row><row><c r="A2" t="inlineStr"><is><t>مخاطب XLSX</t></is></c><c r="B2" t="inlineStr"><is><t>۰۹۱۲۰۰۰۰۰۰۰</t></is></c></row><row><c r="A3" t="inlineStr"><is><t>ردیف نامعتبر</t></is></c><c r="B3" t="inlineStr"><is><t>۱۲۳</t></is></c></row></sheetData></worksheet>');
        $zip->close();
        $bytes = file_get_contents($path);
        unlink($path);

        $this->actingAs($admin)->post(route('admin.marketing.import', $campaign), ['file' => UploadedFile::fake()->createWithContent('recipients.xlsx', $bytes), 'start_campaign' => false])
            ->assertSessionHas('success', fn (string $message): bool => str_contains($message, '1 ردیف نامعتبر نادیده گرفته شد'));
        $this->assertDatabaseCount('marketing_campaign_recipients', 1);
        $this->assertDatabaseHas('marketing_campaign_recipients', ['campaign_id' => $campaign->id, 'phone' => '09120000000', 'name' => 'مخاطب XLSX', 'status' => 'queued']);
    }

    public function test_editor_cannot_import_campaign_recipients(): void
    {
        $editor = User::factory()->create();
        $editor->assignRole('editor');
        $campaign = MarketingCampaign::create(['name' => 'کمپین محدود', 'channel' => 'sms', 'trigger' => 'manual', 'audience' => 'all_users', 'message' => 'پیام', 'status' => 'draft']);
        $file = UploadedFile::fake()->createWithContent('recipients.csv', "phone\n09120000000\n");

        $this->actingAs($editor)->post(route('admin.marketing.import', $campaign), ['file' => $file])->assertForbidden();
        $this->assertDatabaseCount('marketing_campaign_recipients', 0);
    }

    public function test_due_manual_campaign_is_dispatched_by_the_scheduler_command(): void
    {
        User::factory()->create(['name' => 'مخاطب زمان‌بندی']);

        MarketingCampaign::create([
            'name' => 'کمپین زمان‌بندی‌شده',
            'channel' => 'sms',
            'trigger' => 'manual',
            'audience' => 'all_users',
            'message' => 'سلام {name}، این پیام زمان‌بندی شده است.',
            'status' => 'active',
            'scheduled_at' => now()->subMinute(),
        ]);

        $this->artisan('marketing:dispatch-scheduled')
            ->expectsOutput('1 scheduled campaign(s) dispatched.')
            ->assertExitCode(0);

        $campaign = MarketingCampaign::firstOrFail();
        $this->assertNull($campaign->scheduled_at);
        $this->assertSame('active', $campaign->status);
        $this->assertSame(1, $campaign->fresh()->sent_count);
        $this->assertSame('completed', MarketingCampaignRun::firstOrFail()->status);
    }

    public function test_active_lead_campaign_runs_when_a_new_lead_is_created(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        MarketingCampaign::create([
            'name' => 'پیام پیگیری لید جدید',
            'channel' => 'sms',
            'trigger' => 'lead_created',
            'audience' => 'leads',
            'message' => 'سلام {name}، درخواست شما دریافت شد.',
            'status' => 'active',
        ]);

        $this->post('/leads', [
            'name' => 'والد نمونه',
            'phone' => '09120000000',
            'need' => 'کشف استعداد',
        ])->assertSessionHas('success');

        $campaign = MarketingCampaign::firstOrFail();
        $this->assertSame(1, $campaign->fresh()->sent_count);
        $this->assertSame('completed', MarketingCampaignRun::firstOrFail()->status);
    }
}
