<?php

namespace App\Services\Commerce;

use App\Models\Order;
use App\Models\Payment;
use App\Notifications\OrderRefundedNotification;
use App\Services\Payments\ConfiguredPaymentGateway;
use Illuminate\Support\Facades\DB;
use Throwable;

class OrderRefund
{
    public function __construct(private readonly ConfiguredPaymentGateway $gateways)
    {
    }

    /**
     * Attempt a real gateway refund for every successful payment, then update the ledger.
     *
     * @return array{refunded: bool, status: string, message: string, channel: ?string}
     */
    public function refund(Order $order, string $reason = 'refund'): array
    {
        $order->loadMissing(['payments', 'user']);

        if (in_array($order->status, ['cancelled', 'failed', 'cart'], true)) {
            return ['refunded' => false, 'status' => $order->status, 'message' => 'این سفارش قابل استرداد نیست.', 'channel' => null];
        }

        $payments = $order->payments
            ->whereIn('status', ['success', 'refund_failed'])
            ->values();

        if ($payments->isEmpty() && $order->status === 'refunded') {
            return ['refunded' => true, 'status' => 'refunded', 'message' => 'این سفارش قبلاً مسترد شده است.', 'channel' => 'ledger'];
        }

        if ($payments->isEmpty() && $order->status === 'paid' && (int) $order->total === 0) {
            $this->markOrder($order, 'refunded', $reason, 'local');

            return ['refunded' => true, 'status' => 'refunded', 'message' => 'سفارش رایگان مسترد شد.', 'channel' => 'local'];
        }

        $allOk = true;
        $lastChannel = null;
        $messages = [];

        foreach ($payments as $payment) {
            $result = $this->refundPayment($payment, $reason);
            $lastChannel = $result['channel'] ?? $lastChannel;
            $messages[] = $result['message'] ?? '';
            $allOk = $allOk && ($result['ok'] ?? false);
        }

        $status = $allOk ? 'refunded' : 'refund_pending';
        $this->markOrder($order, $status, $reason, $lastChannel);
        $message = trim(implode(' ', array_filter($messages))) ?: ($allOk
            ? 'بازگشت وجه ثبت شد.'
            : 'لغو انجام شد اما بازگشت وجه درگاه کامل نشد.');

        if ($allOk && $order->user) {
            try {
                $order->user->notify(new OrderRefundedNotification($order->fresh(), $message));
            } catch (Throwable) {
                // Notification must not roll back a completed refund.
            }
        }

        return [
            'refunded' => $allOk,
            'status' => $status,
            'message' => $message,
            'channel' => $lastChannel,
        ];
    }

    /**
     * @return array{ok:bool, channel:string, message:string, reference?:string}
     */
    private function refundPayment(Payment $payment, string $reason): array
    {
        $result = $this->gateways->refund($payment, $reason);
        $ok = (bool) ($result['ok'] ?? false);
        $channel = (string) ($result['channel'] ?? 'manual');

        $meta = is_array($payment->meta) ? $payment->meta : [];
        $meta['gateway_refund'] = [
            'ok' => $ok,
            'channel' => $channel,
            'message' => $result['message'] ?? null,
            'reference' => $result['reference'] ?? null,
            'at' => now()->toIso8601String(),
            'reason' => $reason,
        ];

        $payment->update([
            'status' => $ok ? 'refunded' : 'refund_failed',
            'meta' => $meta,
        ]);

        return $result + ['ok' => $ok, 'channel' => $channel];
    }

    private function markOrder(Order $order, string $status, string $reason, ?string $channel): void
    {
        DB::transaction(function () use ($order, $status, $reason, $channel): void {
            $locked = Order::query()->lockForUpdate()->find($order->id);
            if (! $locked) {
                return;
            }

            $locked->update([
                'status' => $status,
                'refunded_at' => $status === 'refunded' ? now() : $locked->refunded_at,
                'refund_reason' => $reason.($channel ? ':'.$channel : ''),
                'reservation_expires_at' => null,
            ]);
        });
    }
}
