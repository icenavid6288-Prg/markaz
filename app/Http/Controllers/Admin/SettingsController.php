<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\Payments\IdPayPaymentGateway;
use App\Services\Payments\LocalPaymentGateway;
use App\Services\Payments\ZarinpalPaymentGateway;
use App\Services\Payments\ZibalPaymentGateway;
use App\Services\Sms\KavenegarSmsSender;
use App\Services\Sms\MelipayamakSmsSender;
use App\Services\Sms\SmsIrSmsSender;
use App\Services\Sms\SmsSender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SettingsController extends Controller
{
    private const SMS_STATUS_CACHE_KEY = 'sms.connection.status';
    private const PAYMENT_STATUS_CACHE_KEY = 'payment.connection.status';
    private const STATUS_TTL = 90; // seconds; keeps the settings page fast without hammering providers

    private const SECRET_KEYS = [
        'sms_kavenegar_api_key', 'sms_ir_api_key', 'sms_melipayamak_username', 'sms_melipayamak_password', 'sms_melipayamak_apikey',
        'sms_backup_kavenegar_api_key', 'sms_backup_smsir_api_key', 'sms_backup_melipayamak_username', 'sms_backup_melipayamak_password', 'sms_backup_melipayamak_apikey',
        'payment_zarinpal_merchant_id', 'payment_zarinpal_access_token', 'payment_idpay_api_key', 'payment_zibal_merchant',
        'eitaa_bot_token',
        'chat_ai_api_key',
    ];

    private const ALLOWED_KEYS = [
        'site_name', 'site_slogan', 'logo', 'app_logo', 'address', 'phone', 'email', 'eitaa', 'website', 'working_hours', 'instagram_url', 'eitaa_url',
        'meta_title', 'meta_description', 'keywords', 'og_image', 'homepage_hero_title', 'homepage_hero_subtitle', 'homepage_hero_image', 'homepage_hero_background',
        'homepage_cta_primary', 'homepage_cta_secondary', 'currency', 'footer_about', 'stat_students', 'stat_courses', 'stat_team', 'stat_experience',
        'enamad_enabled', 'enamad_title', 'enamad_image_url', 'enamad_link_url', 'enamad_code',
        'popup_enabled', 'popup_title', 'popup_message', 'popup_cta_label', 'popup_cta_url', 'popup_delay_seconds', 'popup_frequency',
        'sms_driver', 'sms_enabled', 'sms_otp_message', 'sms_test_recipient', 'sms_kavenegar_api_key', 'sms_kavenegar_sender',
        'sms_ir_api_key', 'sms_ir_line_number', 'sms_ir_template_id',        'sms_melipayamak_username', 'sms_melipayamak_password', 'sms_melipayamak_apikey', 'sms_melipayamak_sender', 'sms_melipayamak_pattern',
        'sms_backup_driver', 'sms_backup_kavenegar_api_key', 'sms_backup_kavenegar_sender', 'sms_backup_smsir_api_key', 'sms_backup_smsir_line_number',
        'sms_backup_melipayamak_username', 'sms_backup_melipayamak_password', 'sms_backup_melipayamak_apikey', 'sms_backup_melipayamak_sender', 'sms_backup_melipayamak_pattern',
        'winback_enabled', 'winback_days', 'winback_min_pages', 'winback_cooldown_days', 'winback_sms_message', 'winback_notification_message',
        'lead_reminder_enabled', 'lead_reminder_days', 'lead_reminder_cooldown_days', 'lead_reminder_sms_message',
        'lead_reminder_first_enabled', 'lead_reminder_first_days', 'lead_reminder_first_cooldown_days', 'lead_reminder_first_sms_message',
        'lead_reminder_second_enabled', 'lead_reminder_second_days', 'lead_reminder_second_cooldown_days', 'lead_reminder_second_sms_message',
        'payment_enabled', 'payment_gateway', 'payment_description', 'payment_zarinpal_merchant_id', 'payment_zarinpal_access_token', 'payment_zarinpal_sandbox',
        'payment_idpay_api_key', 'payment_idpay_sandbox', 'payment_zibal_merchant', 'payment_zibal_sandbox',
        'eitaa_bot_token', 'eitaa_channel_id', 'eitaa_post_template', 'eitaa_summary_image',
        'chat_enabled', 'chat_title', 'chat_greeting', 'chat_ai_enabled', 'chat_ai_api_key',
        'chat_ai_base_url', 'chat_ai_model', 'chat_ai_system_prompt',
    ];

    /**
     * Settings are split into focused pages so unrelated topics (SMS, payments,
     * automations) do not clutter the general site settings.
     */
    private const SETTINGS_PAGES = [
        'site' => ['component' => 'Admin/Settings/Index', 'groups' => ['brand', 'contact', 'social', 'trust', 'seo', 'general', 'popup']],
        'sms' => ['component' => 'Admin/Settings/Sms', 'groups' => ['sms']],
        'payment' => ['component' => 'Admin/Settings/Payments', 'groups' => ['payment']],
        'automation' => ['component' => 'Admin/Settings/Automations', 'groups' => ['eitaa', 'winback', 'lead_reminder']],
        'chat' => ['component' => 'Admin/Settings/Chat', 'groups' => ['chat']],
    ];

    public function index(): Response
    {
        return $this->settingsPage('site');
    }

    public function sms(): Response
    {
        return $this->settingsPage('sms');
    }

    public function payments(): Response
    {
        return $this->settingsPage('payment');
    }

    public function automations(): Response
    {
        return $this->settingsPage('automation');
    }

    public function chat(): Response
    {
        return $this->settingsPage('chat');
    }

    private function settingsPage(string $page): Response
    {
        $config = self::SETTINGS_PAGES[$page] ?? self::SETTINGS_PAGES['site'];
        $secretKeys = self::SECRET_KEYS;
        $settings = Setting::whereIn('group', $config['groups'])->get()->groupBy('group')->map(function ($items) use ($secretKeys) {
            return $items->map(function (Setting $setting) use ($secretKeys) {
                $value = $setting->value;
                if (is_array($value) && count($value) === 1 && array_key_exists('value', $value)) $value = $value['value'];
                // Stored uploads are meant to be host-independent (relative /storage/... paths).
                // Older values may contain an absolute URL pinned to a local port (e.g. http://127.0.0.1:8001/...),
                // which breaks the preview whenever the app is served on another host/port. Strip it down to the path.
                if (in_array($setting->key, ['logo', 'app_logo', 'homepage_hero_image', 'homepage_hero_background'], true) && is_string($value) && preg_match('#^https?://#i', $value)) {
                    $path = parse_url($value, PHP_URL_PATH);
                    if (is_string($path) && $path !== '') $value = $path;
                }
                $secret = in_array($setting->key, $secretKeys, true);
                return ['key' => $setting->key, 'value' => $secret ? '' : $value, 'is_secret' => $secret, 'configured' => $secret && filled(Setting::getSecret($setting->key))];
            });
        });

        // Every declared group is included (even when it has no rows yet) so the page
        // always renders its sections and the Inertia payload is stable across installs.
        $settings = collect($config['groups'])->mapWithKeys(fn (string $group) => [$group => $settings->get($group, collect())]);

        return Inertia::render($config['component'], ['settings' => $settings]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable'],
            'settings.enamad_image_url' => ['nullable', 'url', 'max:2048', 'regex:/^https?:\\/\\/.+/i'],
            'settings.enamad_link_url' => ['nullable', 'url', 'max:2048', 'regex:/^https?:\\/\\/.+/i'],
        ]);
        foreach ($validated['settings'] as $key => $value) {
            if (! in_array($key, self::ALLOWED_KEYS, true)) continue;
            if (in_array($key, self::SECRET_KEYS, true)) {
                if (filled($value) && $value !== '••••••••') Setting::setSecret($key, (string) $value, $this->groupFor($key));
                continue;
            }
            Setting::set($key, is_bool($value) ? ($value ? '1' : '0') : (string) $value, $this->groupFor($key), in_array($this->groupFor($key), ['brand', 'contact', 'social', 'seo', 'general'], true));
        }

        // Credentials may have changed, so the next status check must re-test the providers.
        Cache::forget(self::SMS_STATUS_CACHE_KEY);
        Cache::forget(self::PAYMENT_STATUS_CACHE_KEY);

        return back()->with('success', 'تنظیمات با موفقیت و به‌صورت امن ذخیره شد.');
    }

    /**
     * Connection status of every SMS provider, shown permanently on the settings page.
     * Results are cached briefly so opening the page does not block on slow providers.
     */
    public function smsConnectionStatus(): JsonResponse
    {
        $status = Cache::remember(self::SMS_STATUS_CACHE_KEY, self::STATUS_TTL, function () {
            $providers = [
                'kavenegar' => [
                    'label' => 'کاوه‌نگار',
                    'configured' => filled(Setting::getSecret('sms_kavenegar_api_key')),
                    'check' => fn () => (new KavenegarSmsSender)->checkConnection(),
                ],
                'smsir' => [
                    'label' => 'SMS.ir',
                    'configured' => filled(Setting::getSecret('sms_ir_api_key')),
                    'check' => fn () => (new SmsIrSmsSender)->checkConnection(),
                ],
                'melipayamak' => [
                    'label' => 'ملی‌پیامک',
                    'configured' => filled(Setting::getSecret('sms_melipayamak_username')) && (filled(Setting::getSecret('sms_melipayamak_apikey')) || filled(Setting::getSecret('sms_melipayamak_password'))),
                    'check' => fn () => (new MelipayamakSmsSender)->checkConnection(),
                ],
            ];

            $status = ['log' => ['state' => 'ok', 'message' => 'درایور لاگ (توسعه) همیشه در دسترس است.']];

            foreach ($providers as $key => $provider) {
                if (! $provider['configured']) {
                    $status[$key] = ['state' => 'not_configured', 'message' => 'کلیدهای '.$provider['label'].' در تنظیمات وارد نشده است.'];
                    continue;
                }

                try {
                    $check = $provider['check']();
                    $status[$key] = ['state' => $check['ok'] ? 'ok' : 'error', 'message' => $check['message']];
                } catch (Throwable $exception) {
                    $status[$key] = ['state' => 'error', 'message' => 'بررسی اتصال '.$provider['label'].' ناموفق بود: '.$exception->getMessage()];
                }
            }

            return $status;
        });

        return response()->json($status);
    }

    /**
     * Connection status of every payment gateway, shown permanently on the settings page.
     * Checks are read-only probes that never create or charge a transaction, and results
     * are cached briefly so opening the page does not block on slow providers.
     */
    public function paymentConnectionStatus(): JsonResponse
    {
        $status = Cache::remember(self::PAYMENT_STATUS_CACHE_KEY, self::STATUS_TTL, function () {
            $gateways = [
                'local' => [
                    'label' => 'حالت آزمایشی داخلی',
                    'configured' => true,
                    'check' => fn () => (new LocalPaymentGateway)->checkConnection(),
                ],
                'zarinpal' => [
                    'label' => 'زرین‌پال',
                    'configured' => filled(Setting::getSecret('payment_zarinpal_merchant_id')),
                    'check' => fn () => (new ZarinpalPaymentGateway)->checkConnection(),
                ],
                'idpay' => [
                    'label' => 'آیدی‌پی',
                    'configured' => filled(Setting::getSecret('payment_idpay_api_key')),
                    'check' => fn () => (new IdPayPaymentGateway)->checkConnection(),
                ],
                'zibal' => [
                    'label' => 'زیبال',
                    'configured' => filled(Setting::getSecret('payment_zibal_merchant')),
                    'check' => fn () => (new ZibalPaymentGateway)->checkConnection(),
                ],
            ];

            $status = [];

            foreach ($gateways as $key => $gateway) {
                if (! $gateway['configured']) {
                    $status[$key] = ['state' => 'not_configured', 'message' => 'کلیدهای '.$gateway['label'].' در تنظیمات وارد نشده است.'];
                    continue;
                }

                try {
                    $check = $gateway['check']();
                    $status[$key] = ['state' => $check['ok'] ? 'ok' : 'error', 'message' => $check['message']];
                } catch (Throwable $exception) {
                    $status[$key] = ['state' => 'error', 'message' => 'بررسی اتصال '.$gateway['label'].' ناموفق بود: '.$exception->getMessage()];
                }
            }

            return $status;
        });

        return response()->json($status);
    }

    public function updateLogo(Request $request): RedirectResponse
    {
        $request->validate([
            'logo' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
        ]);

        $oldLogo = Setting::get('logo');
        $extension = strtolower($request->file('logo')->extension() ?: 'png');
        $filename = 'site-logo.'.$extension;
        $directory = public_path('images');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Keep the main site logo in public/images so shared hosts do not need
        // a storage symlink just to render the header and footer.
        foreach (glob($directory.'/site-logo.*') ?: [] as $oldFile) {
            if (is_file($oldFile)) @unlink($oldFile);
        }
        $request->file('logo')->move($directory, $filename);
        $logoUrl = '/images/'.$filename;

        Setting::set('logo', $logoUrl, 'brand', true);

        $oldLogoPath = is_string($oldLogo) ? (parse_url($oldLogo, PHP_URL_PATH) ?: $oldLogo) : null;
        if (is_string($oldLogoPath) && str_starts_with($oldLogoPath, '/storage/branding/')) {
            Storage::disk('public')->delete(ltrim(str_replace('/storage/', '', $oldLogoPath), '/'));
        }

        return back()->with('success', 'لوگوی سایت با موفقیت تغییر کرد.');
    }

    public function updateAppLogo(Request $request): RedirectResponse
    {
        $request->validate([
            'app_logo' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
        ]);

        $oldLogo = Setting::get('app_logo');
        $path = $request->file('app_logo')->store('app-icons', 'public');
        $logoUrl = '/storage/'.ltrim($path, '/');

        Setting::set('app_logo', $logoUrl, 'brand', true);

        $oldLogoPath = is_string($oldLogo) ? (parse_url($oldLogo, PHP_URL_PATH) ?: $oldLogo) : null;
        if (is_string($oldLogoPath) && str_starts_with($oldLogoPath, '/storage/app-icons/')) {
            Storage::disk('public')->delete(ltrim(str_replace('/storage/', '', $oldLogoPath), '/'));
        }

        return back()->with('success', 'لوگوی اپلیکیشن با موفقیت تغییر کرد.');
    }

    public function updateHeroImage(Request $request): RedirectResponse
    {
        $request->validate([
            'hero_image' => ['required', 'file', 'mimes:png,jpg,jpeg,webp,avif', 'max:8192'],
        ]);

        $oldImage = Setting::get('homepage_hero_image');
        $path = $request->file('hero_image')->store('homepage', 'public');
        $imageUrl = '/storage/'.ltrim($path, '/');

        Setting::set('homepage_hero_image', $imageUrl, 'general', true);

        $oldImagePath = is_string($oldImage) ? (parse_url($oldImage, PHP_URL_PATH) ?: $oldImage) : null;
        if (is_string($oldImagePath) && str_starts_with($oldImagePath, '/storage/homepage/')) {
            Storage::disk('public')->delete(ltrim(str_replace('/storage/', '', $oldImagePath), '/'));
        }

        return back()->with('success', 'تصویر صفحه اصلی با موفقیت تغییر کرد.');
    }

    public function updateHeroBackground(Request $request): RedirectResponse
    {
        $request->validate([
            'hero_background' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:8192'],
        ]);

        $oldBackground = Setting::get('homepage_hero_background');
        $extension = strtolower($request->file('hero_background')->extension() ?: 'jpg');
        $filename = 'hero-background.'.$extension;
        $directory = public_path('images');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        foreach (glob($directory.'/hero-background.*') ?: [] as $oldFile) {
            if (is_file($oldFile)) @unlink($oldFile);
        }
        $request->file('hero_background')->move($directory, $filename);
        Setting::set('homepage_hero_background', '/images/'.$filename, 'general', true);

        $oldPath = is_string($oldBackground) ? (parse_url($oldBackground, PHP_URL_PATH) ?: $oldBackground) : null;
        if (is_string($oldPath) && str_starts_with($oldPath, '/storage/homepage-background/')) {
            Storage::disk('public')->delete(ltrim(str_replace('/storage/', '', $oldPath), '/'));
        }

        return back()->with('success', 'تصویر پس‌زمینه سکشن اول با موفقیت تغییر کرد.');
    }

    public function testSms(Request $request, SmsSender $sms): RedirectResponse
    {
        $phone = (string) ($request->input('phone') ?: Setting::get('sms_test_recipient', ''));
        $request->merge(['phone' => $phone]);
        $request->validate(['phone' => ['required', 'regex:/^09\d{9}$/']]);

        try {
            $sms->send($phone, 'پیام آزمایشی مرکز رشد و کارآفرینی دکتر بیدی؛ اتصال سرویس پیامک موفق است.');
            return back()->with('success', 'پیام آزمایشی با موفقیت به سرویس پیامک ارسال شد.');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'ارسال پیام آزمایشی ناموفق بود. لاگ سرویس را بررسی کنید.');
        }
    }

    public function testSmsConnection(SmsSender $sms): RedirectResponse
    {
        try {
            $result = $sms->checkConnection();

            return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'بررسی اتصال پیامک ناموفق بود: '.$exception->getMessage());
        }
    }

    public function testPayment(): RedirectResponse
    {
        $gateway = (string) Setting::get('payment_gateway', 'local');
        $required = match ($gateway) {
            'zarinpal' => ['payment_zarinpal_merchant_id' => 'Merchant ID زرین‌پال'],
            'idpay' => ['payment_idpay_api_key' => 'API Key آیدی‌پی'],
            'zibal' => ['payment_zibal_merchant' => 'Merchant زیبال'],
            'local' => [],
            default => ['payment_gateway' => 'درگاه پرداخت معتبر'],
        };
        foreach ($required as $key => $label) {
            $value = in_array($key, self::SECRET_KEYS, true) ? Setting::getSecret($key) : Setting::get($key);
            if (blank($value)) return back()->with('error', "تنظیمات ناقص است؛ {$label} را وارد کنید.");
        }

        return back()->with('success', "ساختار تنظیمات درگاه «{$gateway}» کامل است. برای تست تراکنش، یک سفارش آزمایشی ایجاد کنید.");
    }

    public function testEitaa(): RedirectResponse
    {
        $token = Setting::getSecret('eitaa_bot_token');
        $channel = (string) Setting::get('eitaa_channel_id', '');

        if (blank($token) || blank($channel)) {
            return back()->with('error', 'تنظیمات ایتا ناقص است؛ توکن ربات و شناسه کانال را وارد و ذخیره کنید.');
        }

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(15)
                ->asForm()
                ->post('https://eitaayar.ir/api/'.$token.'/sendMessage', [
                    'chat_id' => $channel,
                    'text' => 'پیام آزمایشی مرکز رشد و کارآفرینی دکتر بیدی؛ اتصال ربات ایتا موفق است. ✅',
                ]);

            $payload = $response->json();
            if ($response->failed() || (is_array($payload) && ($payload['ok'] ?? false) === false)) {
                $detail = is_array($payload) ? ($payload['description'] ?? '') : '';

                return back()->with('error', 'ارسال پیام آزمایشی به ایتا ناموفق بود.'.($detail ? ' ('.$detail.')' : ''));
            }

            return back()->with('success', 'پیام آزمایشی با موفقیت به کانال ایتا ارسال شد. اتصال ربات برقرار است.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'ارسال پیام آزمایشی به ایتا ناموفق بود: '.$exception->getMessage());
        }
    }

    public function testChat(): RedirectResponse
    {
        if (blank(Setting::getSecret('chat_ai_api_key'))) {
            return back()->with('error', 'کلید API هوش مصنوعی وارد نشده است؛ ابتدا آن را در تنظیمات پشتیبانی ذخیره کنید.');
        }

        $result = (new \App\Services\Chat\AiSupportService)->complete([
            ['role' => 'user', 'body' => 'سلام، فقط یک پیام کوتاه تأییدی بده.'],
        ]);

        if (! $result['ok']) {
            return back()->with('error', 'اتصال به سرویس هوش مصنوعی ناموفق بود.'.($result['error'] ? ' ('.$result['error'].')' : ''));
        }

        return back()->with('success', 'اتصال به سرویس هوش مصنوعی برقرار است و پاسخ دریافت شد. ✅');
    }

    private function groupFor(string $key): string
    {
        if (str_starts_with($key, 'popup_')) return 'popup';
        if (str_starts_with($key, 'enamad_')) return 'trust';
        if (str_starts_with($key, 'sms_')) return 'sms';
        if (str_starts_with($key, 'payment_')) return 'payment';
        if (str_starts_with($key, 'eitaa_')) return 'eitaa';
        if (str_starts_with($key, 'winback_')) return 'winback';
        if (str_starts_with($key, 'lead_reminder_')) return 'lead_reminder';
        if (str_starts_with($key, 'chat_')) return 'chat';
        if (in_array($key, ['site_name', 'site_slogan', 'logo', 'app_logo'], true)) return 'brand';
        if (in_array($key, ['address', 'phone', 'email', 'eitaa', 'website', 'working_hours'], true)) return 'contact';
        if (in_array($key, ['instagram_url', 'eitaa_url'], true)) return 'social';
        if (in_array($key, ['meta_title', 'meta_description', 'keywords', 'og_image'], true)) return 'seo';
        return 'general';
    }

    public function runWinback(): RedirectResponse
    {
        try {
            $exitCode = \Illuminate\Support\Facades\Artisan::call('marketing:winback-visitors');
            $output = trim(\Illuminate\Support\Facades\Artisan::output());

            return back()->with('success', $output ?: 'پیگیری بازدیدکنندگان اجرا شد.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'اجرای پیگیری ناموفق بود: '.$exception->getMessage());
        }
    }

    public function runLeadReminder(): RedirectResponse
    {
        try {
            $exitCode = \Illuminate\Support\Facades\Artisan::call('crm:remind-stale-leads');
            $output = trim(\Illuminate\Support\Facades\Artisan::output());

            return back()->with('success', $output ?: 'یادآوری لیدهای بی‌پاسخ اجرا شد.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', 'اجرای یادآوری لیدها ناموفق بود: '.$exception->getMessage());
        }
    }
}
