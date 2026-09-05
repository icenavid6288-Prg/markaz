<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InstagramAutomation;
use App\Models\InstagramAutomationRun;
use App\Models\InstagramConversation;
use App\Models\InstagramMedia;
use App\Models\InstagramMessage;
use App\Models\InstagramTemplate;
use App\Models\InstagramWebhookEvent;
use App\Models\User;
use App\Services\Instagram\InstagramService;
use Illuminate\Support\Str;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;
use Inertia\Inertia;
use Inertia\Response;

class InstagramController extends Controller
{
    public function index(Request $request, InstagramService $instagram): Response
    {
        $channel = $request->string('channel')->toString();
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();
        $conversations = InstagramConversation::query()
            ->with(['lead:id,name,phone,status', 'messages' => fn ($query) => $query->latest()->limit(1)])
            ->when(in_array($channel, ['dm', 'comment'], true), fn ($query) => $query->where('channel', $channel))
            ->when(in_array($status, ['open', 'closed'], true), fn ($query) => $query->where('status', $status))
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search) {
                $query->where('participant_username', 'like', "%{$search}%")
                    ->orWhere('participant_id', 'like', "%{$search}%")
                    ->orWhereHas('lead', fn ($lead) => $lead->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%"));
            }))
            ->latest('last_message_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (InstagramConversation $conversation) => $this->presentConversation($conversation));

        return Inertia::render('Admin/Instagram/Index', [
            'conversations' => $conversations,
            'filters' => ['channel' => $channel, 'status' => $status, 'search' => $search],
            'stats' => [
                'total' => InstagramConversation::count(),
                'open' => InstagramConversation::where('status', 'open')->count(),
                'unread' => InstagramConversation::where('unread_count', '>', 0)->count(),
                'messages' => InstagramMessage::count(),
                'configured' => $instagram->isConfigured(),
            ],
        ]);
    }

    public function show(InstagramConversation $conversation): Response
    {
        $conversation->load(['lead:id,name,phone,status,email', 'assignee:id,name', 'messages' => fn ($query) => $query->oldest()]);
        $conversation->update(['unread_count' => 0]);

        return Inertia::render('Admin/Instagram/Show', [
            'conversation' => [
                ...$this->presentConversation($conversation),
                'assignee' => $conversation->assignee ? ['id' => $conversation->assignee->id, 'name' => $conversation->assignee->name] : null,
                'messages' => $conversation->messages->map(fn ($message) => [
                    'id' => $message->id,
                    'body' => $message->body,
                    'direction' => $message->direction,
                    'message_type' => $message->message_type,
                    'status' => $message->status,
                    'created_at' => $message->created_at?->diffForHumans(),
                ]),
            ],
            'admins' => User::query()->where('is_active', true)->whereHas('roles', fn ($query) => $query->whereIn('name', User::ADMIN_PANEL_ROLES))->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function reply(Request $request, InstagramConversation $conversation, InstagramService $instagram): RedirectResponse
    {
        $validated = $request->validate(['message' => ['required', 'string', 'max:2000']]);
        $incoming = $conversation->messages()->where('direction', 'inbound')->latest()->first();
        abort_unless($incoming, 422, 'برای این گفتگو پیام ورودی وجود ندارد.');
        $instagram->reply($incoming, $validated['message']);

        return back()->with('success', 'پاسخ به اینستاگرام ارسال شد.');
    }

    public function updateStatus(Request $request, InstagramConversation $conversation): RedirectResponse
    {
        $conversation->update(['status' => $request->validate(['status' => ['required', 'in:open,closed']])['status']]);
        return back()->with('success', 'وضعیت گفتگو به‌روزرسانی شد.');
    }

    public function assign(Request $request, InstagramConversation $conversation): RedirectResponse
    {
        $conversation->update(['assigned_to' => $request->validate(['assigned_to' => ['nullable', 'exists:users,id']])['assigned_to'] ?? null]);
        return back()->with('success', 'مسئول گفتگو به‌روزرسانی شد.');
    }

    public function moderateComment(Request $request, InstagramMessage $message, InstagramService $instagram): RedirectResponse
    {
        $action = $request->validate(['action' => ['required', 'in:hide,unhide,delete']])['action'];
        $result = $instagram->moderateComment($message, $action);
        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }

    public function automations(): Response
    {
        return Inertia::render('Admin/Instagram/Automations', [
            'automations' => InstagramAutomation::query()->withCount('runs')->latest('priority')->latest()->get()->map(fn (InstagramAutomation $item) => $this->presentAutomation($item)),
            'runs' => InstagramAutomationRun::query()->with('automation:id,name')->latest()->limit(30)->get()->map(fn ($run) => [
                'id' => $run->id, 'automation' => $run->automation?->name, 'status' => $run->status,
                'error' => $run->error, 'executed_at' => $run->executed_at?->diffForHumans(),
            ]),
        ]);
    }

    public function storeAutomation(Request $request): RedirectResponse
    {
        InstagramAutomation::create($this->automationData($request));
        return redirect()->route('admin.instagram.automations')->with('success', 'قانون اتوماسیون اینستاگرام ایجاد شد.');
    }

    public function updateAutomation(Request $request, InstagramAutomation $automation): RedirectResponse
    {
        $automation->update($this->automationData($request));
        return back()->with('success', 'قانون اتوماسیون به‌روزرسانی شد.');
    }

    public function toggleAutomation(InstagramAutomation $automation): RedirectResponse
    {
        $automation->update(['enabled' => ! $automation->enabled]);
        return back()->with('success', $automation->enabled ? 'اتوماسیون فعال شد.' : 'اتوماسیون متوقف شد.');
    }

    public function destroyAutomation(InstagramAutomation $automation): RedirectResponse
    {
        $automation->delete();
        return back()->with('success', 'اتوماسیون حذف شد.');
    }

    public function templates(): Response
    {
        return Inertia::render('Admin/Instagram/Templates', [
            'templates' => InstagramTemplate::query()->latest()->get()->map(fn (InstagramTemplate $item) => [
                'id' => $item->id, 'name' => $item->name, 'type' => $item->type, 'body' => $item->body,
                'enabled' => $item->enabled, 'variables' => $item->variables ?? [],
            ]),
        ]);
    }

    public function storeTemplate(Request $request): RedirectResponse
    {
        InstagramTemplate::create($request->validate([
            'name' => ['required', 'string', 'max:255'], 'type' => ['required', 'in:dm,comment'],
            'body' => ['required', 'string', 'max:2000'], 'enabled' => ['sometimes', 'boolean'],
        ]));
        return back()->with('success', 'قالب پاسخ ذخیره شد.');
    }

    public function updateTemplate(Request $request, InstagramTemplate $template): RedirectResponse
    {
        $template->update($request->validate([
            'name' => ['required', 'string', 'max:255'], 'type' => ['required', 'in:dm,comment'],
            'body' => ['required', 'string', 'max:2000'], 'enabled' => ['sometimes', 'boolean'],
        ]));
        return back()->with('success', 'قالب پاسخ به‌روزرسانی شد.');
    }

    public function destroyTemplate(InstagramTemplate $template): RedirectResponse
    {
        $template->delete();
        return back()->with('success', 'قالب حذف شد.');
    }

    public function media(InstagramService $instagram): Response
    {
        return Inertia::render('Admin/Instagram/Media', [
            'media' => InstagramMedia::query()
                ->latest()
                ->paginate(12)
                ->withQueryString()
                ->through(fn (InstagramMedia $item) => $this->presentMedia($item)),
            'configured' => $instagram->isConfigured(),
        ]);
    }

    /**
     * Publishes to Instagram now, or queues the post for a scheduled run.
     * Files uploaded by the team are stored on the public disk and exposed
     * to Meta through the site URL; remote URLs are used as provided.
     */
    public function publishMedia(Request $request, InstagramService $instagram): RedirectResponse
    {
        $validated = $request->validate([
            'post_type' => ['required', 'in:IMAGE,VIDEO,CAROUSEL'],
            'media_files' => ['nullable', 'array', 'max:10'],
            'media_files.*' => ['file', 'mimes:jpg,jpeg,png,webp,mp4,mov', 'max:61440'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'video_url' => ['nullable', 'url', 'max:2048'],
            'caption' => ['nullable', 'string', 'max:2200'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
        ]);

        // Gather media: uploads win, then the matching URL field.
        $urls = [];
        foreach ((array) ($validated['media_files'] ?? []) as $file) {
            $path = $file->store('instagram', 'public');
            $urls[] = rtrim(url('/'), '/').'/storage/'.$path;
        }
        $remote = $validated['post_type'] === 'VIDEO' ? ($validated['video_url'] ?? null) : ($validated['image_url'] ?? null);
        if ($remote !== null && $remote !== '') {
            $urls[] = (string) $remote;
        }
        if ($urls === []) {
            return back()->with('error', 'یک فایل یا آدرس رسانه انتخاب کنید.');
        }
        if ($validated['post_type'] === 'CAROUSEL' && count($urls) < 2) {
            return back()->with('error', 'برای کاروسل حداقل دو رسانه لازم است.');
        }

        $caption = (string) ($validated['caption'] ?? '');

        // Scheduled posts are stored with status=scheduled and pushed by instagram:publish-scheduled.
        if (filled($validated['scheduled_at'] ?? null)) {
            InstagramMedia::create([
                'external_id' => 'scheduled:'.Str::uuid(),
                'post_type' => $validated['post_type'],
                'media_type' => $validated['post_type'] === 'VIDEO' ? 'VIDEO' : 'IMAGE',
                'caption' => $caption,
                'media_url' => $urls[0],
                'scheduled_at' => $validated['scheduled_at'],
                'status' => 'scheduled',
                'metadata' => ['urls' => $urls],
            ]);

            $at = \Carbon\Carbon::parse($validated['scheduled_at']);
            return back()->with('success', 'انتشار برای '.\App\Support\FaDate::format($at).' ساعت '.$at->format('H:i').' زمان‌بندی شد.');
        }

        try {
            $instagram->publishPost($validated['post_type'], $urls, $caption);
            return back()->with('success', 'پست با موفقیت در اینستاگرام منتشر شد. 🎉');
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'انتشار محتوای اینستاگرام ناموفق بود: '.$exception->getMessage());
        }
    }

    public function retryMedia(InstagramMedia $media, InstagramService $instagram): RedirectResponse
    {
        if ($media->status !== 'failed') {
            return back()->with('error', 'فقط پست‌های ناموفق قابل تلاش دوباره هستند.');
        }
        $urls = (array) ($media->metadata['urls'] ?? []);
        if ($urls === [] && $media->media_url) {
            $urls = [(string) $media->media_url];
        }
        if ($urls === []) {
            return back()->with('error', 'رسانه ذخیره‌شده‌ای برای این پست پیدا نشد.');
        }

        try {
            $instagram->publishPost((string) $media->post_type, array_map('strval', $urls), (string) ($media->caption ?? ''));
            $media->update(['status' => 'published', 'published_at' => now(), 'error' => null]);
            return back()->with('success', 'انتشار پست با تلاش دوباره انجام شد.');
        } catch (Throwable $exception) {
            report($exception);
            $media->update(['error' => $exception->getMessage()]);
            return back()->with('error', 'تلاش دوباره ناموفق بود: '.$exception->getMessage());
        }
    }

    public function destroyMedia(InstagramMedia $media): RedirectResponse
    {
        if (filled($media->user_path)) {
            Storage::disk('public')->delete((string) $media->user_path);
        }
        $media->delete();
        return back()->with('success', 'مورد از تاریخچه حذف شد.');
    }

    public function webhooks(): Response
    {
        return Inertia::render('Admin/Instagram/Webhooks', [
            'events' => InstagramWebhookEvent::query()->latest()->paginate(25)->withQueryString()->through(fn ($event) => [
                'id' => $event->id, 'external_id' => $event->external_id, 'object' => $event->object,
                'processed_at' => $event->processed_at?->diffForHumans(), 'error' => $event->error,
                'created_at' => $event->created_at?->diffForHumans(),
            ]),
        ]);
    }

    public function analytics(): Response
    {
        $byChannel = InstagramConversation::query()->select('channel', DB::raw('count(*) as total'))->groupBy('channel')->pluck('total', 'channel');
        $byDay = InstagramMessage::query()->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as total'))->where('created_at', '>=', now()->subDays(30))->groupBy('day')->orderBy('day')->get();
        return Inertia::render('Admin/Instagram/Analytics', [
            'summary' => [
                'conversations' => InstagramConversation::count(), 'messages' => InstagramMessage::count(),
                'inbound' => InstagramMessage::where('direction', 'inbound')->count(),
                'outbound' => InstagramMessage::where('direction', 'outbound')->count(),
                'leads' => InstagramConversation::whereNotNull('lead_id')->distinct('lead_id')->count('lead_id'),
                'automation_runs' => InstagramAutomationRun::count(),
            ],
            'byChannel' => $byChannel,
            'byDay' => $byDay,
        ]);
    }

    /** @return array<string, mixed> */
    private function automationData(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trigger_type' => ['required', 'in:message_received,comment_received,keyword'],
            'keyword' => ['nullable', 'string', 'max:255'],
            'response' => ['nullable', 'string', 'max:2000'],
            'enabled' => ['sometimes', 'boolean'],
            'priority' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'cooldown_seconds' => ['nullable', 'integer', 'min:0', 'max:2592000'],
        ]);
        return [
            'name' => $data['name'], 'trigger_type' => $data['trigger_type'],
            'conditions' => array_filter(['keyword' => $data['keyword'] ?? null]),
            'actions' => array_values(array_filter([['type' => 'reply', 'text' => $data['response'] ?? '']])),
            'enabled' => (bool) ($data['enabled'] ?? false), 'priority' => (int) ($data['priority'] ?? 100),
            'cooldown_seconds' => (int) ($data['cooldown_seconds'] ?? 86400),
        ];
    }

    /** @return array<string, mixed> */
    private function presentMedia(InstagramMedia $item): array
    {
        return [
            'id' => $item->id, 'external_id' => $item->external_id, 'post_type' => (string) $item->post_type,
            'caption' => $item->caption, 'permalink' => $item->permalink, 'media_url' => $item->media_url,
            'published_at' => $item->published_at?->diffForHumans(), 'scheduled_at' => $item->scheduled_at?->format('Y-m-d H:i'),
            'status' => (string) $item->status, 'error' => $item->error,
        ];
    }

    /** @return array<string, mixed> */
    private function presentConversation(InstagramConversation $conversation): array
    {
        $latest = $conversation->messages->first();
        return [
            'id' => $conversation->id, 'external_id' => $conversation->external_id,
            'channel' => $conversation->channel, 'participant_id' => $conversation->participant_id,
            'participant_username' => $conversation->participant_username, 'status' => $conversation->status,
            'unread_count' => $conversation->unread_count, 'last_message_at' => $conversation->last_message_at?->diffForHumans(),
            'lead' => $conversation->lead ? ['id' => $conversation->lead->id, 'name' => $conversation->lead->name, 'phone' => $conversation->lead->phone, 'email' => $conversation->lead->email, 'status' => $conversation->lead->status] : null,
            'latest_message' => $latest ? ['id' => $latest->id, 'body' => $latest->body, 'direction' => $latest->direction, 'message_type' => $latest->message_type] : null,
        ];
    }

    /** @return array<string, mixed> */
    private function presentAutomation(InstagramAutomation $automation): array
    {
        return [
            'id' => $automation->id, 'name' => $automation->name, 'trigger_type' => $automation->trigger_type,
            'keyword' => $automation->conditions['keyword'] ?? '', 'response' => $automation->actions[0]['text'] ?? '',
            'enabled' => $automation->enabled, 'priority' => $automation->priority, 'cooldown_seconds' => $automation->cooldown_seconds,
            'runs_count' => $automation->runs_count ?? 0, 'last_run_at' => $automation->last_run_at?->diffForHumans(),
        ];
    }
}
