<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportConversation;
use App\Models\SupportMessage;
use App\Notifications\NewChatReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupportChatController extends Controller
{
    public function index(): Response
    {
        $conversations = SupportConversation::query()
            ->with('user:id,name,phone')
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn (SupportConversation $conversation) => [
                'id' => $conversation->id,
                'status' => $conversation->status,
                'user' => $conversation->user
                    ? ['name' => $conversation->user->name, 'phone' => $conversation->user->phone]
                    : null,
                'message_count' => $conversation->messages_count,
                'last_message_at' => $conversation->last_message_at?->toISOString(),
                'last_message' => $conversation->messages()->latest('id')->value('body'),
            ]);

        return Inertia::render('Admin/SupportChat', ['conversations' => $conversations]);
    }

    public function messages(Request $request, SupportConversation $conversation): JsonResponse
    {
        $afterId = (int) $request->query('after_id', 0);

        $messages = $conversation->messages()
            ->where('id', '>', $afterId)
            ->limit(100)
            ->get(['id', 'sender', 'body', 'created_at'])
            ->map(fn (SupportMessage $message) => $this->present($message));

        return response()->json(['messages' => $messages]);
    }

    public function reply(Request $request, SupportConversation $conversation): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $body = trim((string) $validated['body']);
        if ($body === '') {
            return response()->json(['message' => 'پیام خالی است.'], 422);
        }

        $message = SupportMessage::create([
            'conversation_id' => $conversation->id,
            'sender' => 'admin',
            'body' => $body,
        ]);
        $conversation->update(['status' => 'open', 'last_message_at' => now()]);

        if ($conversation->user_id) {
            $conversation->user?->notify(new NewChatReply($conversation, $body));
        }

        return response()->json(['message' => $this->present($message)]);
    }

    private function present(SupportMessage $message): array
    {
        return [
            'id' => $message->id,
            'sender' => $message->sender,
            'body' => $message->body,
            'created_at' => $message->created_at?->toISOString(),
        ];
    }
}
