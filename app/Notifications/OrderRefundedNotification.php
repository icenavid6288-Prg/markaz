<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OrderRefundedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Order $order,
        public string $detail = '',
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'بازگشت وجه سفارش',
            'message' => 'سفارش '.$this->order->order_number.' مسترد شد.'.($this->detail !== '' ? ' '.$this->detail : ''),
            'url' => route('dashboard.orders'),
            'order_id' => $this->order->id,
        ];
    }
}
