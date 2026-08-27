<?php

namespace Tests\Feature;

use App\Models\Setting;
use Database\Seeders\RoleAndPermissionSeeder;
use Database\Seeders\SiteSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CheckSmsConnectionCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleAndPermissionSeeder::class, SiteSettingSeeder::class]);
    }

    public function test_command_reports_unconfigured_panels_without_sending(): void
    {
        Http::fake();

        $this->artisan('sms:check-connection')
            ->expectsOutputToContain('تنظیم نشده')
            ->assertExitCode(0);

        Http::assertNothingSent();
    }

    public function test_command_checks_configured_kavenegar_panel_without_sending(): void
    {
        Setting::setSecret('sms_kavenegar_api_key', 'secret-key', 'sms');

        Http::fake(['api.kavenegar.com/*' => Http::response(['return' => ['status' => 200, 'message' => 'ok'], 'entries' => ['credit' => 5000]])]);

        $this->artisan('sms:check-connection')
            ->expectsOutputToContain('کاوه‌نگار (اصلی): متصل')
            ->assertExitCode(0);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'account/info.json'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'sms/send.json'));
    }

    public function test_command_fails_when_a_configured_panel_is_unreachable(): void
    {
        Setting::setSecret('sms_kavenegar_api_key', 'secret-key', 'sms');

        Http::fake(['api.kavenegar.com/*' => Http::response(['return' => ['status' => 405, 'message' => 'invalid key']], 403)]);

        $this->artisan('sms:check-connection')
            ->expectsOutputToContain('کاوه‌نگار (اصلی): خطا')
            ->assertExitCode(1);
    }

    public function test_strict_mode_fails_on_unconfigured_panels(): void
    {
        Http::fake();

        $this->artisan('sms:check-connection', ['--strict' => true])
            ->expectsOutputToContain('تنظیم نشده')
            ->assertExitCode(1);

        Http::assertNothingSent();
    }

    public function test_json_output_is_valid(): void
    {
        Http::fake();

        $this->artisan('sms:check-connection', ['--json' => true])->assertExitCode(0);
    }
}
