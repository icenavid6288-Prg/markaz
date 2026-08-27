<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // ── برند ──
            ['group' => 'brand', 'key' => 'site_name', 'value' => ['value' => 'مرکز رشد و کارآفرینی دکتر بیدی'], 'is_public' => true],
            ['group' => 'brand', 'key' => 'site_slogan', 'value' => ['value' => 'طراحی مسیر آینده نوجوانان'], 'is_public' => true],
            ['group' => 'brand', 'key' => 'logo', 'value' => ['value' => null], 'is_public' => true],
            ['group' => 'brand', 'key' => 'logo_light', 'value' => ['value' => null], 'is_public' => true],
            ['group' => 'brand', 'key' => 'favicon', 'value' => ['value' => null], 'is_public' => true],

            // ── اطلاعات تماس (از دیتابیس خوانده می‌شود) ──
            ['group' => 'contact', 'key' => 'address', 'value' => ['value' => 'خیابان بیهق، بین بیهق ۹ و ۱۱، جنب قنادی درخشان'], 'is_public' => true],
            ['group' => 'contact', 'key' => 'phone', 'value' => ['value' => '09330961312'], 'is_public' => true],
            ['group' => 'contact', 'key' => 'email', 'value' => ['value' => 'info@saradar.ir'], 'is_public' => true],
            ['group' => 'contact', 'key' => 'eitaa', 'value' => ['value' => '@karafarini'], 'is_public' => true],
            ['group' => 'contact', 'key' => 'website', 'value' => ['value' => 'www.saradar.ir'], 'is_public' => true],
            ['group' => 'contact', 'key' => 'instagram', 'value' => ['value' => null], 'is_public' => true],
            ['group' => 'contact', 'key' => 'telegram', 'value' => ['value' => null], 'is_public' => true],
            ['group' => 'contact', 'key' => 'whatsapp', 'value' => ['value' => null], 'is_public' => true],
            ['group' => 'contact', 'key' => 'working_hours', 'value' => ['value' => 'شنبه تا پنجشنبه، ۹ صبح تا ۸ شب'], 'is_public' => true],

            // ── شبکه‌های اجتماعی ──
            ['group' => 'social', 'key' => 'instagram_url', 'value' => ['value' => 'https://instagram.com'], 'is_public' => true],
            ['group' => 'social', 'key' => 'eitaa_url', 'value' => ['value' => 'https://eitaa.com/karafarini'], 'is_public' => true],

            // ── نماد اعتماد الکترونیکی ──
            ['group' => 'trust', 'key' => 'enamad_enabled', 'value' => ['value' => '0'], 'is_public' => true],
            ['group' => 'trust', 'key' => 'enamad_title', 'value' => ['value' => 'نماد اعتماد الکترونیکی'], 'is_public' => true],
            ['group' => 'trust', 'key' => 'enamad_image_url', 'value' => ['value' => null], 'is_public' => true],
            ['group' => 'trust', 'key' => 'enamad_link_url', 'value' => ['value' => null], 'is_public' => true],
            ['group' => 'trust', 'key' => 'enamad_code', 'value' => ['value' => null], 'is_public' => false],

            // ── SEO ──
            ['group' => 'seo', 'key' => 'meta_title', 'value' => ['value' => 'مرکز رشد و کارآفرینی دکتر بیدی | طراحی مسیر آینده نوجوانان'], 'is_public' => true],
            ['group' => 'seo', 'key' => 'meta_description', 'value' => ['value' => 'کشف استعداد، کوچینگ تحصیلی و رشد فردی نوجوانان، آموزش مهارت‌های آینده، دوره‌ها و مشاوره تخصصی'], 'is_public' => true],
            ['group' => 'seo', 'key' => 'og_image', 'value' => ['value' => null], 'is_public' => true],
            ['group' => 'seo', 'key' => 'keywords', 'value' => ['value' => 'کوچینگ نوجوان، کشف استعداد، مهارت‌های آینده، مسیر رشد، کوچینگ تحصیلی'], 'is_public' => true],

            // ── عمومی ──
            ['group' => 'general', 'key' => 'currency', 'value' => ['value' => 'تومان'], 'is_public' => true],
            ['group' => 'general', 'key' => 'stat_students', 'value' => ['value' => '2500'], 'is_public' => true],
            ['group' => 'general', 'key' => 'stat_courses', 'value' => ['value' => '120'], 'is_public' => true],
            ['group' => 'general', 'key' => 'stat_team', 'value' => ['value' => '50'], 'is_public' => true],
            ['group' => 'general', 'key' => 'stat_experience', 'value' => ['value' => '8'], 'is_public' => true],
            ['group' => 'general', 'key' => 'stat_sessions', 'value' => ['value' => '5000'], 'is_public' => true],
            ['group' => 'general', 'key' => 'stat_satisfaction', 'value' => ['value' => '97'], 'is_public' => true],
            ['group' => 'general', 'key' => 'locale', 'value' => ['value' => 'fa'], 'is_public' => true],
            ['group' => 'general', 'key' => 'homepage_hero_title', 'value' => ['value' => 'مسیر آینده فرزندتان را با آگاهی و هدف طراحی کنید'], 'is_public' => true],
            ['group' => 'general', 'key' => 'homepage_hero_subtitle', 'value' => ['value' => 'ما به نوجوانان کمک می‌کنیم استعدادهایشان را کشف کنند، مهارت‌ها را بسازند و آینده‌ای روشن برای خود طراحی کنند.'], 'is_public' => true],
            ['group' => 'general', 'key' => 'homepage_cta_primary', 'value' => ['value' => 'رزرو جلسه مشاوره رایگان'], 'is_public' => true],
            ['group' => 'general', 'key' => 'homepage_cta_secondary', 'value' => ['value' => 'مشاهده خدمات'], 'is_public' => true],
            ['group' => 'general', 'key' => 'footer_about', 'value' => ['value' => 'مرکز رشد و کارآفرینی دکتر بیدی، اکوسیستم جامع آموزش، کوچینگ و طراحی مسیر رشد برای نوجوانان، والدین و مدرسین.'], 'is_public' => true],

            // ── پاپ‌آپ عمومی ──
            ['group' => 'popup', 'key' => 'popup_enabled', 'value' => ['value' => '1'], 'is_public' => true],
            ['group' => 'popup', 'key' => 'popup_title', 'value' => ['value' => 'مسیر رشد فرزندتان را آگاهانه شروع کنید'], 'is_public' => true],
            ['group' => 'popup', 'key' => 'popup_message', 'value' => ['value' => 'در یک جلسه مشاوره رایگان، اولین قدم مسیر رشد نوجوانتان را با همراهی متخصصان بردارید.'], 'is_public' => true],
            ['group' => 'popup', 'key' => 'popup_cta_label', 'value' => ['value' => 'رزرو مشاوره رایگان'], 'is_public' => true],
            ['group' => 'popup', 'key' => 'popup_cta_url', 'value' => ['value' => '/contact'], 'is_public' => true],
            ['group' => 'popup', 'key' => 'popup_delay_seconds', 'value' => ['value' => '4'], 'is_public' => true],
            ['group' => 'popup', 'key' => 'popup_frequency', 'value' => ['value' => 'session'], 'is_public' => true],

            // ── اتصال پیامک (کلیدهای حساس عمداً در Seeder قرار نمی‌گیرند) ──
            ['group' => 'sms', 'key' => 'sms_driver', 'value' => ['value' => 'log'], 'is_public' => false],
            ['group' => 'sms', 'key' => 'sms_enabled', 'value' => ['value' => '0'], 'is_public' => false],
            ['group' => 'sms', 'key' => 'sms_otp_message', 'value' => ['value' => 'کد تأیید شما در مرکز رشد و کارآفرینی دکتر بیدی: {code}'], 'is_public' => false],
            ['group' => 'sms', 'key' => 'sms_test_recipient', 'value' => ['value' => null], 'is_public' => false],

            // ── پرداخت (ابتدا حالت آزمایشی و خاموش) ──
            ['group' => 'payment', 'key' => 'payment_enabled', 'value' => ['value' => '0'], 'is_public' => false],
            ['group' => 'payment', 'key' => 'payment_gateway', 'value' => ['value' => 'local'], 'is_public' => false],
            ['group' => 'payment', 'key' => 'payment_description', 'value' => ['value' => 'پرداخت سفارش مرکز رشد و کارآفرینی دکتر بیدی'], 'is_public' => false],
            ['group' => 'payment', 'key' => 'payment_zarinpal_sandbox', 'value' => ['value' => '1'], 'is_public' => false],
            ['group' => 'payment', 'key' => 'payment_idpay_sandbox', 'value' => ['value' => '1'], 'is_public' => false],
            ['group' => 'payment', 'key' => 'payment_zibal_sandbox', 'value' => ['value' => '1'], 'is_public' => false],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['group' => $setting['group'], 'key' => $setting['key']],
                ['value' => $setting['value'], 'is_public' => $setting['is_public']]
            );
        }
    }
}
