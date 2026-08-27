<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class ZibalPaymentGateway implements PaymentGateway
{
    public function create(Order $order): array
    {
        $merchant = (string) Setting::getSecret('payment_zibal_merchant', '');
        if ($merchant === '') {
            throw new RuntimeException('Merchant زیبال در تنظیمات وارد نشده است.');
        }

        $response = Http::acceptJson()->timeout(20)->post('https://gateway.zibal.ir/v1/request', [
            'merchant' => $merchant,
            'amount' => $order->total * 10,
            'callbackUrl' => route('payments.callback', ['order' => $order->order_number, 'gateway' => 'zibal']),
            'orderId' => $order->order_number,
            'description' => (string) Setting::get('payment_description', 'پرداخت سفارش مرکز رشد و کارآفرینی دکتر بیدی'),
        ]);
        $trackId = (string) $response->json('trackId', '');

        if ($response->failed() || $trackId === '') {
            throw new RuntimeException('دریافت درگاه زیبال ناموفق بود.');
        }

        return [
            'gateway' => 'zibal',
            'authority' => $trackId,
            'transaction_id' => $trackId,
            'payment_url' => 'https://gateway.zibal.ir/start/'.$trackId,
        ];
    }

    public function checkConnection(): array
    {
        $merchant = (string) Setting::getSecret('payment_zibal_merchant', '');
        if ($merchant === '') {
            return ['ok' => false, 'message' => 'Merchant زیبال در تنظیمات وارد نشده است.'];
        }

        try {
            // Verify only looks up an existing transaction; a bogus trackId is never
            // charged or refunded. Zibal validates the merchant first, so codes 102/103/104
            // mean the credentials are wrong, while 105 (transaction not found) proves the
            // merchant is valid and the connection works.
            $response = Http::acceptJson()->timeout(15)->post('https://gateway.zibal.ir/v1/verify', [
                'merchant' => $merchant,
                'trackId' => '0',
            ]);
            $payload = $response->json();
            $result = (int) ($payload['resultCode'] ?? $payload['result'] ?? -1);

            if ($response->failed()) {
                return ['ok' => false, 'message' => 'اتصال به زیبال برقرار نیست: خطای '.$response->status().' از سرویس دریافت شد.'];
            }

            if (in_array($result, [102, 103, 104], true)) {
                $detail = (string) $response->json('message', 'پاسخ نامعتبر از سرویس');

                return ['ok' => false, 'message' => 'اتصال به زیبال برقرار نیست: '.$detail];
            }

            return ['ok' => true, 'message' => 'اتصال به زیبال برقرار است.'];
        } catch (Throwable $exception) {
            return ['ok' => false, 'message' => 'اتصال به زیبال برقرار نیست: '.$exception->getMessage()];
        }
    }

    public function verify(Order $order, Request $request): array
    {
        $trackId = (string) $request->query('trackId');
        $merchant = (string) Setting::getSecret('payment_zibal_merchant', '');
        if ($trackId === '') {
            return ['success' => false, 'message' => 'شناسه پرداخت زیبال دریافت نشد.'];
        }

        $response = Http::acceptJson()->timeout(20)->post('https://gateway.zibal.ir/v1/verify', [
            'merchant' => $merchant,
            'trackId' => $trackId,
        ]);
        $resultCode = (int) $response->json('resultCode', -1);

        return [
            'success' => $resultCode === 100,
            'reference_id' => (string) $response->json('referenceNumber', ''),
            'transaction_id' => $trackId,
            'message' => $resultCode === 100 ? null : 'تأیید پرداخت زیبال ناموفق بود.',
        ];
    }

    public function refund(Payment $payment, string $reason = 'refund'): array
    {
        $merchant = (string) Setting::getSecret('payment_zibal_merchant', '');
        $trackId = (string) ($payment->transaction_id ?: data_get($payment->meta, 'authority', ''));
        if ($merchant === '' || $trackId === '') {
            return [
                'ok' => true,
                'channel' => 'manual',
                'message' => 'شناسه زیبال برای بازگشت وجه کامل نیست. سفارش در سیستم مسترد شد؛ مبلغ را از پنل زیبال برگردانید.',
            ];
        }

        try {
            $response = Http::acceptJson()->timeout(20)->post('https://gateway.zibal.ir/v1/refund', [
                'merchant' => $merchant,
                'trackId' => is_numeric($trackId) ? (int) $trackId : $trackId,
                'amount' => max(0, (int) $payment->amount) * 10,
                'description' => $reason,
            ]);
            $result = (int) ($response->json('result') ?? $response->json('resultCode') ?? -1);
            $ok = $response->successful() && in_array($result, [100, 1], true);

            return [
                'ok' => $ok,
                'channel' => 'gateway',
                'reference' => (string) ($response->json('refundId') ?? $response->json('refNumber') ?? ''),
                'message' => $ok
                    ? 'مبلغ از زیبال به حساب پرداخت‌کننده برگشت داده شد.'
                    : (string) ($response->json('message') ?: 'بازگشت وجه زیبال ناموفق بود.'),
            ];
        } catch (Throwable $exception) {
            return ['ok' => false, 'channel' => 'gateway', 'message' => 'اتصال بازگشت وجه زیبال برقرار نشد: '.$exception->getMessage()];
        }
    }
}
