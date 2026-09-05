<?php

namespace App\Services\Eitaa;

use App\Models\Course;
use App\Models\Eitaa\EitaaAiSetting;
use App\Models\Event;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * AI drafting assistant for broadcast messages (v1 scope: no dialogue).
 * Grounded on real course/event rows from the CMS; will not invent prices
 * or course names. Falls back to a local template draft when AI is disabled
 * or unavailable, so the composer always helps.
 */
class EitaaDraftingService
{
    public function __construct(
        private readonly EitaaAiSetting $settings = new EitaaAiSetting(),
    ) {}

    /** @return array{ok: bool, text: string, mode: string, message?: string} */
    public function draft(string $brief, string $tone = 'friendly'): array
    {
        $ai = EitaaAiSetting::singleton();
        $catalog = $this->catalogContext();
        $grounding = "اطلاعات واقعی دوره‌ها و رویدادهای سایت (تنها از این‌ها استفاده کن، قیمت و نام از خودت نساز):\n{$catalog}";

        if ($ai->enabled && filled($ai->apiKey())) {
            try {
                $response = Http::withToken((string) $ai->apiKey())
                    ->timeout(30)
                    ->post(rtrim($ai->base_url ?: 'https://api.openai.com/v1', '/').'/chat/completions', [
                        'model' => $ai->model,
                        'temperature' => (float) $ai->temperature,
                        'max_tokens' => (int) $ai->max_tokens,
                        'messages' => [
                            ['role' => 'system', 'content' => $this->systemPrompt($grounding)],
                            ['role' => 'user', 'content' => "درخواست مدیر: {$brief}\nلحن: {$tone}"],
                        ],
                    ]);
                $text = (string) ($response->json('choices.0.message.content') ?? '');
                if ($response->successful() && trim($text) !== '') {
                    return ['ok' => true, 'text' => trim($text), 'mode' => 'ai'];
                }
            } catch (Throwable) {
                // fall through to template draft
            }
        }

        return ['ok' => true, 'text' => $this->templateDraft($brief, $catalog), 'mode' => 'template',
            'message' => $ai->enabled ? 'دسترسی به سرویس AI ممکن نشد؛ پیش‌نویس با قالب محلی ساخته شد.' : 'هوش مصنوعی غیرفعال است؛ پیش‌نویس با قالب محلی ساخته شد.'];
    }

    private function systemPrompt(string $grounding): string
    {
        return "تو دستیار تولید پیام ایتا برای «مرکز رشد و کارآفرینی دکتر بیدی» هستی.\n"
            ."قواعد سخت‌گیرانه:\n"
           ."- فقط از اطلاعات واقعی زیر استفاده کن؛ قیمت، نام دوره یا تاریخ از خودت نساز.\n"
           ."- اگر اطلاعات کافی نیست، جای آن را با [نیاز به تأیید] مشخص کن.\n"
           ."- خروجی فقط متن پیام باشد، حداکثر 900 کاراکتر، با ایموجی و حداکثر 3 هشتگ.\n\n".$grounding;
    }

    /** Builds a compact catalog of active courses/events for grounding. */
    private function catalogContext(): string
    {
        $courses = Course::published()->latest()->limit(8)
            ->get(['title', 'price', 'slug'])
            ->map(fn ($c) => "- دوره: {$c->title}".($c->price ? " | قیمت: ".number_format((float) $c->price)." تومان" : ''));
        $events = Event::query()->where('status', 'published')->latest('event_date')->limit(5)
            ->get(['title', 'event_date'])
            ->map(fn ($e) => "- رویداد: {$e->title}".($e->event_date ? " | تاریخ: ".\App\Support\FaDate::format($e->event_date) : ''));

        return collect([$courses->implode("\n"), $events->implode("\n")])->filter()->implode("\n");
    }

    /** Deterministic local draft (shared hosting + AI-off friendly). */
    private function templateDraft(string $brief, string $catalog): string
    {
        return "📣 ".$brief."\n\n"
            .$catalog."\n\n"
            ."🔗 ثبت‌نام و اطلاعات کامل: ".url('/courses')."\n"
            ."#مرکز_رشد #دکتر_بیدی";
    }
}
