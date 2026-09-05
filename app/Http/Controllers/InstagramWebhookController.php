<?php

namespace App\Http\Controllers;

use App\Models\InstagramWebhookEvent;
use App\Services\Instagram\InstagramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InstagramWebhookController extends Controller
{
    public function verify(Request $request, InstagramService $instagram)
    {
        if ($request->query('hub.mode') !== 'subscribe' || $request->query('hub.verify_token') !== $instagram->verifyToken()) {
            return response('توکن تأیید نامعتبر است.', 403);
        }

        return response((string) $request->query('hub.challenge', ''), 200)
            ->header('Content-Type', 'text/plain');
    }

    public function receive(Request $request, InstagramService $instagram): JsonResponse
    {
        $raw = $request->getContent();
        if (! $this->validSignature($request, $raw, $instagram->webhookSecret())) {
            return response()->json(['message' => 'امضای وب‌هوک نامعتبر است.'], 403);
        }

        $payload = $request->json()->all();
        // Meta may reuse an object ID across different callbacks; the raw payload
        // hash gives retries the same key without dropping later events.
        $externalId = hash('sha256', $raw);
        $event = InstagramWebhookEvent::firstOrCreate(
            ['external_id' => $externalId],
            ['object' => $payload['object'] ?? null, 'payload' => $payload],
        );

        if ($event->processed_at) {
            return response()->json(['ok' => true, 'duplicate' => true]);
        }

        try {
            foreach ($instagram->ingestMany($payload) as $result) {
                if ($this->autoReplyEnabled($instagram, $result['message']->message_type)) {
                    $template = $result['message']->message_type === 'comment'
                        ? (string) \App\Models\Setting::get('instagram_comment_auto_reply', '')
                        : (string) \App\Models\Setting::get('instagram_dm_auto_reply', '');
                    if (trim($template) !== '') {
                        $private = $result['message']->message_type === 'comment'
                            && in_array((string) \App\Models\Setting::get('instagram_private_reply_enabled', '0'), ['1', 'true'], true);
                        $private ? $instagram->replyPrivately($result['message'], $template) : $instagram->reply($result['message'], $template);
                    }
                }
                $instagram->runAutomations($result);
            }
            $event->update(['processed_at' => now(), 'error' => null]);
        } catch (\Throwable $exception) {
            $event->update(['error' => $exception->getMessage()]);
            Log::error('Instagram webhook processing failed.', ['event_id' => $externalId, 'exception' => $exception]);

            return response()->json(['message' => 'وب‌هوک دریافت شد اما پردازش آن ناموفق بود.'], 500);
        }

        return response()->json(['ok' => true]);
    }

    private function validSignature(Request $request, string $raw, string $secret): bool
    {
        if ($secret === '') {
            return false;
        }
        $provided = (string) $request->header('X-Hub-Signature-256');
        if (! str_starts_with($provided, 'sha256=')) {
            return false;
        }

        return hash_equals('sha256='.hash_hmac('sha256', $raw, $secret), $provided);
    }

    private function autoReplyEnabled(InstagramService $instagram, string $type): bool
    {
        return $instagram->isConfigured()
            && in_array((string) \App\Models\Setting::get('instagram_auto_reply_enabled', '0'), ['1', 'true'], true)
            && in_array((string) \App\Models\Setting::get('instagram_'.$type.'_auto_reply_enabled', '0'), ['1', 'true'], true);
    }
}
