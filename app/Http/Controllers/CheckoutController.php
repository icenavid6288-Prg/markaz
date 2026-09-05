<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Services\Commerce\OrderFulfillment;
use App\Services\Crm\LeadService;
use App\Services\Payments\ConfiguredPaymentGateway;
use App\Services\Marketing\MarketingCampaignDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Setting;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CheckoutController extends Controller
{
    public function storeEvent(Request $request, \App\Models\Event $event): RedirectResponse
    {
        abort_unless($event->status === 'published', 404);
        $user = $request->user();
        $total = $event->finalPrice();
        $order = DB::transaction(function () use ($user, $event, $total) {
            $isFree = $total === 0;
            $order = Order::create(['order_number' => Order::generateOrderNumber(), 'user_id' => $user->id, 'status' => $isFree ? 'paid' : 'pending', 'subtotal' => $total, 'discount' => max(0, $event->price - $total), 'total' => $total, 'payment_method' => $isFree ? 'free' : null, 'paid_at' => $isFree ? now() : null, 'billing' => ['name' => $user->name, 'email' => $user->email, 'phone' => $user->phone]]);
            $order->items()->create(['purchasable_type' => \App\Models\Event::class, 'purchasable_id' => $event->id, 'title' => $event->title, 'unit_price' => $total, 'quantity' => 1, 'total' => $total]);
            return $order;
        });
        if ($order->status === 'paid') return redirect()->route('events.show', $event->slug)->with('success', 'دسترسی شما به این رویداد فعال شد.');
        return redirect()->route('checkout.show', $order->order_number);
    }

    public function store(Request $request, Course $course): RedirectResponse
    {
        abort_unless($course->is_published, 404);

        $user = $request->user();
        $enrollment = Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->first();
        if ($enrollment) return redirect()->route('dashboard')->with('success', 'شما قبلاً در این دوره ثبت‌نام کرده‌اید.');

        $existingOrder = Order::query()->where('user_id', $user->id)->whereIn('status', ['cart', 'pending'])
            ->whereHas('items', fn ($query) => $query->where('purchasable_type', Course::class)->where('purchasable_id', $course->id))->latest()->first();
        if ($existingOrder) return redirect()->route('checkout.show', ['order' => $existingOrder->order_number]);

        $total = $course->finalPrice();
        $order = DB::transaction(function () use ($user, $course, $total) {
            $isFree = $total === 0;
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(), 'user_id' => $user->id,
                'status' => $isFree ? 'paid' : 'pending', 'subtotal' => $total,
                'discount' => $course->discount_price !== null ? $course->price - $total : 0,
                'total' => $total, 'payment_method' => $isFree ? 'free' : null,
                'paid_at' => $isFree ? now() : null,
                'billing' => ['name' => $user->name, 'email' => $user->email, 'phone' => $user->phone],
            ]);
            $order->items()->create(['purchasable_type' => Course::class, 'purchasable_id' => $course->id, 'title' => $course->title, 'unit_price' => $total, 'quantity' => 1, 'total' => $total]);
            if ($isFree) app(OrderFulfillment::class)->enrollCourses($order);
            return $order;
        });

        if ($order->status === 'paid') return redirect()->route('dashboard')->with('success', 'ثبت‌نام شما با موفقیت انجام شد.');
        return redirect()->route('checkout.show', ['order' => $order->order_number]);
    }

    public function pay(Request $request, Order $order, ConfiguredPaymentGateway $gateway): RedirectResponse
    {
        $this->ensureOwner($request, $order);
        abort_if($order->status === 'paid', 422, 'این سفارش قبلاً پرداخت شده است.');

        // Free orders (e.g. a 100% coupon) never need a gateway.
        if ((int) $order->total === 0) {
            DB::transaction(function () use ($order): void {
                $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);
                if ($lockedOrder->status === 'paid') {
                    return;
                }
                $lockedOrder->update(['status' => 'paid', 'paid_at' => now(), 'payment_method' => 'free', 'reservation_expires_at' => null]);
                $fulfillment = app(OrderFulfillment::class);
                $fulfillment->enrollCourses($lockedOrder);
                $fulfillment->finalizeProducts($lockedOrder);
            });

            return redirect()->route('dashboard')->with('success', 'سفارش رایگان شما فعال شد.');
        }

        abort_unless(filter_var(Setting::get('payment_enabled', false), FILTER_VALIDATE_BOOLEAN), 422, 'درگاه پرداخت هنوز از پنل مدیریت فعال نشده است.');
        abort_if(app()->isProduction() && $gateway->driverName() === 'local', 422, 'درگاه آزمایشی در محیط عملیاتی مجاز نیست. یک درگاه واقعی انتخاب کنید.');

        try {
            $result = $gateway->create($order->load('user'));
            Payment::create([
                'order_id' => $order->id,
                'user_id' => $request->user()->id,
                'gateway' => $result['gateway'],
                'transaction_id' => $result['transaction_id'] ?? $result['authority'] ?? null,
                'amount' => $order->total,
                'status' => 'pending',
                'meta' => ['authority' => $result['authority'] ?? null],
            ]);
            $order->update(['payment_method' => $result['gateway'], 'status' => 'pending']);

            return redirect()->away($result['payment_url']);
        } catch (Throwable $exception) {
            Log::error('Payment initiation failed', ['order' => $order->order_number, 'error' => $exception->getMessage()]);
            return back()->with('error', 'اتصال به درگاه پرداخت انجام نشد. تنظیمات درگاه را بررسی کنید.');
        }
    }

    public function callback(Request $request, Order $order, string $gateway, ConfiguredPaymentGateway $configured): RedirectResponse
    {
        $payment = $order->payments()->where('gateway', $gateway)->where('status', 'pending')->latest()->first();
        if (! $payment) return redirect()->route('home')->with('error', 'تراکنش پرداخت پیدا نشد.');

        // Bind the gateway callback to the exact payment attempt created for this order.
        // Without this check, an authority/track id from another order could be
        // replayed against an order with the same amount on some gateways.
        if (! $this->callbackMatchesPayment($gateway, $request, $payment)) {
            Log::warning('Payment callback did not match payment attempt', [
                'order' => $order->order_number,
                'gateway' => $gateway,
                'payment_id' => $payment->id,
            ]);

            return redirect()->route('checkout.show', ['order' => $order->order_number])
                ->with('error', 'شناسه تراکنش با این سفارش مطابقت ندارد.');
        }

        try {
            $result = $configured->for($gateway)->verify($order->load('items'), $request);
        } catch (Throwable $exception) {
            Log::error('Payment verification failed', ['order' => $order->order_number, 'gateway' => $gateway, 'error' => $exception->getMessage()]);
            $result = ['success' => false, 'message' => 'تأیید تراکنش انجام نشد.'];
        }

        if (! $result['success']) {
            DB::transaction(function () use ($payment, $order, $result): void {
                $payment->update(['status' => 'failed', 'meta' => ['message' => $result['message'] ?? 'failed']]);
                $order->update(['status' => 'failed', 'reservation_expires_at' => null]);
                app(OrderFulfillment::class)->releaseReservations($order);
            });
            return redirect()->route('checkout.show', ['order' => $order->order_number])->with('error', $result['message'] ?? 'پرداخت ناموفق بود.');
        }

        $paidNow = DB::transaction(function () use ($payment, $order, $result): bool {
            $lockedPayment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);

            // Make callback handling idempotent when a gateway retries the callback.
            if ($lockedPayment->status !== 'pending' || $lockedOrder->status === 'paid') {
                return false;
            }

            $lockedPayment->update([
                'status' => 'success',
                'reference_id' => $result['reference_id'] ?? null,
                'transaction_id' => $result['transaction_id'] ?? $lockedPayment->transaction_id,
                'verified_at' => now(),
            ]);
            $lockedOrder->update(['status' => 'paid', 'paid_at' => now(), 'reservation_expires_at' => null]);
            $fulfillment = app(OrderFulfillment::class);
            $fulfillment->enrollCourses($lockedOrder);
            $fulfillment->finalizeProducts($lockedOrder);

            return true;
        });

        // A gateway may retry the callback. Do not send duplicate purchase
        // campaigns for a payment that was already finalized.
        if ($paidNow) {
            $order->loadMissing('user', 'items');

            if ($order->user) {
                $titles = $order->items->pluck('title')->filter()->unique()->take(3)->implode('، ');
                app(LeadService::class)->markCustomer(
                    $order->user,
                    'خرید موفق: '.($titles ?: $order->order_number).' — '.now()->format('Y/m/d H:i'),
                );
            }

            app(MarketingCampaignDispatcher::class)->dispatchForTrigger('course_purchased', [
                'user_id' => $order->user_id,
                'name' => $order->user?->name,
                'phone' => $order->user?->phone,
                'email' => $order->user?->email,
            ]);
        }

        return redirect()->route('dashboard')->with('success', 'پرداخت با موفقیت انجام شد و دسترسی شما فعال شد.');
    }

    public function applyCoupon(Request $request, Order $order): RedirectResponse
    {
        $this->ensureOwner($request, $order);
        abort_if($order->status === 'paid', 422, 'این سفارش قبلاً پرداخت شده است.');

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:32'],
        ]);
        $validated['code'] = mb_strtoupper(trim(preg_replace('/\s+/u', '', $validated['code']) ?? $validated['code']));

        $coupon = app(OrderFulfillment::class)->findValidCoupon($validated['code'], (int) $order->items->sum('total'));
        if (! $coupon) {
            return back()->withErrors(['code' => 'کد تخفیف معتبر نیست یا منقضی شده است.']);
        }

        $itemsTotal = (int) $order->items->sum('total');
        $couponDiscount = $coupon->discountFor($itemsTotal);
        $newTotal = max(0, $itemsTotal - $couponDiscount);
        $isFree = $newTotal === 0;

        DB::transaction(function () use ($order, $coupon, $newTotal, $itemsTotal, $isFree) {
            $order->update([
                'coupon_id' => $coupon->id,
                'discount' => $itemsTotal - $newTotal,
                'total' => $newTotal,
                'status' => $isFree ? 'paid' : $order->status,
                'payment_method' => $isFree ? 'free' : $order->payment_method,
                'paid_at' => $isFree ? now() : $order->paid_at,
            ]);
            $coupon->increment('used_count');
            if ($isFree) {
                app(OrderFulfillment::class)->enrollCourses($order);
            }
        });

        if ($isFree) {
            return redirect()->route('dashboard')->with('success', 'ثبت‌نام شما با کد تخفیف با موفقیت انجام شد.');
        }

        return back()->with('success', 'کد تخفیف اعمال شد.');
    }

    public function removeCoupon(Request $request, Order $order): RedirectResponse
    {
        $this->ensureOwner($request, $order);
        abort_if($order->status === 'paid', 422, 'این سفارش قبلاً پرداخت شده است.');

        $order->update([
            'coupon_id' => null,
            'discount' => 0,
            'total' => (int) $order->subtotal,
        ]);

        return back()->with('success', 'کد تخفیف حذف شد.');
    }

    public function show(Request $request, Order $order): Response|RedirectResponse
    {
        $this->ensureOwner($request, $order);
        if ($order->status === 'paid') return redirect()->route('dashboard')->with('success', 'این سفارش قبلاً پرداخت شده است.');
        $order->load('items.purchasable', 'coupon');

        return Inertia::render('Checkout/Show', [
            'order' => [
                'order_number' => $order->order_number, 'status' => $order->status, 'subtotal' => $order->subtotal,
                'discount' => $order->discount, 'total' => $order->total, 'billing' => $order->billing,
                'items' => $order->items->map(fn ($item) => ['id' => $item->id, 'title' => $item->title, 'unit_price' => $item->unit_price, 'quantity' => $item->quantity, 'total' => $item->total, 'course_slug' => $item->purchasable instanceof Course ? $item->purchasable->slug : null, 'product_slug' => $item->purchasable instanceof Product ? $item->purchasable->slug : null])->values(),
            ],
            'coupon' => $order->coupon ? ['code' => $order->coupon->code, 'discount' => $order->discount] : null,
            'payment' => [
                'enabled' => filter_var(Setting::get('payment_enabled', false), FILTER_VALIDATE_BOOLEAN),
                'gateway' => (string) Setting::get('payment_gateway', 'local'),
            ],
        ]);
    }

    private function callbackMatchesPayment(string $gateway, Request $request, Payment $payment): bool
    {
        if ($gateway === 'local') {
            return true; // LocalPaymentGateway validates its HMAC token in verify().
        }

        $callbackId = match ($gateway) {
            'zarinpal' => (string) $request->query('Authority'),
            'idpay' => (string) $request->query('id'),
            'zibal' => (string) $request->query('trackId'),
            default => '',
        };

        return $callbackId !== ''
            && (string) $payment->transaction_id !== ''
            && hash_equals((string) $payment->transaction_id, $callbackId);
    }

    private function ensureOwner(Request $request, Order $order): void
    {
        abort_unless($order->user_id === $request->user()->id, 403);
    }
}
