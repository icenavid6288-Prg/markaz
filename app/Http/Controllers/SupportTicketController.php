<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use App\Notifications\NewTicketMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $tickets = Ticket::query()
            ->withCount(['messages'])
            ->where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Ticket $ticket) => [
                'id' => $ticket->id,
                'subject' => $ticket->subject,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
                'messages_count' => (int) $ticket->messages_count,
                'created_at' => $ticket->created_at?->toISOString(),
                'updated_at' => $ticket->updated_at?->toISOString(),
            ]);

        return Inertia::render('Support/Index', [
            'tickets' => $tickets,
            'stats' => [
                'open' => Ticket::where('user_id', $user->id)->where('status', 'open')->count(),
                'answered' => Ticket::where('user_id', $user->id)->where('status', 'answered')->count(),
                'closed' => Ticket::where('user_id', $user->id)->where('status', 'closed')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:4000'],
            'priority' => ['required', 'in:low,medium,high'],
        ]);

        $ticket = Ticket::create([
            'user_id' => $request->user()->id,
            'subject' => $validated['subject'],
            'body' => $validated['body'],
            'priority' => $validated['priority'],
            'status' => 'open',
        ]);

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        $this->notifyStaff($ticket, $request->user());

        return redirect()->route('dashboard.support.show', $ticket)
            ->with('success', 'تیکت شما ثبت شد؛ تیم پشتیبانی به‌زودی پاسخ می‌دهد.');
    }

    public function show(Request $request, Ticket $ticket): Response
    {
        abort_unless($ticket->user_id === $request->user()->id, 403);

        return Inertia::render('Support/Show', [
            'ticket' => [
                'id' => $ticket->id,
                'subject' => $ticket->subject,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
                'created_at' => $ticket->created_at?->toISOString(),
            ],
            'messages' => $ticket->messages()->with('user:id,name')->get()->map(fn (TicketMessage $message) => [
                'id' => $message->id,
                'body' => $message->body,
                'is_staff' => $message->user_id !== $request->user()->id,
                'author' => $message->user?->name,
                'created_at' => $message->created_at?->toISOString(),
            ]),
        ]);
    }

    public function reply(Request $request, Ticket $ticket): RedirectResponse
    {
        abort_unless($ticket->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
        ]);

        TicketMessage::create([
            'ticket_id' => $ticket->id,
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
        ]);

        $ticket->update(['status' => 'open']);

        $this->notifyStaff($ticket, $request->user());

        return back()->with('success', 'پاسخ شما ثبت شد.');
    }

    private function notifyStaff(Ticket $ticket, User $author): void
    {
        $staff = User::query()
            ->where('id', '!=', $author->id)
            ->whereHas('roles', fn ($query) => $query->whereIn('name', ['super-admin', 'admin', 'editor']))
            ->get();

        foreach ($staff as $user) {
            $user->notify(new NewTicketMessage($ticket, $author, false));
        }
    }
}
