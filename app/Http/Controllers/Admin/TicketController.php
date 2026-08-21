<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Notifications\NewTicketMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    /**
     * Show the ticket conversation thread so staff can read and answer it.
     */
    public function show(Request $request, Ticket $ticket): Response
    {
        $this->authorizeTickets($request);

        return Inertia::render('Admin/TicketShow', [
            'ticket' => [
                'id' => $ticket->id,
                'subject' => $ticket->subject,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
                'user' => $ticket->user?->name ?? 'کاربر حذف‌شده',
                'created_at' => $ticket->created_at?->toISOString(),
            ],
            'messages' => $ticket->messages()->with('user:id,name')->get()->map(fn (TicketMessage $message) => [
                'id' => $message->id,
                'body' => $message->body,
                'is_staff' => $message->user_id !== $ticket->user_id,
                'author' => $message->user?->name,
                'created_at' => $message->created_at?->toISOString(),
            ]),
        ]);
    }

    /**
     * Post a staff reply and notify the ticket owner.
     */
    public function reply(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorizeTickets($request);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
        ]);

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        $ticket->update(['status' => 'answered']);

        if ($ticket->user && $ticket->user->id !== $request->user()->id) {
            $ticket->user->notify(new NewTicketMessage($ticket, $request->user(), true));
        }

        return back()->with('success', 'پاسخ شما برای کاربر ارسال شد.');
    }

    private function authorizeTickets(Request $request): void
    {
        abort_unless(
            $request->user()?->can('manage all') || $request->user()?->can('view tickets'),
            403,
        );
    }
}
