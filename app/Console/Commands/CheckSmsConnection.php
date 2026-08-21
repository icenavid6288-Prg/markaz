<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Services\Sms\KavenegarSmsSender;
use App\Services\Sms\MelipayamakSmsSender;
use App\Services\Sms\SmsIrSmsSender;
use Illuminate\Console\Command;
use Throwable;

class CheckSmsConnection extends Command
{
    protected $signature = 'sms:check-connection {--json : خروجی به‌صورت JSON برای اسکریپت‌ها و مانیتورینگ} {--strict : اگر پنلی در تنظیمات وارد نشده باشد هم خروجی خطا برگرداند}';

    protected $description = 'وضعیت اتصال همه پنل‌های پیامک (اصلی و پشتیبان) را بدون ارسال پیام بررسی می‌کند';

    public function handle(): int
    {
        $panels = [
            ['key' => 'log', 'label' => 'لاگ (توسعه)', 'configured' => true, 'check' => fn () => ['ok' => true, 'message' => 'درایور لاگ همیشه در دسترس است.']],
            ['key' => 'kavenegar', 'label' => 'کاوه‌نگار (اصلی)', 'configured' => filled(Setting::getSecret('sms_kavenegar_api_key')), 'check' => fn () => (new KavenegarSmsSender)->checkConnection()],
            ['key' => 'kavenegar_backup', 'label' => 'کاوه‌نگار (پشتیبان)', 'configured' => filled(Setting::getSecret('sms_backup_kavenegar_api_key')), 'check' => fn () => (new KavenegarSmsSender('sms_backup_kavenegar_'))->checkConnection()],
            ['key' => 'smsir', 'label' => 'SMS.ir (اصلی)', 'configured' => filled(Setting::getSecret('sms_ir_api_key')), 'check' => fn () => (new SmsIrSmsSender)->checkConnection()],
            ['key' => 'smsir_backup', 'label' => 'SMS.ir (پشتیبان)', 'configured' => filled(Setting::getSecret('sms_backup_smsir_api_key')), 'check' => fn () => (new SmsIrSmsSender('sms_backup_smsir_'))->checkConnection()],
            ['key' => 'melipayamak', 'label' => 'ملی‌پیامک (اصلی)', 'configured' => filled(Setting::getSecret('sms_melipayamak_username')) && filled(Setting::getSecret('sms_melipayamak_password')), 'check' => fn () => (new MelipayamakSmsSender)->checkConnection()],
            ['key' => 'melipayamak_backup', 'label' => 'ملی‌پیامک (پشتیبان)', 'configured' => filled(Setting::getSecret('sms_backup_melipayamak_username')) && filled(Setting::getSecret('sms_backup_melipayamak_password')), 'check' => fn () => (new MelipayamakSmsSender('sms_backup_melipayamak_'))->checkConnection()],
        ];

        $results = [];
        $failed = 0;

        foreach ($panels as $panel) {
            $key = $panel['key'];
            $label = $panel['label'];

            if (! $panel['configured']) {
                $results[$key] = ['state' => 'not_configured', 'message' => 'کلیدهای این پنل در تنظیمات وارد نشده است.'];
                $this->warn("{$label}: تنظیم نشده");
                if ($this->option('strict')) {
                    $failed++;
                }

                continue;
            }

            try {
                $check = $panel['check']();
                $results[$key] = ['state' => $check['ok'] ? 'ok' : 'error', 'message' => $check['message']];

                if ($check['ok']) {
                    $this->info("{$label}: متصل — {$check['message']}");
                } else {
                    $failed++;
                    $this->error("{$label}: خطا — {$check['message']}");
                }
            } catch (Throwable $exception) {
                $failed++;
                $results[$key] = ['state' => 'error', 'message' => 'بررسی اتصال ناموفق بود: '.$exception->getMessage()];
                $this->error("{$label}: خطا — {$exception->getMessage()}");
            }
        }

        if ($this->option('json')) {
            $this->line(json_encode($results, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
