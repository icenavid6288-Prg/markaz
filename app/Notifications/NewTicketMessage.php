<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewTicketMessage extends Notification
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
        public User $author,
        public bool $fromStaff = false,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $role = $this->fromStaff ? 'پشتیبانی' : ($this->author->name ?: 'کاربر');
        $verb = $this->fromStaff ? 'پاسخی به تیکت شما ثبت شد' : 'تیکت جدیدی ثبت شد';

        return [
            'title' => $this->fromStaff ? 'پاسخ جدید پشتیبانی' : 'تیکت جدید پشتیبانی',
            'message' => "{$verb}: «{$this->ticket->subject}» ({$role})",
            'url' => $this->fromStaff
                ? route('dashboard.support.show', $this->ticket)
                : route('admin.content.tickets.show', $this->ticket),
            'ticket_id' => $this->ticket->id,
        ];
    }
}
