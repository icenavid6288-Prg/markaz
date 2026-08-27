<?php

namespace Tests\Feature;

use App\Models\Coach;
use App\Models\CoachAvailability;
use App\Models\CoachingSession;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\OrderRefundedNotification;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class GatewayRefundTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_zarinpal_refund_is_requested_when_a_paid_session_is_cancelled(): void
    {
        Notification::fake();
        Setting::setSecret('payment_zarinpal_merchant_id', 'merchant-test', 'payment');
        Setting::setSecret('payment_zarinpal_access_token', 'access-token', 'payment');
        Http::fake([
            'sandbox.zarinpal.com/*' => Http::response(['data' => ['code' => 100, 'ref_id' => 88]]),
            'api.zarinpal.com/*' => Http::response(['data' => ['code' => 100, 'ref_id' => 88]]),
        ]);

        [$coach, $student, $slot, $session, $order] = $this->paidBooking('zarinpal', 'A000000000000000000000000000xpgr85j5');

        $this->actingAs($coach)->patch('/panel/coach/sessions/'.$session->id, ['status' => 'cancelled'])->assertRedirect();

        $this->assertSame('cancelled', $session->fresh()->status);
        $this->assertSame('refunded', $order->fresh()->status);
        $this->assertSame('refunded', $order->payments()->value('status'));
        $this->assertFalse((bool) $slot->fresh()->is_booked);
        Http::assertSent(fn ($request) => str_contains($request->url(), 'refund.json') && $request['authority'] === 'A000000000000000000000000000xpgr85j5');
        Notification::assertSentTo($student, OrderRefundedNotification::class);
    }

    public function test_failed_gateway_refund_marks_the_order_as_pending(): void
    {
        Setting::setSecret('payment_zarinpal_merchant_id', 'merchant-test', 'payment');
        Setting::setSecret('payment_zarinpal_access_token', 'access-token', 'payment');
        Http::fake(['*' => Http::response(['errors' => ['code' => -9, 'message' => 'موجودی کافی نیست']], 400)]);

        [$coach, $student, $slot, $session, $order] = $this->paidBooking('zarinpal', 'A000000000000000000000000000fail');

        $this->actingAs($coach)->patch('/panel/coach/sessions/'.$session->id, ['status' => 'cancelled'])->assertRedirect();

        $this->assertSame('cancelled', $session->fresh()->status);
        $this->assertSame('refund_pending', $order->fresh()->status);
        $this->assertSame('refund_failed', $order->payments()->value('status'));
        $this->assertFalse((bool) $slot->fresh()->is_booked);
    }

    public function test_admin_can_retry_a_pending_gateway_refund(): void
    {
        Setting::setSecret('payment_zibal_merchant', 'zibal-test', 'payment');
        Http::fake(['gateway.zibal.ir/v1/refund' => Http::response(['result' => 100, 'refundId' => '42', 'message' => 'ok'])]);

        $admin = User::factory()->create()->assignRole('admin');
        $user = User::factory()->create();
        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'user_id' => $user->id,
            'status' => 'refund_pending',
            'subtotal' => 150000,
            'total' => 150000,
        ]);
        Payment::create([
            'order_id' => $order->id,
            'user_id' => $user->id,
            'gateway' => 'zibal',
            'transaction_id' => '998877',
            'amount' => 150000,
            'status' => 'refund_failed',
        ]);

        $this->actingAs($admin)->post('/admin/orders/'.$order->id.'/refund')->assertRedirect();

        $this->assertSame('refunded', $order->fresh()->status);
        $this->assertSame('refunded', $order->payments()->value('status'));
        Http::assertSent(fn ($request) => str_contains($request->url(), '/v1/refund') && (int) $request['trackId'] === 998877);
    }

    /**
     * @return array{0: User, 1: User, 2: CoachAvailability, 3: CoachingSession, 4: Order}
     */
    private function paidBooking(string $gateway, string $transactionId): array
    {
        $coach = User::factory()->create()->assignRole('coach');
        Coach::create(['user_id' => $coach->id, 'specialty' => 'رشد', 'hourly_rate' => 250000, 'is_available' => true]);
        $slot = CoachAvailability::create([
            'coach_id' => $coach->id,
            'available_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'is_booked' => false,
        ]);
        $student = User::factory()->create();
        $this->actingAs($student)->post('/coaching/book', ['availability_id' => $slot->id]);
        $session = CoachingSession::where('student_id', $student->id)->firstOrFail();
        $order = Order::where('user_id', $student->id)->firstOrFail();
        $order->update(['status' => 'paid', 'paid_at' => now(), 'reservation_expires_at' => null]);
        Payment::create([
            'order_id' => $order->id,
            'user_id' => $student->id,
            'gateway' => $gateway,
            'transaction_id' => $transactionId,
            'amount' => $order->total,
            'status' => 'success',
            'verified_at' => now(),
            'meta' => ['authority' => $transactionId],
        ]);

        return [$coach, $student, $slot->fresh(), $session, $order->fresh()];
    }
}
