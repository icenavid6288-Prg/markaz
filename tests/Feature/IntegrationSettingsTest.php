<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use App\Support\PageContent;
use Database\Seeders\RoleAndPermissionSeeder;
use Database\Seeders\SiteSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class IntegrationSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleAndPermissionSeeder::class, SiteSettingSeeder::class]);
    }

    public function test_admin_can_view_split_settings_pages(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->get('/admin/settings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Settings/Index')
                ->has('settings.brand')
                ->has('settings.contact')
                ->has('settings.popup')
                ->has('settings.trust')
                ->missing('settings.sms')
                ->missing('settings.payment'));

        $this->actingAs($admin)->get('/admin/settings/sms')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Settings/Sms')
                ->has('settings.sms'));

        $this->actingAs($admin)->get('/admin/settings/payments')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Settings/Payments')
                ->has('settings.payment'));

        $this->actingAs($admin)->get('/admin/settings/automations')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Settings/Automations')
                ->has('settings.winback')
                ->has('settings.lead_reminder')
                ->has('settings.eitaa'));
    }

    public function test_enamad_settings_can_be_saved_and_shared_with_public_pages(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->put('/admin/settings', [
            'settings' => [
                'enamad_enabled' => '1',
                'enamad_title' => 'نماد اعتماد مجموعه',
                'enamad_image_url' => 'https://example.test/enamad.png',
                'enamad_link_url' => 'https://trustseal.enamad.ir/?id=123',
                'enamad_code' => '123',
            ],
        ])->assertSessionHas('success');

        $this->get('/')->assertInertia(fn ($page) => $page
            ->where('site.enamad.enabled', true)
            ->where('site.enamad.title', 'نماد اعتماد مجموعه')
            ->where('site.enamad.image_url', 'https://example.test/enamad.png')
            ->where('site.enamad.link_url', 'https://trustseal.enamad.ir/?id=123'));
    }

    public function test_secret_credentials_are_encrypted_and_hidden_from_inertia(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->put('/admin/settings', [
            'settings' => [
                'sms_kavenegar_api_key' => 'secret-sms-key',
                'payment_idpay_api_key' => 'secret-payment-key',
            ],
        ])->assertSessionHas('success');

        $stored = Setting::where('key', 'sms_kavenegar_api_key')->firstOrFail()->value;
        $this->assertNotSame('secret-sms-key', is_array($stored) ? ($stored['value'] ?? null) : $stored);
        $this->assertSame('secret-sms-key', Setting::getSecret('sms_kavenegar_api_key'));

        $this->actingAs($admin)->get('/admin/settings/sms')
            ->assertInertia(fn ($page) => $page
                ->where('settings.sms', fn ($settings) => collect($settings)->firstWhere('key', 'sms_kavenegar_api_key')['value'] === '')
                ->where('settings.sms', fn ($settings) => collect($settings)->firstWhere('key', 'sms_kavenegar_api_key')['configured'] === true));

        $this->actingAs($admin)->get('/admin/settings/payments')
            ->assertInertia(fn ($page) => $page
                ->where('settings.payment', fn ($settings) => collect($settings)->firstWhere('key', 'payment_idpay_api_key')['value'] === '')
                ->where('settings.payment', fn ($settings) => collect($settings)->firstWhere('key', 'payment_idpay_api_key')['configured'] === true));
    }

    public function test_admin_can_upload_and_publish_a_custom_brand_logo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->post('/admin/settings/logo', [
            'logo' => UploadedFile::fake()->create('custom-logo.png', 100, 'image/png'),
        ])->assertSessionHas('success');

        $logo = Setting::get('logo');
        $this->assertIsString($logo);
        $this->assertSame('/images/site-logo.png', $logo);
        $this->assertFileExists(public_path('images/site-logo.png'));
        $this->get('/site-logo')->assertOk();

        $this->actingAs($admin)->get('/admin/settings')
            ->assertInertia(fn ($page) => $page
                ->where('settings.brand', fn ($settings) => collect($settings)->firstWhere('key', 'logo')['value'] === $logo));

        @unlink(public_path('images/site-logo.png'));
    }

    public function test_public_storage_fallback_serves_uploads_without_a_symlink(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('branding/test-logo.png', 'logo');

        $this->get('/storage/branding/test-logo.png')
            ->assertOk()
            ->assertHeader('content-type', 'image/png');
    }

    public function test_public_storage_fallback_rejects_path_traversal(): void
    {
        $this->get('/storage/../.env')->assertNotFound();
    }

    public function test_admin_can_upload_an_application_logo_and_manifest_uses_it(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->post('/admin/settings/app-logo', [
            'app_logo' => UploadedFile::fake()->create('app-icon.png', 100, 'image/png'),
        ])->assertSessionHas('success');

        $appLogo = Setting::get('app_logo');
        $this->assertIsString($appLogo);
        $this->assertStringStartsWith('/storage/app-icons/', $appLogo);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $appLogo));

        $this->get('/app-icon')->assertOk();
        $this->get('/app-manifest.webmanifest')
            ->assertOk()
            ->assertJsonPath('icons.0.src', url('/app-icon'));
    }

    public function test_admin_can_upload_a_homepage_hero_background(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->post('/admin/settings/hero-background', [
            'hero_background' => UploadedFile::fake()->create('hero-background.jpg', 100, 'image/jpeg'),
        ])->assertSessionHas('success');

        $background = Setting::get('homepage_hero_background');
        $this->assertSame('/images/hero-background.jpg', $background);
        $this->assertFileExists(public_path('images/hero-background.jpg'));

        $this->get('/')->assertInertia(fn ($page) => $page
            ->where('site.hero.background', '/images/hero-background.jpg'));

        @unlink(public_path('images/hero-background.jpg'));
    }

    public function test_legacy_absolute_logo_url_is_normalized_to_a_relative_path(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // Stored by older versions of the uploader: an absolute URL pinned to a local
        // port (e.g. http://127.0.0.1:8001/...), which breaks on any other host/port.
        Setting::set('logo', 'http://127.0.0.1:8001/storage/branding/legacy-logo.png', 'brand', true);
        Setting::set('homepage_hero_image', 'https://example.test/storage/homepage/legacy-hero.jpg', 'general', true);

        $this->actingAs($admin)->get('/admin/settings')
            ->assertInertia(fn ($page) => $page
                ->where('settings.brand', fn ($settings) => collect($settings)->firstWhere('key', 'logo')['value'] === '/storage/branding/legacy-logo.png')
                ->where('settings.general', fn ($settings) => collect($settings)->firstWhere('key', 'homepage_hero_image')['value'] === '/storage/homepage/legacy-hero.jpg'));
    }

    public function test_admin_can_edit_public_page_content_and_it_is_shared_to_the_page(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->get('/admin/site-pages')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/SitePages/Index')
                ->has('pages', 10));

        $this->actingAs($admin)->put('/admin/site-pages/home', [
            'fields' => [
                'hero_title' => 'عنوان آزمایشی مسیر رشد',
                'hero_subtitle' => 'توضیح قابل ویرایش از پنل',
                'hero_icon' => 'Route',
                'pm_models' => json_encode([
                    ['code' => 'CPA', 'name' => 'هزینه به ازای هر اقدام', 'price' => 'قابل مذاکره', 'description' => 'پرداخت فقط پس از انجام اقدام هدف.'],
                ], JSON_UNESCAPED_UNICODE),
            ],
        ])->assertSessionHas('success');

        $this->assertSame('عنوان آزمایشی مسیر رشد', PageContent::get('home')['fields']['hero_title']['value']);
        $this->assertStringContainsString('هزینه به ازای هر اقدام', PageContent::get('home')['fields']['pm_models']['value']);
        $this->get('/')->assertInertia(fn ($page) => $page
            ->where('pageContent.fields.hero_title.value', 'عنوان آزمایشی مسیر رشد')
            ->where('pageContent.fields.hero_icon.value', 'Route')
            ->where('pageContent.fields.pm_models.value', fn ($value) => str_contains((string) $value, '"code":"CPA"')));
    }

    public function test_login_page_brand_panel_content_is_shared_to_auth_pages_and_editable(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // The site-description panel is shared to every auth page (user + admin login).
        $this->get('/login')->assertInertia(fn ($page) => $page
            ->where('pageContent.key', 'login')
            ->where('pageContent.fields.panel_title.value', 'هر نوجوان یک مسیر دارد؛')
            ->where('pageContent.fields.panel_kicker.value', 'مسیر رشد، از همین‌جا آغاز می‌شود'));

        $this->get('/admin/login')->assertInertia(fn ($page) => $page
            ->where('pageContent.key', 'login')
            ->where('pageContent.fields.panel_description.value', fn ($value) => str_contains((string) $value, 'شناخت استعدادها')));

        $this->get('/register')->assertInertia(fn ($page) => $page
            ->where('pageContent.key', 'login'));

        // Admin edits the brand panel texts from the PageStudio.
        $this->actingAs($admin)->put('/admin/site-pages/login', [
            'fields' => [
                'panel_title' => 'عنوان جدید پنل توضیحات',
                'panel_title_accent' => 'با ما همراه شوید',
                'panel_description' => 'توضیح جدید درباره مجموعه ما',
                'journey_stations' => 'شناخت، کشف، تصمیم',
                'trust_1' => 'اعتماد خانواده‌ها',
            ],
        ])->assertSessionHas('success');

        auth()->logout();
        $this->get('/login')->assertInertia(fn ($page) => $page
            ->where('pageContent.fields.panel_title.value', 'عنوان جدید پنل توضیحات')
            ->where('pageContent.fields.panel_title_accent.value', 'با ما همراه شوید')
            ->where('pageContent.fields.panel_description.value', 'توضیح جدید درباره مجموعه ما')
            ->where('pageContent.fields.journey_stations.value', 'شناخت، کشف، تصمیم')
            ->where('pageContent.fields.trust_1.value', 'اعتماد خانواده‌ها'));
    }

    public function test_admin_can_upload_a_login_page_background_image(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->put('/admin/site-pages/login', [
            'fields' => [
                'background_image' => UploadedFile::fake()->create('login-bg.jpg', 100, 'image/jpeg'),
            ],
        ])->assertSessionHas('success');

        $this->assertSame('/images/login-background_image.jpg', PageContent::get('login')['fields']['background_image']['value']);
        $this->assertFileExists(public_path('images/login-background_image.jpg'));

        auth()->logout();
        $this->get('/login')->assertInertia(fn ($page) => $page
            ->where('pageContent.fields.background_image.value', '/images/login-background_image.jpg'));

        @unlink(public_path('images/login-background_image.jpg'));
    }

    public function test_login_page_is_listed_in_the_page_studio(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->get('/admin/site-pages')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/SitePages/Index')
                ->has('pages', 10)
                ->where('pages', fn ($pages) => collect($pages)->contains('key', 'login')));
    }

    public function test_editor_cannot_save_unknown_page_fields(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->put('/admin/site-pages/home', [
            'fields' => ['unknown_field' => 'should not be persisted'],
        ])->assertSessionHas('success');

        $this->assertArrayNotHasKey('unknown_field', PageContent::get('home')['fields']);
    }

    public function test_log_sms_driver_can_send_a_test_message(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->post('/admin/settings/sms/test', ['phone' => '09120000000'])
            ->assertSessionHas('success');
    }

    public function test_payment_configuration_check_requires_selected_gateway_credentials(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Setting::set('payment_gateway', 'zarinpal', 'payment');
        Setting::set('payment_zarinpal_merchant_id', '', 'payment');

        $this->actingAs($admin)->post('/admin/settings/payment/test')->assertSessionHas('error');

        Setting::setSecret('payment_zarinpal_merchant_id', 'merchant-test', 'payment');
        $this->actingAs($admin)->post('/admin/settings/payment/test')->assertSessionHas('success');
    }

    public function test_sms_connection_check_works_for_log_driver_without_sending(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Setting::set('sms_driver', 'log', 'sms');

        $this->actingAs($admin)->post('/admin/settings/sms/connection')->assertSessionHas('success');
    }

    public function test_sms_connection_check_requires_credentials(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Setting::set('sms_driver', 'kavenegar', 'sms');
        Http::fake();

        $this->actingAs($admin)->post('/admin/settings/sms/connection')->assertSessionHas('error');
        Http::assertNothingSent();
    }

    public function test_sms_connection_check_kavenegar_success_without_sending(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Setting::set('sms_driver', 'kavenegar', 'sms');
        Setting::setSecret('sms_kavenegar_api_key', 'secret-key', 'sms');

        Http::fake(['api.kavenegar.com/*' => Http::response(['return' => ['status' => 200, 'message' => 'ok'], 'entries' => ['credit' => 5000]])]);
        $this->actingAs($admin)->post('/admin/settings/sms/connection')->assertSessionHas('success');
        Http::assertSent(fn ($request) => str_contains($request->url(), 'account/info.json'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'sms/send.json'));
    }

    public function test_sms_connection_check_kavenegar_reports_failure(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Setting::set('sms_driver', 'kavenegar', 'sms');
        Setting::setSecret('sms_kavenegar_api_key', 'secret-key', 'sms');

        Http::fake(['api.kavenegar.com/*' => Http::response(['return' => ['status' => 405, 'message' => 'invalid key']], 403)]);
        $this->actingAs($admin)->post('/admin/settings/sms/connection')->assertSessionHas('error');
    }

    public function test_payment_status_endpoint_reports_unconfigured_gateways_without_network_calls(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Http::fake();
        $this->actingAs($admin)->get('/admin/settings/payment/status')
            ->assertOk()
            ->assertJsonPath('local.state', 'ok')
            ->assertJsonPath('zarinpal.state', 'not_configured')
            ->assertJsonPath('idpay.state', 'not_configured')
            ->assertJsonPath('zibal.state', 'not_configured');
        Http::assertNothingSent();
    }

    public function test_payment_status_endpoint_checks_zarinpal_without_creating_transaction(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Setting::setSecret('payment_zarinpal_merchant_id', 'merchant-test', 'payment');

        Http::preventStrayRequests();
        Http::fake(['*.zarinpal.com/*' => Http::response(['data' => [], 'errors' => [], 'code' => 100])]);

        $this->actingAs($admin)->get('/admin/settings/payment/status')
            ->assertOk()
            ->assertJsonPath('zarinpal.state', 'ok');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'unVerified.json'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'request.json'));
    }

    public function test_payment_status_endpoint_checks_zibal_without_creating_transaction(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Setting::setSecret('payment_zibal_merchant', 'zibal-test', 'payment');

        Http::preventStrayRequests();
        Http::fake(['gateway.zibal.ir/*' => Http::response(['result' => 105, 'message' => 'تراکنش یافت نشد'])]);

        $this->actingAs($admin)->get('/admin/settings/payment/status')
            ->assertOk()
            ->assertJsonPath('zibal.state', 'ok');

        Http::assertSent(fn ($request) => str_contains($request->url(), '/v1/verify'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), '/v1/request'));
    }

    public function test_payment_status_endpoint_reports_invalid_idpay_key(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Setting::setSecret('payment_idpay_api_key', 'bad-key', 'payment');

        Http::preventStrayRequests();
        Http::fake(['api.idpay.ir/*' => Http::response(['error_code' => 3, 'error_message' => 'Invalid api key'], 403)]);

        $this->actingAs($admin)->get('/admin/settings/payment/status')
            ->assertOk()
            ->assertJsonPath('idpay.state', 'error');
    }

    public function test_sms_status_endpoint_reports_every_provider_without_sending(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        // Nothing configured: every provider is reported as not_configured and no HTTP call is made.
        Http::fake();
        $this->actingAs($admin)->get('/admin/settings/sms/status')
            ->assertOk()
            ->assertJsonPath('log.state', 'ok')
            ->assertJsonPath('kavenegar.state', 'not_configured')
            ->assertJsonPath('smsir.state', 'not_configured')
            ->assertJsonPath('melipayamak.state', 'not_configured');
        Http::assertNothingSent();

        // With kavenegar credentials, only that provider is actually probed (account/info, never send).
        Setting::setSecret('sms_kavenegar_api_key', 'secret-key', 'sms');
        \Illuminate\Support\Facades\Cache::forget('sms.connection.status');
        Http::fake(['api.kavenegar.com/*' => Http::response(['return' => ['status' => 200, 'message' => 'ok'], 'entries' => ['credit' => 5000]])]);
        $this->actingAs($admin)->get('/admin/settings/sms/status')
            ->assertOk()
            ->assertJsonPath('kavenegar.state', 'ok')
            ->assertJsonPath('smsir.state', 'not_configured')
            ->assertJsonPath('melipayamak.state', 'not_configured');
        Http::assertSent(fn ($request) => str_contains($request->url(), 'account/info.json'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'sms/send.json'));
    }

    public function test_melipayamak_apikey_is_saved_as_secret_and_hidden_from_inertia(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->put('/admin/settings', [
            'settings' => [
                'sms_melipayamak_username' => 'melipayamak-user',
                'sms_melipayamak_apikey' => 'secret-melipayamak-apikey',
            ],
        ])->assertSessionHas('success');

        $stored = Setting::where('key', 'sms_melipayamak_apikey')->firstOrFail()->value;
        $this->assertNotSame('secret-melipayamak-apikey', is_array($stored) ? ($stored['value'] ?? null) : $stored);
        $this->assertSame('secret-melipayamak-apikey', Setting::getSecret('sms_melipayamak_apikey'));

        $this->actingAs($admin)->get('/admin/settings/sms')
            ->assertInertia(fn ($page) => $page
                ->where('settings.sms', fn ($settings) => collect($settings)->firstWhere('key', 'sms_melipayamak_apikey')['value'] === '')
                ->where('settings.sms', fn ($settings) => collect($settings)->firstWhere('key', 'sms_melipayamak_apikey')['configured'] === true));
    }

    public function test_sms_status_endpoint_checks_melipayamak_with_apikey_without_sending(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Setting::setSecret('sms_melipayamak_username', 'melipayamak-user', 'sms');
        Setting::setSecret('sms_melipayamak_apikey', 'melipayamak-apikey', 'sms');

        Http::preventStrayRequests();
        Http::fake(['rest.payamak-panel.com/*' => Http::response(['Value' => '5000', 'RetStatus' => 1, 'StrRetStatus' => 'Ok'])]);

        $this->actingAs($admin)->get('/admin/settings/sms/status')
            ->assertOk()
            ->assertJsonPath('melipayamak.state', 'ok');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'SendSMS/GetCredit'));
        Http::assertNotSent(fn ($request) => str_contains($request->url(), 'SendSMS/SendSMS'));
        Http::assertSent(fn ($request) => str_contains($request->body(), 'melipayamak-apikey'));
    }

    public function test_sms_status_endpoint_reports_melipayamak_apikey_required_hint(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Setting::setSecret('sms_melipayamak_username', 'melipayamak-user', 'sms');
        Setting::setSecret('sms_melipayamak_password', 'old-panel-password', 'sms');

        Http::preventStrayRequests();
        Http::fake(['rest.payamak-panel.com/*' => Http::response(['Value' => '-110', 'RetStatus' => 35, 'StrRetStatus' => 'InvalidData'])]);

        $this->actingAs($admin)->get('/admin/settings/sms/status')
            ->assertOk()
            ->assertJsonPath('melipayamak.state', 'error')
            ->assertJsonPath('melipayamak.message', fn ($message) => str_contains((string) $message, 'کلید API'));
    }
}
