<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use Illuminate\Http\Request;
use RuntimeException;

class ConfiguredPaymentGateway implements PaymentGateway
{
    public function __construct(
        private readonly LocalPaymentGateway $local,
        private readonly ZarinpalPaymentGateway $zarinpal,
        private readonly IdPayPaymentGateway $idpay,
        private readonly ZibalPaymentGateway $zibal,
    ) {
    }

    public function create(Order $order): array
    {
        return $this->driver()->create($order);
    }

    public function verify(Order $order, Request $request): array
    {
        return $this->driver()->verify($order, $request);
    }

    public function checkConnection(): array
    {
        return $this->driver()->checkConnection();
    }

    public function refund(Payment $payment, string $reason = 'refund'): array
    {
        return $this->for((string) ($payment->gateway ?: $this->driverName()))->refund($payment, $reason);
    }

    public function driverName(): string
    {
        return (string) Setting::get('payment_gateway', 'local');
    }

    public function for(string $name): PaymentGateway
    {
        return match ($name) {
            'zarinpal' => $this->zarinpal,
            'idpay' => $this->idpay,
            'zibal' => $this->zibal,
            'local' => $this->local,
            default => throw new RuntimeException('درگاه پرداخت شناخته‌شده نیست.'),
        };
    }

    private function driver(): PaymentGateway
    {
        return match ($this->driverName()) {
            'zarinpal' => $this->zarinpal,
            'idpay' => $this->idpay,
            'zibal' => $this->zibal,
            'local' => $this->local,
            default => throw new RuntimeException('درگاه پرداخت انتخاب‌شده شناخته‌شده نیست.'),
        };
    }
}
