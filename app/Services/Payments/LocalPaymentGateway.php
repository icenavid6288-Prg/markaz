<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;

class LocalPaymentGateway implements PaymentGateway
{
    public function create(Order $order): array
    {
        $token = hash_hmac('sha256', $order->order_number, (string) config('app.key'));

        return [
            'gateway' => 'local',
            'payment_url' => route('payments.callback', [
                'order' => $order->order_number,
                'gateway' => 'local',
                'token' => $token,
                'status' => 'success',
            ]),
            'transaction_id' => 'LOCAL-'.$order->order_number,
        ];
    }

    public function verify(Order $order, Request $request): array
    {
        $expected = hash_hmac('sha256', $order->order_number, (string) config('app.key'));

        return hash_equals($expected, (string) $request->query('token'))
            ? ['success' => true, 'reference_id' => 'LOCAL-'.$order->order_number, 'transaction_id' => 'LOCAL-'.$order->order_number]
            : ['success' => false, 'message' => 'توکن پرداخت محلی معتبر نیست.'];
    }

    public function checkConnection(): array
    {
        return ['ok' => true, 'message' => 'درگاه آزمایشی داخلی همیشه در دسترس است.'];
    }

    public function refund(Payment $payment, string $reason = 'refund'): array
    {
        return [
            'ok' => true,
            'channel' => 'local',
            'message' => 'بازگشت وجه آزمایشی ثبت شد.',
            'reference' => 'LOCAL-REFUND-'.$payment->id,
        ];
    }
}
