<?php

namespace App\Services\Instagram;

use App\Models\InstagramAccount;
use App\Models\InstagramConversation;
use App\Models\InstagramMessage;
use App\Models\Lead;
use App\Models\Setting;
use App\Services\Crm\LeadService;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class InstagramService
{
    private const DEFAULT_GRAPH_VERSION = 'v25.0';

    public function isConfigured(): bool
    {
        return $this->enabled() && filled($this->token()) && filled($this->accountId());
    }

    /** @return array<string, mixed> */
    public function health(): array
    {
        $account = InstagramAccount::query()->latest('last_connected_at')->first();
        $token = $account?->access_token ?: $this->token();
        $accountId = $account?->instagram_user_id ?: $this->accountId();

        return [
            'configured' => $this->enabled() && filled($token) && filled($accountId),
            'enabled' => $this->enabled(),
            'account' => $account ? [
                'id' => $account->instagram_user_id,
                'username' => $account->username,
                'profile_picture_url' => $account->profile_picture_url,
                'status' => $account->status,
                'token_expires_at' => $account->token_expires_at?->toISOString(),
                'scopes' => $account->scopes ?? [],
                'last_sync_at' => $account->last_sync_at?->toISOString(),
                'last_error' => $account->last_error,
            ] : null,
            'webhook_url' => (string) Setting::get('instagram_webhook_url', url('/api/instagram/webhook')),
            'graph_version' => $this->graphVersion(),
        ];
    }

    /** @return array{ok: bool, message: string, account?: array<string, mixed>} */
    public function testConnection(): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'message' => 'اکانت، توکن یا گزینه فعال‌سازی کامل نشده است.'];
        }

        $response = $this->graph()->get($this->accountId(), [
            'fields' => 'id,username,name,profile_picture_url,followers_count,media_count',
        ]);
        if ($response->failed()) {
            InstagramAccount::query()->where('instagram_user_id', $this->accountId())->update([
                'status' => 'error',
                'last_error' => (string) ($response->json('error.message') ?: 'خطای ناشناخته Meta'),
            ]);

            return ['ok' => false, 'message' => (string) ($response->json('error.message') ?: 'بررسی اتصال Meta ناموفق بود.')];
        }

        $data = (array) $response->json();
        InstagramAccount::query()->where('instagram_user_id', $this->accountId())->update([
            'status' => 'connected',
            'last_sync_at' => now(),
            'last_error' => null,
            'username' => $data['username'] ?? null,
            'profile_picture_url' => $data['profile_picture_url'] ?? null,
            'metadata' => $data,
        ]);

        return ['ok' => true, 'message' => 'اتصال Meta برقرار است و اطلاعات اکانت دریافت شد.', 'account' => $data];
    }

    public function graphVersion(): string
    {
        return trim((string) Setting::get('instagram_api_version', self::DEFAULT_GRAPH_VERSION), ' /');
    }

    public function loginMode(): string
    {
        return (string) Setting::get('instagram_login_mode', 'instagram_login');
    }

    public function connectWithAuthorizationCode(string $code, string $redirectUri): InstagramAccount
    {
        if ($code === '') {
            throw new RuntimeException('کد اتصال اینستاگرام دریافت نشد.');
        }

        $appId = (string) Setting::get('instagram_app_id', '');
        $appSecret = (string) Setting::getSecret('instagram_app_secret', '');
        if ($appId === '' || $appSecret === '') {
            throw new RuntimeException('App ID و App Secret اینستاگرام کامل نشده است.');
        }

        $short = Http::asForm()->timeout(15)->post('https://api.instagram.com/oauth/access_token', [
            'client_id' => $appId,
            'client_secret' => $appSecret,
            'grant_type' => 'authorization_code',
            'redirect_uri' => $redirectUri,
            'code' => $code,
        ]);
        if ($short->failed()) {
            throw new RuntimeException((string) ($short->json('error_message') ?: 'دریافت توکن اینستاگرام ناموفق بود.'));
        }

        $shortToken = (string) $short->json('access_token');
        $shortUserId = (string) $short->json('user_id');
        $long = Http::timeout(15)->get('https://graph.instagram.com/access_token', [
            'grant_type' => 'ig_exchange_token',
            'client_secret' => $appSecret,
            'access_token' => $shortToken,
        ]);
        $token = $long->successful() ? (string) $long->json('access_token') : $shortToken;
        $expiresAt = $long->successful() && $long->json('expires_in') ? now()->addSeconds((int) $long->json('expires_in')) : now()->addHour();

        $profile = Http::withToken($token)->timeout(15)->get('https://graph.instagram.com/'.($shortUserId ?: 'me'), [
            'fields' => 'id,username,profile_picture_url',
        ]);
        if ($profile->failed()) {
            throw new RuntimeException((string) ($profile->json('error.message') ?: 'دریافت اطلاعات اکانت اینستاگرام ناموفق بود.'));
        }

        $account = InstagramAccount::updateOrCreate(
            ['instagram_user_id' => (string) ($profile->json('id') ?: $shortUserId)],
            [
                'name' => 'اکانت اصلی اینستاگرام',
                'username' => $profile->json('username'),
                'profile_picture_url' => $profile->json('profile_picture_url'),
                'access_token' => $token,
                'token_expires_at' => $expiresAt,
                'scopes' => ['instagram_business_basic', 'instagram_business_manage_messages', 'instagram_business_manage_comments', 'instagram_business_content_publish'],
                'status' => 'connected',
                'last_connected_at' => now(),
                'last_error' => null,
            ],
        );

        Setting::set('instagram_business_account_id', $account->instagram_user_id, 'instagram');
        Setting::setSecret('instagram_access_token', $token, 'instagram');
        Setting::set('instagram_enabled', '1', 'instagram');

        return $account;
    }

    /** @return array{ok: bool, message: string} */
    public function refreshToken(): array
    {
        $account = InstagramAccount::query()->latest('last_connected_at')->first();
        $token = $account?->access_token ?: $this->token();
        if (! $token) {
            return ['ok' => false, 'message' => 'توکن اینستاگرام برای به‌روزرسانی پیدا نشد.'];
        }

        $response = Http::timeout(15)->get('https://graph.instagram.com/refresh_access_token', [
            'grant_type' => 'ig_refresh_token',
            'access_token' => $token,
        ]);
        if ($response->failed() || ! $response->json('access_token')) {
            return ['ok' => false, 'message' => (string) ($response->json('error.message') ?: 'به‌روزرسانی توکن اینستاگرام ناموفق بود.')];
        }

        $newToken = (string) $response->json('access_token');
        $expiresAt = $response->json('expires_in') ? now()->addSeconds((int) $response->json('expires_in')) : null;
        if ($account) {
            $account->update(['access_token' => $newToken, 'token_expires_at' => $expiresAt, 'status' => 'connected', 'last_error' => null]);
        }
        Setting::setSecret('instagram_access_token', $newToken, 'instagram');

        return ['ok' => true, 'message' => 'توکن اینستاگرام با موفقیت به‌روزرسانی شد.'];
    }

    /** @return array{ok: bool, message: string} */
    public function moderateComment(InstagramMessage $message, string $action): array
    {
        if ($message->message_type !== 'comment' || ! in_array($action, ['hide', 'unhide', 'delete'], true)) {
            return ['ok' => false, 'message' => 'عملیات مدیریت کامنت معتبر نیست.'];
        }
        if (! $this->isConfigured()) {
            return ['ok' => false, 'message' => 'اتصال اینستاگرام کامل نیست.'];
        }

        $response = $action === 'delete'
            ? $this->graph()->delete($message->external_id)
            : $this->graph()->post($message->external_id, ['hide' => $action === 'hide' ? 'true' : 'false']);
        if ($response->failed()) {
            return ['ok' => false, 'message' => (string) ($response->json('error.message') ?: 'مدیریت کامنت ناموفق بود.')];
        }

        if ($action === 'delete') {
            $message->update(['status' => 'deleted']);
        } else {
            $message->update(['payload' => array_merge((array) $message->payload, ['hidden' => $action === 'hide'])]);
        }

        return ['ok' => true, 'message' => $action === 'delete' ? 'کامنت حذف شد.' : ($action === 'hide' ? 'کامنت مخفی شد.' : 'کامنت دوباره نمایش داده شد.')];
    }

    public function disconnect(): void
    {
        InstagramAccount::query()->update(['status' => 'disconnected', 'access_token' => null]);
        Setting::set('instagram_enabled', '0', 'instagram');
    }

    public function enabled(): bool
    {
        return in_array((string) Setting::get('instagram_enabled', '0'), ['1', 'true'], true);
    }

    public function accountId(): ?string
    {
        $id = Setting::get('instagram_business_account_id');

        return filled($id) ? (string) $id : null;
    }

    public function token(): ?string
    {
        $token = Setting::getSecret('instagram_access_token');

        return filled($token) ? (string) $token : null;
    }

    public function verifyToken(): string
    {
        return (string) Setting::getSecret('instagram_webhook_verify_token', '');
    }

    public function webhookSecret(): string
    {
        return (string) Setting::getSecret('instagram_app_secret', '');
    }

    /** @return array<string, mixed> */
    public function replyPrivately(InstagramMessage $message, string $text): array
    {
        if ($message->message_type !== 'comment' || ! $this->isConfigured()) {
            throw new RuntimeException('پاسخ خصوصی فقط برای کامنت‌های اینستاگرام و اتصال فعال قابل استفاده است.');
        }

        $response = $this->graph()->post($message->external_id.'/private_replies', ['message' => $text]);
        if ($response->failed()) {
            throw new RuntimeException((string) ($response->json('error.message') ?: 'ارسال پاسخ خصوصی به اینستاگرام ناموفق بود.'));
        }

        $outbound = $message->conversation->messages()->create([
            'external_id' => (string) ($response->json('message_id') ?: Str::uuid()),
            'direction' => 'outbound',
            'message_type' => 'comment',
            'body' => $text,
            'external_parent_id' => $message->external_id,
            'status' => 'sent',
            'payload' => $response->json(),
            'sent_at' => now(),
        ]);
        $message->conversation->update(['last_message_at' => now(), 'last_outbound_at' => now()]);

        return ['message' => $outbound, 'response' => $response->json()];
    }

    /** @return array<string, mixed> */
    public function reply(InstagramMessage $message, string $text): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Instagram هنوز به‌صورت کامل پیکربندی نشده است.');
        }

        $recipient = $message->conversation->participant_id;
        $endpoint = $message->message_type === 'comment'
            ? $message->external_id.'/replies'
            : $this->accountId().'/messages';
        $payload = $message->message_type === 'comment'
            ? ['message' => $text]
            : ['recipient' => ['id' => $recipient], 'message' => ['text' => $text]];
        $response = $this->graph()->post($endpoint, $payload);

        if ($response->failed()) {
            throw new RuntimeException((string) ($response->json('error.message') ?: 'ارسال پاسخ به اینستاگرام ناموفق بود.'));
        }

        $externalId = (string) ($response->json('message_id') ?: Str::uuid());
        $outbound = $message->conversation->messages()->create([
            'external_id' => $externalId,
            'direction' => 'outbound',
            'message_type' => $message->message_type,
            'body' => $text,
            'external_parent_id' => $message->external_id,
            'status' => 'sent',
            'payload' => $response->json(),
            'sent_at' => now(),
        ]);
        $message->conversation->update(['last_message_at' => now(), 'last_outbound_at' => now()]);

        return ['message' => $outbound, 'response' => $response->json()];
    }

    /** @param array<string, mixed> $event @return array{conversation: InstagramConversation, message: InstagramMessage}|null */
    public function ingest(array $event): ?array
    {
        return $this->ingestMany($event)[0] ?? null;
    }

    /** @param array<string, mixed> $event @return list<array{conversation: InstagramConversation, message: InstagramMessage}> */
    public function ingestMany(array $event): array
    {
        $results = [];
        $entries = $event['entry'] ?? [$event];
        if (! is_array($entries) || (array_is_list($entries) === false)) {
            $entries = [$entries];
        }

        foreach ($entries as $entry) {
            if (! is_array($entry)) {
                continue;
            }
            foreach ((array) ($entry['messaging'] ?? []) as $messaging) {
                if (! is_array($messaging)) {
                    continue;
                }
                $sender = $messaging['sender']['id'] ?? null;
                $message = $messaging['message']['text'] ?? null;
                $externalId = $messaging['message']['mid'] ?? null;
                if ($sender && $message && $externalId) {
                    $results[] = $this->storeInbound((string) $sender, (string) $message, (string) $externalId, 'dm', null, $messaging);
                }
            }

            foreach ((array) ($entry['changes'] ?? []) as $change) {
                if (! is_array($change)) {
                    continue;
                }
                $value = (array) ($change['value'] ?? []);
                $commentId = $value['id'] ?? $value['comment_id'] ?? null;
                $text = $value['text'] ?? $value['message'] ?? null;
                $sender = $value['from']['id'] ?? $value['sender_id'] ?? null;
                if ($commentId && $text && $sender) {
                    $results[] = $this->storeInbound((string) $sender, (string) $text, (string) $commentId, 'comment', $value['media_id'] ?? null, $value);
                }
            }
        }

        return $results;
    }

    /** @param array{conversation: InstagramConversation, message: InstagramMessage} $result */
    public function runAutomations(array $result): void
    {
        $message = $result['message'];
        $conversation = $result['conversation'];
        $automations = \App\Models\InstagramAutomation::query()
            ->where('enabled', true)
            ->orderBy('priority')
            ->get();

        foreach ($automations as $automation) {
            $matchesType = match ($automation->trigger_type) {
                'comment_received' => $message->message_type === 'comment',
                'keyword' => true,
                default => $message->message_type === 'dm',
            };
            $keyword = trim((string) ($automation->conditions['keyword'] ?? ''));
            $matchesKeyword = $automation->trigger_type !== 'keyword'
                || ($keyword !== '' && mb_stripos((string) $message->body, $keyword) !== false);
            if (! $matchesType || ! $matchesKeyword) {
                continue;
            }

            $recent = \App\Models\InstagramAutomationRun::query()
                ->where('automation_id', $automation->id)
                ->where('conversation_id', $conversation->id)
                ->where('created_at', '>=', now()->subSeconds((int) $automation->cooldown_seconds))
                ->exists();
            if ($recent) {
                continue;
            }

            $run = $automation->runs()->create([
                'conversation_id' => $conversation->id,
                'message_id' => $message->id,
                'status' => 'running',
                'input' => ['body' => $message->body, 'type' => $message->message_type],
            ]);
            try {
                $text = trim((string) ($automation->actions[0]['text'] ?? ''));
                if ($text === '' || ! $this->isConfigured()) {
                    throw new RuntimeException($text === '' ? 'متن پاسخ اتوماسیون خالی است.' : 'اتصال اینستاگرام کامل نیست.');
                }
                $text = str_replace(['{name}', '{username}'], [$conversation->participant_username ?: 'مخاطب', $conversation->participant_username ?: 'مخاطب'], $text);
                $sent = $this->reply($message, $text);
                $run->update(['status' => 'completed', 'output' => ['message_id' => $sent['message']->id], 'executed_at' => now()]);
                $automation->update(['last_run_at' => now()]);
            } catch (\Throwable $exception) {
                $run->update(['status' => 'failed', 'error' => $exception->getMessage(), 'executed_at' => now()]);
                $automation->update(['last_run_at' => now()]);
            }
        }
    }

    /** @param array<string, mixed> $payload */
    private function storeInbound(string $participantId, string $body, string $externalId, string $type, ?string $parentId, array $payload): array
    {
        $conversationKey = $type === 'dm'
            ? 'dm:'.$participantId
            : 'comment:'.$externalId;
        $conversation = InstagramConversation::firstOrCreate(
            ['external_id' => $conversationKey],
            [
                'channel' => $type,
                'participant_id' => $participantId,
                'lead_id' => $this->leadFor($participantId, $payload['from']['username'] ?? $payload['sender']['username'] ?? null)->id,
                'instagram_account_id' => InstagramAccount::query()->latest('last_connected_at')->value('id'),
                'status' => 'open',
            ],
        );
        $message = InstagramMessage::firstOrCreate(
            ['external_id' => $externalId],
            [
                'conversation_id' => $conversation->id,
                'direction' => 'inbound',
                'message_type' => $type,
                'body' => $body,
                'external_parent_id' => $parentId,
                'status' => 'received',
                'payload' => $payload,
            ],
        );
        $conversation->update([
            'last_message_at' => now(),
            'last_inbound_at' => now(),
            'unread_count' => (int) $conversation->unread_count + 1,
            'participant_username' => $payload['from']['username'] ?? $payload['sender']['username'] ?? $conversation->participant_username,
        ]);

        return ['conversation' => $conversation, 'message' => $message];
    }

    private function leadFor(string $participantId, ?string $username = null): Lead
    {
        $lead = Lead::where('instagram_user_id', $participantId)->first();
        if ($lead) {
            if ($username && $lead->instagram_username !== $username) {
                $lead->update(['instagram_username' => $username]);
            }

            return $lead;
        }

        $lead = Lead::create([
            'name' => 'مخاطب اینستاگرام',
            'phone' => 'instagram:'.$participantId,
            'source' => 'instagram',
            'instagram_user_id' => $participantId,
            'instagram_username' => $username,
            'status' => 'new',
            'attribution' => ['channel' => 'instagram', 'first_seen_at' => now()->toISOString()],
            'last_activity_at' => now(),
        ]);
        app(LeadService::class)->record($lead, 'instagram', 'تعامل جدید از اینستاگرام');

        return $lead;
    }

    /**
     * Creates one or more media containers on Meta and publishes them.
     *
     * @param  list<string>  $urls  One URL publishes an IMAGE/VIDEO post; several publish a CAROUSEL.
     * @return array{media: \App\Models\InstagramMedia, response: array<string, mixed>}
     */
    public function publishPost(string $postType, array $urls, string $caption = ''): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Instagram هنوز به‌صورت کامل پیکربندی نشده است.');
        }

        $urls = array_values(array_filter($urls, fn (string $url) => trim($url) !== ''));
        if ($urls === []) {
            throw new RuntimeException('حداقل یک رسانه (تصویر یا ویدیو) برای انتشار لازم است.');
        }

        try {
            $childIds = [];
            if ($postType === 'CAROUSEL' && count($urls) > 1) {
                foreach ($urls as $url) {
                    $isVideo = (bool) preg_match('/\.(mp4|mov)(\?|$)/i', $url);
                    $child = $this->graph()->post($this->accountId().'/media', array_filter([
                        $isVideo ? 'video_url' : 'image_url' => $url,
                        'media_type' => $isVideo ? 'VIDEO' : null,
                    ]));
                    if ($child->failed()) {
                        throw new RuntimeException((string) ($child->json('error.message') ?: 'ساخت آیتم کاروسل ناموفق بود.'));
                    }
                    $childIds[] = (string) $child->json('id');
                }
                $container = $this->graph()->post($this->accountId().'/media', array_filter([
                    'media_type' => 'CAROUSEL',
                    'children' => implode(',', $childIds),
                    'caption' => $caption,
                ]));
            } else {
                $postType = count($urls) > 1 ? 'CAROUSEL' : $postType;
                $isVideo = $postType === 'VIDEO' || (bool) preg_match('/\.(mp4|mov)(\?|$)/i', $urls[0]);
                $container = $this->graph()->post($this->accountId().'/media', array_filter([
                    $isVideo ? 'video_url' : 'image_url' => $urls[0],
                    'media_type' => $isVideo ? 'VIDEO' : null,
                    'caption' => $caption,
                ]));
            }
            if ($container->failed()) {
                throw new RuntimeException((string) ($container->json('error.message') ?: 'ساخت محفظه انتشار اینستاگرام ناموفق بود.'));
            }

            $creationId = (string) $container->json('id');
            $publish = $this->graph()->post($this->accountId().'/media_publish', ['creation_id' => $creationId]);
            if ($publish->failed()) {
                throw new RuntimeException((string) ($publish->json('error.message') ?: 'انتشار در اینستاگرام ناموفق بود. اگر ویدیو است چند لحظه بعد دوباره تلاش کنید.'));
            }

            $externalId = (string) ($publish->json('id') ?: $creationId);
            $media = \App\Models\InstagramMedia::updateOrCreate(
                ['external_id' => $externalId],
                [
                    'post_type' => $postType === 'VIDEO' ? 'VIDEO' : ($postType === 'CAROUSEL' || count($urls) > 1 ? 'CAROUSEL' : 'IMAGE'),
                    'media_type' => $postType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
                    'caption' => $caption,
                    'media_url' => $urls[0],
                    'published_at' => now(),
                    'status' => 'published',
                    'error' => null,
                    'metadata' => ['container_id' => $creationId, 'child_ids' => $childIds, 'response' => $publish->json()],
                ],
            );
            $this->hydratePermalink($media);

            return ['media' => $media, 'response' => $publish->json()];
        } catch (\Throwable $exception) {
            \App\Models\InstagramMedia::create([
                'external_id' => 'failed:'.Str::uuid(),
                'post_type' => $postType,
                'media_type' => $postType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
                'caption' => $caption,
                'media_url' => $urls[0] ?? null,
                'status' => 'failed',
                'error' => $exception->getMessage(),
                'metadata' => ['urls' => $urls],
            ]);

            throw $exception;
        }
    }

    /** Keeps the public post type; legacy callers use publishImage. */
    public function publishImage(string $imageUrl, string $caption = ''): array
    {
        return $this->publishPost('IMAGE', [$imageUrl], $caption);
    }

    /** Fetches and stores the public permalink of a published post (best effort). */
    public function hydratePermalink(\App\Models\InstagramMedia $media): void
    {
        if (! $this->isConfigured() || str_starts_with((string) $media->external_id, 'failed:')) {
            return;
        }

        try {
            $response = $this->graph()->get($media->external_id, ['fields' => 'permalink,media_url,thumbnail_url']);
            if (! $response->failed()) {
                $media->update(array_filter([
                    'permalink' => $response->json('permalink'),
                    'media_url' => $response->json('thumbnail_url') ?: $response->json('media_url') ?: $media->media_url,
                ]));
            }
        } catch (\Throwable) {
            // Permalink refresh is cosmetic; never break publishing over it.
        }
    }

    /** @return list<\App\Models\InstagramMedia> */
    public function publishDueScheduled(int $limit = 5): array
    {
        $due = \App\Models\InstagramMedia::query()
            ->where('status', 'scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->orderBy('scheduled_at')
            ->limit($limit)
            ->get();

        foreach ($due as $media) {
            $urls = (array) ($media->metadata['urls'] ?? []);
            if ($urls === [] && $media->media_url) {
                $urls = [(string) $media->media_url];
            }
            try {
                $this->publishPost((string) $media->post_type, array_map('strval', $urls), (string) ($media->caption ?? ''));
                $media->update(['status' => 'published', 'published_at' => now(), 'error' => null]);
            } catch (Throwable $exception) {
                $media->update(['status' => 'failed', 'error' => $exception->getMessage()]);
            }
        }

        return $due->all();
    }

    private function graph(): PendingRequest
    {
        $host = $this->loginMode() === 'facebook_login' ? 'https://graph.facebook.com/' : 'https://graph.instagram.com/';

        return Http::baseUrl($host.$this->graphVersion().'/')
            ->withToken((string) $this->token())
            ->acceptJson()
            ->timeout(15);
    }
}
