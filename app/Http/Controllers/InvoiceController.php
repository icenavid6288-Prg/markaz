<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __invoke(Request $request, Order $order): Response
    {
        abort_unless($order->user_id === $request->user()->id, 403);
        abort_unless($order->status === 'paid', 404);
        $order->load('items');

        return Inertia::render('Dashboard/Invoice', [
            'order' => [
                'order_number' => $order->order_number,
                'status' => $order->status,
                'subtotal' => $order->subtotal,
                'discount' => $order->discount,
                'total' => $order->total,
                'paid_at' => $order->paid_at?->toISOString(),
                'billing' => $order->billing,
                'items' => $order->items->map(fn ($item) => ['title' => $item->title, 'quantity' => $item->quantity, 'unit_price' => $item->unit_price, 'total' => $item->total])->values(),
            ],
        ]);
    }
}
