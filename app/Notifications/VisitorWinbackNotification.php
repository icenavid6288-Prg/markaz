<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VisitorWinbackNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $message,
    ) {
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'چرا دوباره به ما سر نزدید؟',
            'message' => $this->message,
            'url' => '/contact',
            'type' => 'winback',
        ];
    }
}
