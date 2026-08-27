<?php

namespace App\Services\Commerce;

use App\Models\CoachAvailability;
use App\Models\CoachingSession;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class SessionCancellation
{
    /**
     * Cancel a coaching session, free the calendar slot, and settle the related order.
     *
     * @return array{cancelled: bool, refunded: bool, order_status: ?string}
     */
    public function cancel(CoachingSession $session, string $reason = 'cancelled'): array
    {
        $outcome = DB::transaction(function () use ($session, $reason): array {
            $locked = CoachingSession::query()->lockForUpdate()->findOrFail($session->id);

            if ($locked->status === 'completed') {
                return ['cancelled' => false, 'refunded' => false, 'order_status' => null, 'refund_order_id' => null];
            }

            if ($locked->status !== 'cancelled') {
                $locked->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                    'cancel_reason' => $reason,
                ]);
            } elseif (! $locked->cancelled_at) {
                $locked->update([
                    'cancelled_at' => now(),
                    'cancel_reason' => $locked->cancel_reason ?: $reason,
                ]);
            }

            $this->releaseSlot($locked);

            $item = OrderItem::query()
                ->where('purchasable_type', CoachingSession::class)
                ->where('purchasable_id', $locked->id)
                ->latest('id')
                ->first();

            if (! $item) {
                return ['cancelled' => true, 'refunded' => false, 'order_status' => null, 'refund_order_id' => null];
            }

            $order = Order::query()->lockForUpdate()->find($item->order_id);
            if (! $order) {
                return ['cancelled' => true, 'refunded' => false, 'order_status' => null, 'refund_order_id' => null];
            }

            $order->load('items');
            $onlyThisSession = $order->items->count() === 1
                && $order->items->first()?->purchasable_type === CoachingSession::class
                && (int) $order->items->first()?->purchasable_id === (int) $locked->id;

            if (! $onlyThisSession) {
                return ['cancelled' => true, 'refunded' => false, 'order_status' => $order->status, 'refund_order_id' => null];
            }

            if ($order->status === 'pending') {
                $order->update([
                    'status' => 'cancelled',
                    'reservation_expires_at' => null,
                    'refund_reason' => $reason,
                ]);

                return ['cancelled' => true, 'refunded' => false, 'order_status' => 'cancelled', 'refund_order_id' => null];
            }

            if (in_array($order->status, ['paid', 'refund_pending'], true)) {
                return ['cancelled' => true, 'refunded' => false, 'order_status' => $order->status, 'refund_order_id' => $order->id];
            }

            return [
                'cancelled' => true,
                'refunded' => $order->status === 'refunded',
                'order_status' => $order->status,
                'refund_order_id' => null,
            ];
        });

        if ($outcome['refund_order_id']) {
            $refund = app(OrderRefund::class)->refund(Order::query()->findOrFail($outcome['refund_order_id']), $reason);
            $outcome['refunded'] = $refund['refunded'];
            $outcome['order_status'] = $refund['status'];
        }

        unset($outcome['refund_order_id']);

        return $outcome;
    }

    public function releaseSlot(CoachingSession $session): void
    {
        if (! $session->scheduled_at) {
            return;
        }

        $time = $session->scheduled_at->format('H:i:s');
        $short = $session->scheduled_at->format('H:i');
        CoachAvailability::query()
            ->where('coach_id', $session->coach_id)
            ->whereDate('available_date', $session->scheduled_at->toDateString())
            ->where(function ($query) use ($time, $short): void {
                $query->where('start_time', $time)->orWhere('start_time', $short);
            })
            ->update(['is_booked' => false]);
    }
}
