<?php

namespace App\Services\Payments;

use App\Models\Order;
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
}
