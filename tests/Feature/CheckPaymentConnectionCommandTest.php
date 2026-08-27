<?php

namespace Tests\Feature;

use App\Models\Setting;
use Database\Seeders\RoleAndPermissionSeeder;
use Database\Seeders\SiteSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CheckPaymentConnectionCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleAndPermissionSeeder::class, SiteSettingSeeder::class]);
    }

    public function test_command_reports_unconfigured_gateways_without_network_calls(): void
    {
        Http::fake();

        $this->artisan('payment:check-connection')
            ->expectsOutputToContain('تنظیم نشده')
            ->assertExitCode(0);

        Http::assertNothingSent();
    }

    public function test_command_checks_zarinpal_without_creating_transaction(): void
    {
        Setting::setSecret('payment_zarinpal_merchant_id', 'merchant-test', 'payment');

        Http::preventStrayRequests();
        Http::fake(['*.zarinpal.com/*' => Http::response(['data' => [], 'errors' => [], 'code' => 100])]);

        $this->artisan('payment:check-connection')
            ->expectsOutputToContain('زرین‌پال: متصل')
            ->assertExitCode(0);

        Http::assertSent(fn ($request) => str_contains($request->url(), 'unVerified.json'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'request.json'));
    }

    public function test_command_fails_when_a_configured_gateway_rejects_credentials(): void
    {
        Setting::setSecret('payment_idpay_api_key', 'bad-key', 'payment');

        Http::preventStrayRequests();
        Http::fake(['api.idpay.ir/*' => Http::response(['error_code' => 3, 'error_message' => 'Invalid api key'], 403)]);

        $this->artisan('payment:check-connection')
            ->expectsOutputToContain('آیدی‌پی: خطا')
            ->assertExitCode(1);
    }

    public function test_strict_mode_fails_on_unconfigured_gateways(): void
    {
        Http::fake();

        $this->artisan('payment:check-connection', ['--strict' => true])
            ->expectsOutputToContain('تنظیم نشده')
            ->assertExitCode(1);

        Http::assertNothingSent();
    }

    public function test_json_output_is_valid(): void
    {
        Http::fake();

        $this->artisan('payment:check-connection', ['--json' => true])->assertExitCode(0);
    }
}
