<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Services\Payments\IdPayPaymentGateway;
use App\Services\Payments\LocalPaymentGateway;
use App\Services\Payments\ZarinpalPaymentGateway;
use App\Services\Payments\ZibalPaymentGateway;
use Illuminate\Console\Command;
use Throwable;

class CheckPaymentConnection extends Command
{
    protected $signature = 'payment:check-connection {--json : خروجی به‌صورت JSON برای اسکریپت‌ها و مانیتورینگ} {--strict : اگر درگاهی در تنظیمات وارد نشده باشد هم خروجی خطا برگرداند}';

    protected $description = 'وضعیت اتصال همه درگاه‌های پرداخت (زرین‌پال، آیدی‌پی، زیبال) را بدون ایجاد یا دریافت تراکنش بررسی می‌کند';

    public function handle(): int
    {
        $gateways = [
            ['key' => 'local', 'label' => 'حالت آزمایشی داخلی', 'configured' => true, 'check' => fn () => (new LocalPaymentGateway)->checkConnection()],
            ['key' => 'zarinpal', 'label' => 'زرین‌پال', 'configured' => filled(Setting::getSecret('payment_zarinpal_merchant_id')), 'check' => fn () => (new ZarinpalPaymentGateway)->checkConnection()],
            ['key' => 'idpay', 'label' => 'آیدی‌پی', 'configured' => filled(Setting::getSecret('payment_idpay_api_key')), 'check' => fn () => (new IdPayPaymentGateway)->checkConnection()],
            ['key' => 'zibal', 'label' => 'زیبال', 'configured' => filled(Setting::getSecret('payment_zibal_merchant')), 'check' => fn () => (new ZibalPaymentGateway)->checkConnection()],
        ];

        $results = [];
        $failed = 0;

        foreach ($gateways as $gateway) {
            $key = $gateway['key'];
            $label = $gateway['label'];

            if (! $gateway['configured']) {
                $results[$key] = ['state' => 'not_configured', 'message' => 'کلیدهای این درگاه در تنظیمات وارد نشده است.'];
                $this->warn("{$label}: تنظیم نشده");
                if ($this->option('strict')) {
                    $failed++;
                }

                continue;
            }

            try {
                $check = $gateway['check']();
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
