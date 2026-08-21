<?php

namespace Tests\Feature\Sms;

use App\Models\Setting;
use App\Services\Sms\MelipayamakSmsSender;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class MelipayamakSmsSenderTest extends TestCase
{
    use RefreshDatabase;

    private function configureCredentials(): void
    {
        Setting::setSecret('sms_melipayamak_username', 'panel-user', 'sms');
        Setting::setSecret('sms_melipayamak_password', 'panel-pass', 'sms');
        Setting::set('sms_melipayamak_sender', '10002040', 'sms');
    }

    public function test_send_accepts_json_success_response(): void
    {
        $this->configureCredentials();
        Http::fake([
            'rest.payamak-panel.com/*' => Http::response('{"Value":"1500","RetStatus":1,"StrRetStatus":"Ok"}'),
        ]);

        (new MelipayamakSmsSender)->send('09121234567', 'کد تأیید: 123456');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'SendSMS'));
    }

    public function test_send_accepts_legacy_numeric_success_response(): void
    {
        $this->configureCredentials();
        Http::fake([
            'rest.payamak-panel.com/*' => Http::response('1500'),
        ]);

        (new MelipayamakSmsSender)->send('09121234567', 'کد تأیید: 123456');

        $this->addToAssertionCount(1);
    }

    public function test_send_throws_with_api_key_hint_when_panel_requires_api_key_mode(): void
    {
        $this->configureCredentials();
        Http::fake([
            'rest.payamak-panel.com/*' => Http::response('{"Value":-110,"RetStatus":-110,"StrRetStatus":"Not Ok"}'),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('کلید API');

        (new MelipayamakSmsSender)->send('09121234567', 'کد تأیید: 123456');
    }

    public function test_send_throws_on_http_failure(): void
    {
        $this->configureCredentials();
        Http::fake([
            'rest.payamak-panel.com/*' => Http::response('Server Error', 500),
        ]);

        $this->expectException(RuntimeException::class);

        (new MelipayamakSmsSender)->send('09121234567', 'کد تأیید: 123456');
    }

    public function test_send_requires_credentials(): void
    {
        Http::fake();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('نام کاربری');

        (new MelipayamakSmsSender)->send('09121234567', 'کد تأیید: 123456');
    }

    public function test_send_otp_uses_pattern_endpoint_when_pattern_is_configured(): void
    {
        $this->configureCredentials();
        Setting::set('sms_melipayamak_pattern', '12345', 'sms');
        Http::fake([
            'rest.payamak-panel.com/*' => Http::response('{"Value":"12345678901234567","RetStatus":1,"StrRetStatus":"Ok"}'),
        ]);

        (new MelipayamakSmsSender)->sendOtp('09121234567', '654321');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'SendSMS/BaseServiceNumber')
            && str_contains($request->body(), 'bodyId=12345')
            && str_contains($request->body(), 'text=654321'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'SendSMS/SendSMS'));
    }

    public function test_send_otp_falls_back_to_plain_sms_without_pattern(): void
    {
        $this->configureCredentials();
        Http::fake([
            'rest.payamak-panel.com/*' => Http::response('{"Value":"1500","RetStatus":1,"StrRetStatus":"Ok"}'),
        ]);

        (new MelipayamakSmsSender)->sendOtp('09121234567', '654321');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'SendSMS/SendSMS')
            && str_contains($request->body(), '654321'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'SendSMS/BaseServiceNumber'));
    }

    public function test_send_otp_requires_pattern_for_service_line_sender(): void
    {
        $this->configureCredentials();
        Setting::set('sms_melipayamak_sender', '50002040', 'sms');
        Http::fake();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('خط خدماتی');

        (new MelipayamakSmsSender)->sendOtp('09121234567', '654321');

        Http::assertNothingSent();
    }

    public function test_send_otp_supports_numeric_placeholder_in_message_template(): void
    {
        $this->configureCredentials();
        Setting::set('sms_otp_message', 'کد ورود شما: {0}', 'sms');
        Http::fake([
            'rest.payamak-panel.com/*' => Http::response('{"Value":"1500","RetStatus":1,"StrRetStatus":"Ok"}'),
        ]);

        (new MelipayamakSmsSender)->sendOtp('09121234567', '654321');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'SendSMS/SendSMS')
            && str_contains(urldecode($request->body()), 'کد ورود شما')
            && str_contains($request->body(), '654321')
            && ! str_contains($request->body(), '%7B0%7D'));
    }

    public function test_send_otp_requires_numeric_pattern(): void
    {
        $this->configureCredentials();
        Setting::set('sms_melipayamak_pattern', 'not-a-number', 'sms');
        Http::fake();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('الگو');

        (new MelipayamakSmsSender)->sendOtp('09121234567', '654321');

        Http::assertNothingSent();
    }

    public function test_send_otp_reports_pattern_error_hints(): void
    {
        $this->configureCredentials();
        Setting::set('sms_melipayamak_pattern', '99999', 'sms');
        Http::fake([
            'rest.payamak-panel.com/*' => Http::response('{"Value":-4,"RetStatus":35,"StrRetStatus":"InvalidData"}'),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('الگو');

        (new MelipayamakSmsSender)->sendOtp('09121234567', '654321');
    }
}
