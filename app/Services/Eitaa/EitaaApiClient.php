<?php

namespace App\Services\Eitaa;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Thin transport layer for the official EitaaYar API (https://eitaayar.ir).
 *
 * How "bots" actually work in Eitaa — there is NO @BotFather:
 *  1. Register at eitaayar.ir (official service, built by Eitaa's own team) and
 *     copy the API token from the panel.
 *  2. Add the EitaaYar program user **@sender** as an ADMIN (مدیر) of every
 *     channel/group you want to post into, granting at least the "ارسال پیام"
 *     permission. Without this every sendMessage fails with a permission error.
 *  3. Find the chat_id of the channel/group (numeric id, or @username without
 *     the @) in the EitaaYar panel, or the group's invite-link id.
 *
 * Documented surface (eitaayar.ir API guide + developer.eitaa.com):
 *   GET/POST https://eitaayar.ir/api/{TOKEN}/{METHOD}
 *   - getMe        : sanity-check the token.
 *   - sendMessage  : text posts (chat_id, text, title, pin, disable_notification,
 *                    reply_to_message_id, date, viewCountForDelete).
 *   - sendDocument : file uploads (chat_id, caption, file) — the guide names the
 *                    file method sendDocument; "sendFile" is accepted as an alias
 *                    by the service, but we follow the documented name.
 *   Responses are JSON with a boolean top-level "ok" (plus "result" / "description").
 *   Parameters may be sent as query string, JSON, form-data or multipart.
 *
 * The API is outbound-only: there is no documented way to receive updates
 * (no webhook / getUpdates) and no way to message a private user who has not
 * started a conversation with your program (developer.eitaa.com: the user must
 * grant access via the "Start" button). This client implements nothing beyond
 * the documented surface — no unofficial endpoints, no client emulation.
 */
class EitaaApiClient
{
    private const BASE_URL = 'https://eitaayar.ir/api';

    /** Human-readable label for each error category used across the module. */
    public const ERROR_CATEGORIES = [
        'auth' => 'خطای احراز هویت (توکن نامعتبر)',
        'rate_limit' => 'محدودیت نرخ ارسال',
        'network' => 'خطای شبکه',
        'invalid' => 'درخواست نامعتبر',
        'user_unavailable' => 'مقصد در دسترس نیست',
        'permission' => 'عدم دسترسی (ربات @sender ادمین مقصد نیست)',
        'unknown' => 'خطای ناشناخته',
    ];

    /**
     * @return array{ok: bool, data: array<string, mixed>, error: ?string, category: ?string}
     */
    public function getMe(string $token): array
    {
        return $this->call($token, 'getMe');
    }

    /**
     * Sends a text message to a channel/group the bot manages.
     *
     * @param  array{title?: string, disable_notification?: bool, reply_to_message_id?: string|int, date?: int, pin?: bool, view_count_for_delete?: int}  $options
     * @return array{ok: bool, message_id: ?string, error: ?string, category: ?string}
     */
    public function sendMessage(string $token, string|int $chatId, string $text, array $options = []): array
    {
        $payload = array_filter([
            'chat_id' => (string) $chatId,
            'text' => $text,
            'title' => $options['title'] ?? null,
            'disable_notification' => isset($options['disable_notification']) && $options['disable_notification'] ? 'true' : null,
            'reply_to_message_id' => $options['reply_to_message_id'] ?? null,
            // Official scheduling: deliver at a future Unix timestamp.
            'date' => $options['date'] ?? null,
            'pin' => isset($options['pin']) && $options['pin'] ? '1' : null,
            'viewCountForDelete' => $options['view_count_for_delete'] ?? null,
        ], static fn ($value) => $value !== null && $value !== '');

        $result = $this->call($token, 'sendMessage', $payload);

        return [
            'ok' => $result['ok'],
            // Some responses carry result.message_id, others just result:"success".
            'message_id' => $result['ok'] ? (string) ($result['data']['result']['message_id'] ?? ($result['data']['result'] ?? '')) : null,
            'error' => $result['error'],
            'category' => $result['category'],
        ];
    }

    /**
     * Uploads a local file (gif/mp4/webp/png/pdf...) with an optional caption.
     * The documented method name is sendDocument (see also: sendFile alias).
     *
     * @return array{ok: bool, message_id: ?string, error: ?string, category: ?string}
     */
    public function sendFile(string $token, string|int $chatId, string $absolutePath, string $caption = ''): array
    {
        if (! is_file($absolutePath)) {
            return ['ok' => false, 'message_id' => null, 'error' => 'فایل برای ارسال پیدا نشد.', 'category' => 'invalid'];
        }

        try {
            $response = $this->request($token)
                ->attach('file', fopen($absolutePath, 'r'), basename($absolutePath))
                ->post($this->endpoint($token, 'sendDocument'), array_filter([
                    'chat_id' => (string) $chatId,
                    'caption' => $caption,
                ], static fn ($value) => $value !== null && $value !== ''));
        } catch (Throwable $exception) {
            return ['ok' => false, 'message_id' => null, 'error' => $exception->getMessage(), 'category' => 'network'];
        }

        return $this->interpret($response);
    }

    /** @return array{ok: bool, data: array<string, mixed>, error: ?string, category: ?string} */
    private function call(string $token, string $method, array $payload = []): array
    {
        try {
            $response = $payload === []
                ? $this->request($token)->get($this->endpoint($token, $method))
                : $this->request($token)->asForm()->post($this->endpoint($token, $method), $payload);
        } catch (Throwable $exception) {
            return ['ok' => false, 'data' => [], 'error' => $exception->getMessage(), 'category' => 'network'];
        }

        return $this->interpret($response);
    }

    private function request(string $token): PendingRequest
    {
        return Http::timeout(20)->connectTimeout(10)->acceptJson();
    }

    private function endpoint(string $token, string $method): string
    {
        return self::BASE_URL.'/'.rawurlencode($token).'/'.rawurlencode($method);
    }

    /** @return array{ok: bool, data: array<string, mixed>, error: ?string, category: ?string} */
    private function interpret(\Illuminate\Http\Client\Response $response): array
    {
        $payload = $response->json();
        $payload = is_array($payload) ? $payload : [];
        $ok = ($payload['ok'] ?? false) === true && ! $response->failed();

        if ($ok) {
            return ['ok' => true, 'data' => $payload, 'error' => null, 'category' => null];
        }

        $description = (string) ($payload['description'] ?? $payload['error'] ?? ('HTTP '.$response->status()));

        return [
            'ok' => false,
            'data' => $payload,
            'error' => $description,
            'category' => $this->categorize($description, $response->status()),
        ];
    }

    /** Maps API/network failures to the module-wide error taxonomy. */
    private function categorize(string $description, int $status): string
    {
        return match (true) {
            $status === 401 || $status === 403 || str_contains($description, 'token') || str_contains($description, 'unauthorized') => 'auth',
            $status === 429 || str_contains($description, 'rate') || str_contains($description, 'flood') => 'rate_limit',
            in_array($status, [400, 404, 422], true) || str_contains($description, 'chat not found') => str_contains($description, 'chat') ? 'user_unavailable' : 'invalid',
            $status >= 500 => 'network',
            str_contains($description, 'admin') || str_contains($description, 'permission') => 'permission',
            default => 'unknown',
        };
    }
}
