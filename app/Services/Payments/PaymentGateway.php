<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;

interface PaymentGateway
{
    /** @return array{gateway:string, payment_url:string, authority?:string, transaction_id?:string} */
    public function create(Order $order): array;

    /** @return array{success:bool, reference_id?:string, transaction_id?:string, message?:string} */
    public function verify(Order $order, Request $request): array;

    /**
     * Verify connectivity with the payment provider WITHOUT creating or charging a transaction.
     *
     * @return array{ok: bool, message: string}
     */
    public function checkConnection(): array;

    /**
     * Return money for a captured payment. Implementations must never throw for a
     * business failure — they return ok=false so the ledger can stay consistent.
     *
     * @return array{ok:bool, channel:string, message:string, reference?:string}
     */
    public function refund(Payment $payment, string $reason = 'refund'): array;
}
