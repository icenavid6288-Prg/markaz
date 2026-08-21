<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class ZarinpalPaymentGateway implements PaymentGateway
{
    public function create(Order $order): array
    {
        $merchant = (string) Setting::getSecret('payment_zarinpal_merchant_id', '');
        if ($merchant === '') {
            throw new RuntimeException('Merchant ID زرین‌پال در تنظیمات وارد نشده است.');
        }

        $response = Http::acceptJson()->timeout(20)->post($this->apiUrl('request.json'), [
            'merchant_id' => $merchant,
            'amount' => $this->rial($order->total),
            'description' => (string) Setting::get('payment_description', 'پرداخت سفارش مرکز رشد و کارآفرینی دکتر بیدی'),
            'callback_url' => route('payments.callback', ['order' => $order->order_number, 'gateway' => 'zarinpal']),
            'metadata' => ['mobile' => $order->user?->phone],
        ]);

        $authority = (string) $response->json('data.authority', '');
        if ($response->failed() || $authority === '') {
            throw new RuntimeException('دریافت درگاه زرین‌پال ناموفق بود.');
        }

        return [
            'gateway' => 'zarinpal',
            'authority' => $authority,
            'transaction_id' => $authority,
            'payment_url' => $this->startUrl($authority),
        ];
    }

    public function checkConnection(): array
    {
        $merchant = (string) Setting::getSecret('payment_zarinpal_merchant_id', '');
        if ($merchant === '') {
            return ['ok' => false, 'message' => 'Merchant ID زرین‌پال در تنظیمات وارد نشده است.'];
        }

        try {
            // Querying unverified transactions only lists existing (unpaid) requests;
            // it never creates a transaction and never moves money.
            $response = Http::acceptJson()->timeout(15)->post($this->apiUrl('unVerified.json'), [
                'merchant_id' => $merchant,
            ]);
            $payload = $response->json();
            $code = (int) data_get($payload, 'code', 0);

            if ($response->failed() || $code !== 100) {
                $detail = (string) data_get($payload, 'message', 'پاسخ نامعتبر از سرویس');

                return ['ok' => false, 'message' => 'اتصال به زرین‌پال برقرار نیست: '.$detail];
            }

            return ['ok' => true, 'message' => 'اتصال به زرین‌پال برقرار است.'];
        } catch (Throwable $exception) {
            return ['ok' => false, 'message' => 'اتصال به زرین‌پال برقرار نیست: '.$exception->getMessage()];
        }
    }

    public function verify(Order $order, Request $request): array
    {
        if (strtoupper((string) $request->query('Status')) !== 'OK') {
            return ['success' => false, 'message' => 'پرداخت توسط کاربر لغو شد.'];
        }

        $authority = (string) $request->query('Authority');
        $response = Http::acceptJson()->timeout(20)->post($this->apiUrl('verify.json'), [
            'merchant_id' => Setting::getSecret('payment_zarinpal_merchant_id', ''),
            'amount' => $this->rial($order->total),
            'authority' => $authority,
        ]);
        $code = (int) $response->json('data.code', 0);

        return [
            'success' => $code === 100 || $code === 101,
            'reference_id' => (string) $response->json('data.ref_id', ''),
            'transaction_id' => $authority,
            'message' => $code === 100 || $code === 101 ? null : 'تأیید پرداخت زرین‌پال ناموفق بود.',
        ];
    }

    private function apiUrl(string $path): string
    {
        $base = filter_var(Setting::get('payment_zarinpal_sandbox', false), FILTER_VALIDATE_BOOLEAN)
            ? 'https://sandbox.zarinpal.com/pg/v4/payment/'
            : 'https://payment.zarinpal.com/pg/v4/payment/';

        return $base.$path;
    }

    private function startUrl(string $authority): string
    {
        $base = filter_var(Setting::get('payment_zarinpal_sandbox', false), FILTER_VALIDATE_BOOLEAN)
            ? 'https://sandbox.zarinpal.com/pg/StartPay/'
            : 'https://www.zarinpal.com/pg/StartPay/';

        return $base.$authority;
    }

    private function rial(int $toman): int
    {
        return max(1000, $toman * 10);
    }
}
