<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoachingSession;
use App\Models\Order;
use App\Services\Commerce\OrderRefund;
use App\Services\Commerce\SessionCancellation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OrderRefundController extends Controller
{
    public function store(Request $request, Order $order, OrderRefund $refunds): RedirectResponse
    {
        abort_unless($request->user()?->can('manage all') || $request->user()?->can('update orders'), 403);

        $result = $refunds->refund($order, 'admin');

        foreach ($order->items()->where('purchasable_type', CoachingSession::class)->get() as $item) {
            $session = CoachingSession::query()->find($item->purchasable_id);
            if ($session && $session->status !== 'cancelled') {
                app(SessionCancellation::class)->cancel($session, 'admin_order_refund');
            }
        }

        return back()->with($result['refunded'] ? 'success' : 'error', $result['message']);
    }
}
