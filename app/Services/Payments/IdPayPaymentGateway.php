<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class IdPayPaymentGateway implements PaymentGateway
{
    public function create(Order $order): array
    {
        $apiKey = (string) Setting::getSecret('payment_idpay_api_key', '');
        if ($apiKey === '') {
            throw new RuntimeException('API Key آیدی‌پی در تنظیمات وارد نشده است.');
        }

        $response = Http::withHeaders($this->headers($apiKey))->timeout(20)->post('https://api.idpay.ir/v1.1/payment', [
            'order_id' => $order->order_number,
            'amount' => $order->total,
            'name' => $order->user?->name,
            'phone' => $order->user?->phone,
            'desc' => (string) Setting::get('payment_description', 'پرداخت سفارش مرکز رشد و کارآفرینی دکتر بیدی'),
            'callback' => route('payments.callback', ['order' => $order->order_number, 'gateway' => 'idpay']),
        ]);

        $id = (string) $response->json('id', '');
        $link = (string) $response->json('link', '');
        if ($response->failed() || $id === '' || $link === '') {
            throw new RuntimeException('دریافت درگاه آیدی‌پی ناموفق بود.');
        }

        return ['gateway' => 'idpay', 'authority' => $id, 'transaction_id' => $id, 'payment_url' => $link];
    }

    public function checkConnection(): array
    {
        $apiKey = (string) Setting::getSecret('payment_idpay_api_key', '');
        if ($apiKey === '') {
            return ['ok' => false, 'message' => 'API Key آیدی‌پی در تنظیمات وارد نشده است.'];
        }

        try {
            // Transaction inquiry is read-only and never creates or charges anything.
            // IDPay rejects an invalid key with 401/403 before any business logic; a bogus
            // id simply answers "transaction not found" (or a similar business error), which
            // still proves the key is valid and the connection works.
            $response = Http::withHeaders(['X-API-KEY' => $apiKey, 'X-SANDBOX' => filter_var(Setting::get('payment_idpay_sandbox', false), FILTER_VALIDATE_BOOLEAN) ? '1' : '0'])
                ->asJson()
                ->timeout(15)
                ->post('https://api.idpay.ir/v1.1/payment/inquiry', [
                    'order_id' => 'connection-check',
                    'id' => '00000000000000000000000000000000',
                ]);

            if ($response->status() === 401 || $response->status() === 403) {
                return ['ok' => false, 'message' => 'اتصال به آیدی‌پی برقرار نیست: کلید API نامعتبر است یا دسترسی رد شد.'];
            }

            if ($response->serverError()) {
                return ['ok' => false, 'message' => 'اتصال به آیدی‌پی برقرار نیست: خطای '.$response->status().' از سرویس دریافت شد.'];
            }

            return ['ok' => true, 'message' => 'اتصال به آیدی‌پی برقرار است.'];
        } catch (Throwable $exception) {
            return ['ok' => false, 'message' => 'اتصال به آیدی‌پی برقرار نیست: '.$exception->getMessage()];
        }
    }

    public function verify(Order $order, Request $request): array
    {
        $apiKey = (string) Setting::getSecret('payment_idpay_api_key', '');
        $id = (string) $request->query('id');
        $status = (int) $request->query('status', 0);
        if ($id === '' || $status !== 10) {
            return ['success' => false, 'message' => 'پرداخت آیدی‌پی تکمیل نشد.'];
        }

        $response = Http::withHeaders($this->headers($apiKey))->timeout(20)->post('https://api.idpay.ir/v1.1/payment/verify', [
            'order_id' => $order->order_number,
            'id' => $id,
        ]);
        $verified = (int) $response->json('status', 0) === 100;

        return [
            'success' => $verified,
            'reference_id' => (string) $response->json('payment.track_id', ''),
            'transaction_id' => $id,
            'message' => $verified ? null : 'تأیید پرداخت آیدی‌پی ناموفق بود.',
        ];
    }

    private function headers(string $apiKey): array
    {
        return [
            'X-API-KEY' => $apiKey,
            'X-SANDBOX' => filter_var(Setting::get('payment_idpay_sandbox', false), FILTER_VALIDATE_BOOLEAN) ? '1' : '0',
            'Content-Type' => 'application/json',
        ];
    }
}
