<?php

namespace App\Notifications;

use App\Models\SupportConversation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewChatReply extends Notification
{
    use Queueable;

    public function __construct(
        public SupportConversation $conversation,
        public string $body,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'پاسخ جدید پشتیبانی زنده',
            'message' => 'کارشناس پشتیبانی به گفتگوی زنده شما پاسخ داد: «'.mb_substr($this->body, 0, 60).'»',
            'url' => route('home'),
        ];
    }
}
