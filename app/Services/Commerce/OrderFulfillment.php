<?php

namespace App\Services\Commerce;

use App\Models\CoachAvailability;
use App\Models\CoachingSession;
use App\Models\Coupon;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\Product;

class OrderFulfillment
{
    public function fulfill(Order $order): void
    {
        $this->enrollCourses($order);
        $this->finalizeProducts($order);
    }

    public function enrollCourses(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            if ($item->purchasable_type !== Course::class) {
                continue;
            }

            Enrollment::firstOrCreate(
                ['user_id' => $order->user_id, 'course_id' => $item->purchasable_id],
                ['status' => 'active', 'progress_percent' => 0, 'enrolled_at' => now()],
            );
        }
    }

    public function finalizeProducts(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items->where('purchasable_type', Product::class) as $item) {
            $product = Product::query()->lockForUpdate()->find($item->purchasable_id);
            if (! $product) {
                continue;
            }

            $product->decrement('stock', min((int) $item->quantity, (int) $product->stock));
            $product->decrement('reserved_stock', min((int) $item->quantity, (int) $product->reserved_stock));
        }
    }

    public function releaseReservations(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items->where('purchasable_type', Product::class) as $item) {
            $product = Product::query()->lockForUpdate()->find($item->purchasable_id);
            if ($product) {
                $product->decrement('reserved_stock', min((int) $item->quantity, (int) $product->reserved_stock));
            }
        }

        foreach ($order->items->where('purchasable_type', CoachingSession::class) as $item) {
            $session = CoachingSession::query()->lockForUpdate()->find($item->purchasable_id);
            if (! $session || in_array($session->status, ['completed', 'cancelled'], true)) {
                continue;
            }

            app(SessionCancellation::class)->cancel($session, 'reservation_expired');
        }
    }

    public function findValidCoupon(?string $code, int $subtotal): ?Coupon
    {
        $code = mb_strtoupper(trim((string) $code));
        if ($code === '') {
            return null;
        }

        $coupon = Coupon::query()->whereRaw('UPPER(code) = ?', [$code])->first();

        return $coupon && $coupon->isValid($subtotal) ? $coupon : null;
    }
}
