<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\SupportConversation;
use App\Models\SupportMessage;
use App\Services\Chat\AiSupportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupportChatController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if (! $this->chatEnabled()) {
            return response()->json(['message' => 'پشتیبانی زنده فعال نیست.'], 404);
        }

        $token = (string) ($request->input('token') ?: Str::random(32));

        $conversation = SupportConversation::firstOrCreate(
            ['token' => $token],
            ['user_id' => $request->user()?->id, 'status' => 'open'],
        );

        // A logged-in visitor may open a chat before logging in; bind the account afterwards.
        if ($request->user() && ! $conversation->user_id) {
            $conversation->update(['user_id' => $request->user()->id]);
        }

        return response()->json([
            'conversation' => [
                'id' => $conversation->id,
                'token' => $conversation->token,
                'status' => $conversation->status,
            ],
            'greeting' => (string) Setting::get('chat_greeting', ''),
        ]);
    }

    public function messages(Request $request, SupportConversation $conversation): JsonResponse
    {
        if (! $this->chatEnabled() || ! $this->owns($request, $conversation)) {
            abort(404);
        }

        $afterId = (int) $request->query('after_id', 0);

        $messages = $conversation->messages()
            ->where('id', '>', $afterId)
            ->limit(60)
            ->get(['id', 'sender', 'body', 'created_at'])
            ->map(fn (SupportMessage $message) => $this->present($message));

        return response()->json(['messages' => $messages]);
    }

    public function send(Request $request, SupportConversation $conversation): JsonResponse
    {
        if (! $this->chatEnabled() || ! $this->owns($request, $conversation)) {
            abort(404);
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $body = trim((string) $validated['body']);
        if ($body === '') {
            return response()->json(['message' => 'پیام خالی است.'], 422);
        }

        $userMessage = SupportMessage::create([
            'conversation_id' => $conversation->id,
            'sender' => 'user',
            'body' => $body,
        ]);
        $conversation->update(['status' => 'open', 'last_message_at' => now()]);

        // AI answer (if configured) is appended in the same request so the
        // widget can render it without waiting for the next poll.
        $ai = new AiSupportService;
        if ($ai->isConfigured()) {
            $history = $conversation->messages()
                ->where('sender', '!=', 'admin')
                ->latest('id')
                ->limit(24)
                ->get()
                ->reverse()
                ->map(fn (SupportMessage $message) => ['role' => $message->sender, 'body' => $message->body])
                ->values()
                ->all();

            $result = $ai->complete($history);

            if ($result['ok'] && $result['content']) {
                SupportMessage::create([
                    'conversation_id' => $conversation->id,
                    'sender' => 'ai',
                    'body' => $result['content'],
                ]);
                $conversation->update(['last_message_at' => now()]);
            }
        }

        $messages = $conversation->messages()
            ->where('id', '>=', $userMessage->id)
            ->get(['id', 'sender', 'body', 'created_at'])
            ->map(fn (SupportMessage $message) => $this->present($message));

        return response()->json(['messages' => $messages]);
    }

    private function chatEnabled(): bool
    {
        return in_array((string) Setting::get('chat_enabled', '1'), ['1', 'true'], true);
    }

    private function owns(Request $request, SupportConversation $conversation): bool
    {
        $token = (string) ($request->header('X-Chat-Token', '') ?: $request->query('token', ''));

        if ($token !== '' && hash_equals($conversation->token, $token)) {
            return true;
        }

        return $request->user() !== null && $conversation->user_id === $request->user()->id;
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
