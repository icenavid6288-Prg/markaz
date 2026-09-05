<?php

namespace App\Http\Controllers;

use App\Models\Eitaa\EitaaBot;
use App\Models\Eitaa\EitaaInboundEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Reserved inbound endpoint for the Eitaa bot module.
 *
 * As of today the official EitaaYar API documents no way to receive updates
 * (no webhook registration, no getUpdates). This endpoint is deployed and
 * secured now so that the day Eitaa ships an official receive API the module
 * can begin ingesting events with zero architectural change. Until then it
 * deliberately answers 501 — no flow is faked.
 */
class EitaaWebhookController extends Controller
{
    public function receive(Request $request, string $bot): JsonResponse
    {
        $botModel = EitaaBot::query()->where('bot_id', $bot)->orWhere('username', ltrim($bot, '@'))->first();
        if (! $botModel) {
            return response()->json(['ok' => false, 'error' => 'unknown_bot'], 404);
        }

        $payload = $request->all();
        $updateId = (string) ($payload['update_id'] ?? $payload['message']['message_id'] ?? '');

        if ($updateId === '') {
            return response()->json(['ok' => false, 'error' => 'missing_update_id'], 422);
        }

        // Idempotency: unique index on external_update_id makes re-delivery a no-op.
        try {
            $event = DB::transaction(function () use ($botModel, $updateId, $payload): EitaaInboundEvent {
                return EitaaInboundEvent::firstOrCreate(
                    ['bot_id' => $botModel->id, 'external_update_id' => $updateId],
                    ['object' => (string) ($payload['object'] ?? 'eitaa'), 'payload' => $payload],
                );
            });
        } catch (Throwable) {
            return response()->json(['ok' => true, 'status' => 'duplicate_ignored']);
        }

        if (! $event->wasRecentlyCreated) {
            return response()->json(['ok' => true, 'status' => 'duplicate_ignored']);
        }

        // No official parser exists yet: keep the raw event and answer 501 so
        // Meta-style retry semantics don't silently drop data.
        return response()->json([
            'ok' => true,
            'status' => 'stored',
            'note' => 'دریافت پیام ورودی هنوز توسط API رسمی ایتا پشتیبانی نمی‌شود؛ رویداد ذخیره شد.',
        ], 501);
    }
}
