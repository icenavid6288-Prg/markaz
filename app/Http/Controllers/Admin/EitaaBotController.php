<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Eitaa\EitaaAiSetting;
use App\Models\Eitaa\EitaaBot;
use App\Models\Eitaa\EitaaCampaign;
use App\Models\Eitaa\EitaaCampaignTarget;
use App\Models\Eitaa\EitaaConversation;
use App\Models\Eitaa\EitaaKeyword;
use App\Models\Eitaa\EitaaLog;
use App\Models\Eitaa\EitaaMessage;
use App\Models\Eitaa\EitaaNotification;
use App\Models\Eitaa\EitaaTarget;
use App\Models\Eitaa\EitaaTemplate;
use App\Services\Eitaa\EitaaBotService;
use App\Services\Eitaa\EitaaDraftingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class EitaaBotController extends Controller
{
    // ------------------------------------------------------------ dashboard

    public function dashboard(Request $request): Response
    {
        $range = (int) $request->query('range', '7');
        $since = match ($range) { 1 => now()->startOfDay(), 30 => now()->subDays(30), default => now()->subDays(7) };

        $bot = EitaaBot::query()->orderByDesc('is_active')->orderBy('id')->first();
        $messageQuery = EitaaMessage::query()->where('created_at', '>=', $since);

        return Inertia::render('Admin/Eitaa/Dashboard', [
            'bot' => $bot ? $this->presentBot($bot) : null,
            'stats' => [
                'bots' => EitaaBot::count(),
                'targets' => EitaaTarget::where('status', 'active')->count(),
                'messages_out' => (clone $messageQuery)->where('direction', 'out')->count(),
                'messages_in' => (clone $messageQuery)->where('direction', 'in')->count(),
                'sent' => (clone $messageQuery)->where('status', 'sent')->count(),
                'failed' => (clone $messageQuery)->where('status', 'failed')->count(),
                'campaigns_active' => EitaaCampaign::whereIn('status', ['scheduled', 'running'])->count(),
                'templates' => EitaaTemplate::where('is_active', true)->count(),
                'keywords' => EitaaKeyword::where('is_active', true)->count(),
                'notifications' => EitaaNotification::whereNull('read_at')->count(),
                'test_mode' => (bool) ($bot?->test_mode ?? true),
            ],
            'daily' => $this->dailySeries($since),
            'campaigns' => EitaaCampaign::query()->with('bot:id,name')->latest()->limit(5)->get()
                ->map(fn (EitaaCampaign $campaign) => $this->presentCampaign($campaign)),
            'range' => $range,
        ]);
    }

    // ----------------------------------------------------------------- bots

    public function bots(): Response
    {
        return Inertia::render('Admin/Eitaa/Bots', [
            'bots' => EitaaBot::query()->orderBy('id')->get()->map(fn (EitaaBot $bot) => $this->presentBot($bot)),
            'legacy' => [
                'token_configured' => filled(\App\Models\Setting::getSecret('eitaa_bot_token')),
                'channel_id' => (string) \App\Models\Setting::get('eitaa_channel_id', ''),
            ],
        ]);
    }

    public function storeBot(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'token' => ['required', 'string', 'max:255'],
            'rate_limit_per_minute' => ['nullable', 'integer', 'min:1', 'max:600'],
        ]);

        $bot = EitaaBot::create([
            'name' => $data['name'],
            'rate_limit_per_minute' => $data['rate_limit_per_minute'] ?? 20,
            'status' => 'disconnected',
            'test_mode' => true,
        ]);
        $bot->setAccessToken($data['token']);
        EitaaLog::record($bot->id, 'bot.created', 'ربات جدید ثبت شد.');

        return back()->with('success', 'ربات ثبت شد. حالا اتصال را تست کنید.');
    }

    public function updateBot(Request $request, EitaaBot $bot): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'token' => ['nullable', 'string', 'max:255'],
            'rate_limit_per_minute' => ['nullable', 'integer', 'min:1', 'max:600'],
            'test_mode' => ['sometimes', 'boolean'],
        ]);
        if (filled($data['token'] ?? null)) {
            $bot->setAccessToken($data['token']);
        }
        $bot->update(collect($data)->only(['name', 'rate_limit_per_minute', 'test_mode'])->all());

        return back()->with('success', 'تنظیمات ربات ذخیره شد.');
    }

    public function connectBot(EitaaBot $bot, EitaaBotService $service): RedirectResponse
    {
        $result = $service->connect($bot);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    public function testBot(EitaaBot $bot, EitaaBotService $service): RedirectResponse
    {
        $result = $service->test($bot);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    public function destroyBot(EitaaBot $bot): RedirectResponse
    {
        EitaaLog::record($bot->id, 'bot.deleted', 'ربات حذف شد.');
        $bot->delete();

        return redirect()->route('admin.eitaa.bots')->with('success', 'ربات حذف شد.');
    }

    // -------------------------------------------------------------- targets

    public function targets(Request $request): Response
    {
        $search = (string) $request->query('search', '');

        return Inertia::render('Admin/Eitaa/Targets', [
            'targets' => EitaaTarget::query()
                ->with('bot:id,name')
                ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('chat_id', 'like', "%{$search}%")))
                ->orderBy('title')
                ->paginate(30)
                ->withQueryString()
                ->through(fn (EitaaTarget $target) => $this->presentTarget($target)),
            'bots' => EitaaBot::query()->orderBy('id')->get(['id', 'name', 'test_mode']),
            'filters' => ['search' => $search],
        ]);
    }

    public function storeTarget(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'bot_id' => ['required', 'exists:eitaa_bots,id'],
            'chat_id' => ['required', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:channel,group'],
            'tags' => ['nullable', 'string', 'max:500'],
        ]);
        $target = EitaaTarget::create([
            'bot_id' => $data['bot_id'],
            'chat_id' => trim($data['chat_id']),
            'title' => $data['title'] ?? $data['chat_id'],
            'type' => $data['type'],
            'tags' => collect(explode(',', (string) ($data['tags'] ?? '')))->map(fn ($t) => trim($t))->filter()->values()->all(),
        ]);

        return back()->with('success', 'مقصد ثبت شد؛ با «بررسی دسترسی» صحت آن را تأیید کنید.');
    }

    public function verifyTarget(EitaaTarget $target, EitaaBotService $service): RedirectResponse
    {
        $result = $service->verifyTarget($target);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    /**
     * Quick-send to a chat id typed on the fly: the identifier is registered as
     * a target (if new) and the message goes out immediately through the usual
     * pipeline, so Test Mode, logging and rate limits behave like any other send.
     */
    public function manualSend(Request $request, EitaaBotService $service): RedirectResponse
    {
        $data = $request->validate([
            'bot_id' => ['required', 'exists:eitaa_bots,id'],
            'chat_id' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:4000'],
        ]);
        $bot = EitaaBot::query()->findOrFail($data['bot_id']);
        $chatId = trim($data['chat_id']);

        $target = EitaaTarget::firstOrCreate(
            ['bot_id' => $bot->id, 'chat_id' => $chatId],
            ['title' => $chatId, 'type' => 'channel'],
        );

        $result = $service->sendNow($bot, $target, $data['body']);
        if (! $result['ok']) {
            $target->update(['status' => 'blocked', 'last_error' => $result['error'], 'last_error_at' => now()]);

            return back()->with('error', 'ارسال ناموفق بود: '.($result['error'] ?? 'خطای ناشناخته'));
        }

        if ($target->status === 'blocked') {
            $target->update(['status' => 'active']);
        }

        return back()->with('success', $bot->test_mode
            ? "حالت آزمایشی: پیام به «{$chatId}» شبیه‌سازی شد و شناسه به فهرست مقاصد اضافه شد (ارسال واقعی انجام نشد)."
            : "پیام به «{$chatId}» ارسال شد؛ شناسه در فهرست مقاصد ثبت شد.");
    }

    public function updateTarget(Request $request, EitaaTarget $target): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'in:active,paused,blocked'],
            'opt_in_status' => ['sometimes', 'in:opted_in,unknown,opted_out,blocked'],
            'tags' => ['nullable', 'string', 'max:500'],
        ]);
        if (array_key_exists('tags', $data)) {
            $data['tags'] = collect(explode(',', (string) $data['tags']))->map(fn ($t) => trim($t))->filter()->values()->all();
        }
        $target->update($data);

        return back()->with('success', 'مقصد به‌روزرسانی شد.');
    }

    public function destroyTarget(EitaaTarget $target): RedirectResponse
    {
        $target->delete();

        return back()->with('success', 'مقصد حذف شد.');
    }

    public function importTargets(Request $request): RedirectResponse
    {
        $request->validate(['bot_id' => ['required', 'exists:eitaa_bots,id'], 'file' => ['required', 'file', 'mimes:csv,txt', 'max:2048']]);
        $botId = (int) $request->input('bot_id');
        $rows = array_filter(array_map('str_getcsv', file($request->file('file')->getRealPath()) ?: []));
        $imported = 0;
        foreach ($rows as $i => $row) {
            if ($i === 0 && str_contains(mb_strtolower(implode(',', $row)), 'chat_id')) {
                continue; // header
            }
            [$chatId, $title, $type, $tags] = array_pad($row, 4, null);
            if (blank($chatId)) {
                continue;
            }
            EitaaTarget::firstOrCreate(
                ['bot_id' => $botId, 'chat_id' => trim((string) $chatId)],
                ['title' => trim((string) $title) ?: trim((string) $chatId), 'type' => in_array($type, ['channel', 'group'], true) ? $type : 'channel',
                 'tags' => collect(explode(';', (string) $tags))->map(fn ($t) => trim($t))->filter()->values()->all()],
            );
            $imported++;
        }

        return back()->with('success', "{$imported} مقصد از فایل وارد شد.");
    }

    // ------------------------------------------------------------ campaigns

    public function campaigns(): Response
    {
        return Inertia::render('Admin/Eitaa/Campaigns', [
            'campaigns' => EitaaCampaign::query()->with('bot:id,name')->latest()->get()
                ->map(fn (EitaaCampaign $campaign) => $this->presentCampaign($campaign)),
            'bots' => EitaaBot::query()->where('is_active', true)->get(['id', 'name']),
            'templates' => EitaaTemplate::query()->where('is_active', true)->get(['id', 'name', 'body']),
            'targets' => EitaaTarget::query()->where('status', 'active')->get(['id', 'title', 'chat_id', 'tags']),
        ]);
    }

    public function storeCampaign(Request $request): RedirectResponse
    {
        $data = $this->validateCampaign($request);
        $campaign = EitaaCampaign::create([...$data, 'status' => filled($data['scheduled_at'] ?? null) ? 'scheduled' : 'draft']);

        return back()->with('success', 'کمپین ساخته شد.');
    }

    public function updateCampaign(Request $request, EitaaCampaign $campaign): RedirectResponse
    {
        $campaign->update($this->validateCampaign($request));

        return back()->with('success', 'کمپین به‌روزرسانی شد.');
    }

    public function launchCampaign(EitaaCampaign $campaign, EitaaBotService $service): RedirectResponse
    {
        $result = $service->launch($campaign);

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    public function pauseCampaign(EitaaCampaign $campaign, EitaaBotService $service): RedirectResponse
    {
        $service->pause($campaign);

        return back()->with('success', 'کمپین متوقف شد.');
    }

    public function resumeCampaign(EitaaCampaign $campaign, EitaaBotService $service): RedirectResponse
    {
        $service->resume($campaign);

        return back()->with('success', 'کمپین ادامه یافت.');
    }

    public function cancelCampaign(EitaaCampaign $campaign, EitaaBotService $service): RedirectResponse
    {
        $service->cancel($campaign);

        return back()->with('success', 'کمپین لغو شد.');
    }

    public function showCampaign(EitaaCampaign $campaign): Response
    {
        $campaign->load(['bot:id,name']);

        return Inertia::render('Admin/Eitaa/CampaignShow', [
            'campaign' => $this->presentCampaign($campaign),
            'recipients' => $campaign->recipients()->with('target:id,title,chat_id')->orderBy('id')
                ->paginate(50)->through(fn (EitaaCampaignTarget $r) => [
                    'id' => $r->id, 'title' => $r->target?->title, 'chat_id' => $r->target?->chat_id,
                    'status' => $r->status, 'attempts' => $r->attempts, 'error' => $r->error,
                    'sent_at' => $r->sent_at?->diffForHumans(),
                ]),
        ]);
    }

    private function validateCampaign(Request $request): array
    {
        return $request->validate([
            'bot_id' => ['required', 'exists:eitaa_bots,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'message_body' => ['required', 'string', 'max:4000'],
            'audience_type' => ['required', 'in:all,tags,targets'],
            'audience_filters' => ['nullable', 'array'],
            'template_id' => ['nullable', 'exists:eitaa_templates,id'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
            'rate_limit_per_minute' => ['nullable', 'integer', 'min:1', 'max:120'],
            'max_retries' => ['nullable', 'integer', 'min:0', 'max:5'],
        ]);
    }

    // ------------------------------------------------------------ send page

    public function send(Request $request, EitaaBotService $service): Response
    {
        return Inertia::render('Admin/Eitaa/Send', [
            'bots' => EitaaBot::query()->where('is_active', true)->get(['id', 'name', 'test_mode']),
            'targets' => EitaaTarget::query()->where('status', 'active')->where('opt_in_status', 'opted_in')
                ->get(['id', 'title', 'chat_id', 'type']),
            'templates' => EitaaTemplate::query()->where('is_active', true)->get(['id', 'name', 'body']),
        ]);
    }

    public function sendNow(Request $request, EitaaBotService $service): RedirectResponse
    {
        $data = $request->validate([
            'bot_id' => ['required', 'exists:eitaa_bots,id'],
            'target_ids' => ['required', 'array', 'min:1', 'max:50'],
            'target_ids.*' => ['exists:eitaa_targets,id'],
            'body' => ['required', 'string', 'max:4000'],
            'schedule_at' => ['nullable', 'date', 'after:now'],
        ]);
        $bot = EitaaBot::query()->findOrFail($data['bot_id']);
        $sent = 0;
        foreach (EitaaTarget::whereIn('id', $data['target_ids'])->get() as $target) {
            if (filled($data['schedule_at'] ?? null)) {
                EitaaMessage::create([
                    'bot_id' => $bot->id, 'target_id' => $target->id, 'direction' => 'out',
                    'chat_id' => $target->chat_id, 'message_type' => 'text',
                    'body' => EitaaBotService::renderBody($data['body'], $target),
                    'status' => 'queued',
                ]);
            } else {
                $service->sendNow($bot, $target, EitaaBotService::renderBody($data['body'], $target));
            }
            $sent++;
        }

        return back()->with('success', filled($data['schedule_at'] ?? null)
            ? 'پیام برای ارسال زمان‌بندی شد.'
            : ($bot->test_mode ? "حالت آزمایشی: {$sent} پیام شبیه‌سازی شد (پیام واقعی ارسال نشد)." : "پیام به {$sent} مقصد ارسال شد."));
    }

    // ------------------------------------------------------------ templates

    public function templates(): Response
    {
        return Inertia::render('Admin/Eitaa/Templates', [
            'templates' => EitaaTemplate::query()->latest()->get(),
        ]);
    }

    public function storeTemplate(Request $request): RedirectResponse
    {
        EitaaTemplate::create($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:welcome,course,price,followup,thankyou,general'],
            'body' => ['required', 'string', 'max:4000'],
            'is_active' => ['sometimes', 'boolean'],
        ]));

        return back()->with('success', 'قالب ذخیره شد.');
    }

    public function updateTemplate(Request $request, EitaaTemplate $template): RedirectResponse
    {
        $template->update($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:welcome,course,price,followup,thankyou,general'],
            'body' => ['required', 'string', 'max:4000'],
            'is_active' => ['sometimes', 'boolean'],
        ]));

        return back()->with('success', 'قالب به‌روزرسانی شد.');
    }

    public function destroyTemplate(EitaaTemplate $template): RedirectResponse
    {
        $template->delete();

        return back()->with('success', 'قالب حذف شد.');
    }

    // ------------------------------------------------------------- keywords

    public function keywords(): Response
    {
        return Inertia::render('Admin/Eitaa/Keywords', [
            'keywords' => EitaaKeyword::query()->with('bot:id,name')->latest('priority')->get(),
            'bots' => EitaaBot::query()->get(['id', 'name']),
        ]);
    }

    public function storeKeyword(Request $request): RedirectResponse
    {
        EitaaKeyword::create($request->validate([
            'bot_id' => ['required', 'exists:eitaa_bots,id'],
            'keyword' => ['required', 'string', 'max:255'],
            'match_type' => ['required', 'in:exact,contains,starts_with,regex'],
            'response' => ['required', 'string', 'max:4000'],
            'priority' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'stop_processing' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]));

        return back()->with('success', 'کلمه کلیدی ذخیره شد. توجه: پردازش پیام‌های ورودی منتظر API رسمی دریافت پیام ایتاست.');
    }

    public function updateKeyword(Request $request, EitaaKeyword $keyword): RedirectResponse
    {
        $keyword->update($request->validate([
            'keyword' => ['required', 'string', 'max:255'],
            'match_type' => ['required', 'in:exact,contains,starts_with,regex'],
            'response' => ['required', 'string', 'max:4000'],
            'priority' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'stop_processing' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]));

        return back()->with('success', 'کلمه کلیدی به‌روزرسانی شد.');
    }

    public function destroyKeyword(EitaaKeyword $keyword): RedirectResponse
    {
        $keyword->delete();

        return back()->with('success', 'کلمه کلیدی حذف شد.');
    }

    // -------------------------------------------------------- conversations

    public function conversations(): Response
    {
        return Inertia::render('Admin/Eitaa/Conversations', [
            'conversations' => EitaaConversation::query()->with('bot:id,name')->latest('last_message_at')->paginate(25),
            'inboundSupported' => false,
        ]);
    }

    // -------------------------------------------------------------- reports

    public function reports(Request $request): Response
    {
        $range = (int) $request->query('range', '30');
        $since = match ($range) { 1 => now()->startOfDay(), 7 => now()->subDays(7), default => now()->subDays(30) };
        $sent = EitaaMessage::where('direction', 'out')->where('status', 'sent')->where('created_at', '>=', $since)->count();
        $failed = EitaaMessage::where('direction', 'out')->where('status', 'failed')->where('created_at', '>=', $since)->count();

        return Inertia::render('Admin/Eitaa/Reports', [
            'range' => $range,
            'summary' => [
                'sent' => $sent, 'failed' => $failed,
                'failure_rate' => $sent + $failed > 0 ? round($failed / ($sent + $failed) * 100, 1) : 0,
                'campaigns' => EitaaCampaign::where('created_at', '>=', $since)->count(),
                'completed_campaigns' => EitaaCampaign::where('status', 'completed')->where('created_at', '>=', $since)->count(),
                'by_category' => EitaaMessage::where('status', 'failed')->where('created_at', '>=', $since)
                    ->select('error_category', DB::raw('count(*) as total'))->groupBy('error_category')->pluck('total', 'error_category'),
            ],
            'daily' => $this->dailySeries($since),
            'campaignStats' => EitaaCampaign::query()->with('bot:id,name')->whereIn('status', ['completed', 'running', 'failed'])->latest()->limit(10)
                ->get()->map(fn (EitaaCampaign $c) => $this->presentCampaign($c)),
        ]);
    }

    // ------------------------------------------------------------ logs etc.

    public function logs(Request $request): Response
    {
        return Inertia::render('Admin/Eitaa/Logs', [
            'logs' => EitaaLog::query()->with('bot:id,name')->latest()
                ->when((string) $request->query('level', '') !== '', fn ($q) => $q->where('level', $request->query('level')))
                ->when((string) $request->query('event', '') !== '', fn ($q) => $q->where('event', 'like', '%'.$request->query('event').'%'))
                ->paginate(40)->withQueryString(),
            'filters' => ['level' => (string) $request->query('level', ''), 'event' => (string) $request->query('event', '')],
        ]);
    }

    public function notifications(): Response
    {
        return Inertia::render('Admin/Eitaa/Notifications', [
            'notifications' => EitaaNotification::query()->with('bot:id,name')->latest()->paginate(25),
            'unread' => EitaaNotification::whereNull('read_at')->count(),
        ]);
    }

    public function markNotificationsRead(): RedirectResponse
    {
        EitaaNotification::query()->whereNull('read_at')->update(['read_at' => now()]);

        return back()->with('success', 'همه اعلان‌ها خوانده شد.');
    }

    // ------------------------------------------------------------- settings

    public function settings(): Response
    {
        return Inertia::render('Admin/Eitaa/Settings', [
            'webhookUrl' => url('/api/eitaa/webhook/{bot}'),
            'inboundSupported' => false,
            'queueConnection' => config('queue.default'),
        ]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        // Reserved: global module settings land here (currently per-bot settings are used).
        return back()->with('success', 'تنظیمات ذخیره شد.');
    }

    // ------------------------------------------------------------------- AI

    public function ai(): Response
    {
        $ai = EitaaAiSetting::singleton();

        return Inertia::render('Admin/Eitaa/Ai', [
            'ai' => [
                'enabled' => $ai->enabled, 'provider' => $ai->provider, 'base_url' => $ai->base_url,
                'model' => $ai->model, 'temperature' => $ai->temperature, 'max_tokens' => $ai->max_tokens,
                'system_prompt' => $ai->system_prompt, 'has_key' => filled($ai->api_key_encrypted),
            ],
        ]);
    }

    public function updateAi(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'provider' => ['required', 'in:openai,custom'],
            'base_url' => ['nullable', 'url', 'max:255'],
            'model' => ['required', 'string', 'max:100'],
            'temperature' => ['nullable', 'numeric', 'between:0,2'],
            'max_tokens' => ['nullable', 'integer', 'min:50', 'max:4000'],
            'system_prompt' => ['nullable', 'string', 'max:4000'],
            'api_key' => ['nullable', 'string', 'max:255'],
        ]);
        $ai = EitaaAiSetting::singleton();
        if (filled($data['api_key'] ?? null)) {
            $ai->setApiKey($data['api_key']);
        }
        unset($data['api_key']);
        $ai->update($data);

        return back()->with('success', 'تنظیمات هوش مصنوعی ذخیره شد.');
    }

    public function aiDraft(Request $request, EitaaDraftingService $drafting): JsonResponse
    {
        $data = $request->validate([
            'brief' => ['required', 'string', 'max:1000'],
            'tone' => ['nullable', 'in:formal,friendly,sales'],
        ]);
        $result = $drafting->draft((string) $data['brief'], (string) ($data['tone'] ?? 'friendly'));
        $status = $result['ok'] ? 200 : 422;

        return response()->json($result, $status);
    }

    // ------------------------------------------------------------- helpers

    private function dailySeries(\Carbon\CarbonInterface $since): array
    {
        return EitaaMessage::query()
            ->where('created_at', '>=', $since)
            ->selectRaw("DATE(created_at) as day, direction, status, count(*) as total")
            ->groupBy('day', 'direction', 'status')
            ->get()
            ->groupBy('day')
            ->map(fn ($rows, $day) => [
                'day' => $day,
                'sent' => (int) $rows->where('direction', 'out')->where('status', 'sent')->sum('total'),
                'failed' => (int) $rows->where('direction', 'out')->where('status', 'failed')->sum('total'),
                'inbound' => (int) $rows->where('direction', 'in')->sum('total'),
            ])
            ->values()
            ->all();
    }

    private function presentBot(EitaaBot $bot): array
    {
        return [
            'id' => $bot->id, 'name' => $bot->name, 'username' => $bot->username, 'bot_id' => $bot->bot_id,
            'status' => $bot->status, 'is_active' => $bot->is_active, 'test_mode' => $bot->test_mode,
            'rate_limit_per_minute' => $bot->rate_limit_per_minute,
            'has_token' => filled($bot->access_token_encrypted),
            'last_connected_at' => $bot->last_connected_at?->diffForHumans(),
            'last_error' => $bot->last_error,
            'targets_count' => $bot->targets()->count(),
        ];
    }

    private function presentTarget(EitaaTarget $target): array
    {
        return [
            'id' => $target->id, 'bot' => $target->bot?->name, 'chat_id' => $target->chat_id,
            'title' => $target->title, 'type' => $target->type, 'status' => $target->status,
            'opt_in_status' => $target->opt_in_status, 'tags' => $target->tags ?? [],
            'last_send_at' => $target->last_send_at?->diffForHumans(), 'last_error' => $target->last_error,
        ];
    }

    private function presentCampaign(EitaaCampaign $campaign): array
    {
        return [
            'id' => $campaign->id, 'bot' => $campaign->bot?->name, 'name' => $campaign->name,
            'status' => $campaign->status, 'message_body' => $campaign->message_body,
            'audience_type' => $campaign->audience_type,
            'scheduled_at' => $campaign->scheduled_at?->format('Y-m-d H:i'),
            'total_targets' => $campaign->total_targets, 'sent_count' => $campaign->sent_count,
            'failed_count' => $campaign->failed_count,
            'started_at' => $campaign->started_at?->diffForHumans(),
            'completed_at' => $campaign->completed_at?->diffForHumans(),
        ];
    }
}
