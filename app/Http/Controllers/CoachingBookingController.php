<?php

namespace App\Http\Controllers;

use App\Models\CoachAvailability;
use App\Models\CoachingSession;
use App\Models\Order;
use App\Services\Commerce\SessionCancellation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CoachingBookingController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['availability_id' => ['required', 'integer', 'exists:coach_availability,id'], 'notes' => ['nullable', 'string', 'max:2000']]);

        $order = DB::transaction(function () use ($request, $data): Order {
            $slot = CoachAvailability::query()->lockForUpdate()->with('coach.coach')->findOrFail($data['availability_id']);
            abort_unless(! $slot->is_booked && $slot->coach?->coach?->is_available, 422, 'این زمان قبلاً رزرو شده یا دیگر در دسترس نیست.');
            $scheduledAt = Carbon::parse($slot->available_date->format('Y-m-d').' '.$slot->start_time);
            abort_if($scheduledAt->isPast(), 422, 'زمان انتخاب‌شده گذشته است.');

            $price = (int) ($slot->coach?->coach?->hourly_rate ?? 0);
            $session = CoachingSession::create([
                'coach_id' => $slot->coach_id,
                'student_id' => $request->user()->id,
                'scheduled_at' => $scheduledAt,
                'duration_minutes' => max(1, $scheduledAt->diffInMinutes(Carbon::parse($slot->available_date->format('Y-m-d').' '.$slot->end_time))),
                'status' => 'pending',
                'price' => $price,
                'notes' => $data['notes'] ?? null,
            ]);
            $slot->update(['is_booked' => true]);

            $isFree = $price === 0;
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'user_id' => $request->user()->id,
                'status' => $isFree ? 'paid' : 'pending',
                'subtotal' => $price,
                'discount' => 0,
                'total' => $price,
                'payment_method' => $isFree ? 'free' : null,
                'paid_at' => $isFree ? now() : null,
                'reservation_expires_at' => $isFree ? null : now()->addMinutes((int) config('commerce.reservation_minutes', 30)),
                'billing' => [
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'phone' => $request->user()->phone,
                ],
            ]);
            $order->items()->create([
                'purchasable_type' => CoachingSession::class,
                'purchasable_id' => $session->id,
                'title' => 'جلسه کوچینگ با '.($slot->coach?->name ?? 'کوچ مرکز رشد'),
                'unit_price' => $price,
                'quantity' => 1,
                'total' => $price,
            ]);

            return $order;
        });

        if ($order->status === 'paid') {
            return redirect()->route('dashboard.sessions')->with('success', 'درخواست رزرو جلسه ثبت شد و پس از تأیید کوچ در پنل شما نمایش داده می‌شود.');
        }

        return redirect()->route('checkout.show', ['order' => $order->order_number])
            ->with('success', 'زمان جلسه رزرو شد؛ برای قطعی شدن، پرداخت را کامل کنید.');
    }

    public function cancel(Request $request, CoachingSession $session): RedirectResponse
    {
        abort_unless($session->student_id === $request->user()->id, 403);
        abort_if(in_array($session->status, ['completed', 'cancelled'], true), 422, 'این جلسه قابل لغو نیست.');
        abort_if($session->scheduled_at?->isPast(), 422, 'زمان جلسه گذشته است و فقط کوچ یا ادمین می‌تواند آن را لغو کند.');

        $result = app(SessionCancellation::class)->cancel($session, 'student');
        abort_unless($result['cancelled'], 422, 'لغو جلسه انجام نشد.');

        return back()->with('success', $result['refunded']
            ? 'جلسه لغو شد و مبلغ سفارش برای بازگشت وجه ثبت شد.'
            : 'جلسه لغو شد و زمان آزاد شد.');
    }
}
