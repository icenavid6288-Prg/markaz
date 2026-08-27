<?php

namespace App\Services\Chat;

use App\Models\Course;
use App\Models\Service;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;

/**
 * OpenAI-compatible chat backend for the live support widget.
 *
 * Only the organization itself is discussed: the system prompt is built from
 * the site's own settings, published courses and active services, and the AI is
 * told to never invent facts or drift outside that knowledge.
 */
class AiSupportService
{
    public function isConfigured(): bool
    {
        return filled(Setting::getSecret('chat_ai_api_key'))
            && in_array((string) Setting::get('chat_ai_enabled', '0'), ['1', 'true'], true);
    }

    /**
     * A bounded, plain-text digest of the organization used as grounding for
     * the assistant. Only public content — no pricing unless the admin entered it.
     */
    public function knowledge(): string
    {
        $lines = [];

        $name = (string) Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی');
        $slogan = (string) Setting::get('site_slogan', '');
        $lines[] = 'نام مجموعه: '.$name.($slogan !== '' ? ' — شعار: '.$slogan : '');
        $lines[] = 'آدرس: '.(string) Setting::get('address', '');
        $lines[] = 'تلفن: '.(string) Setting::get('phone', '');
        $lines[] = 'ایمیل: '.(string) Setting::get('email', '');
        $lines[] = 'ایتا: '.(string) Setting::get('eitaa', '');
        $lines[] = 'وب‌سایت: '.(string) Setting::get('website', '');
        $lines[] = 'ساعات کاری: '.(string) Setting::get('working_hours', '');

        $courses = Course::query()->where('is_published', true)->orderBy('id')->limit(20)->get(['title', 'description']);
        if ($courses->isNotEmpty()) {
            $lines[] = '';
            $lines[] = 'دوره‌های این مجموعه:';
            foreach ($courses as $course) {
                $description = mb_substr((string) $course->description, 0, 200);
                $lines[] = '- '.$course->title.($description !== '' ? ': '.$description : '');
            }
        }

        $services = Service::query()->where('is_active', true)->orderBy('sort_order')->limit(20)->get(['title', 'summary', 'description']);
        if ($services->isNotEmpty()) {
            $lines[] = '';
            $lines[] = 'خدمات این مجموعه:';
            foreach ($services as $service) {
                $text = trim((string) ($service->summary ?: $service->description));
                $lines[] = '- '.$service->title.($text !== '' ? ': '.mb_substr($text, 0, 200) : '');
            }
        }

        return implode("\n", array_filter($lines, fn (string $line) => trim($line) !== ''));
    }

    /**
     * Final system prompt: the admin-configured instructions (with a safe
     * default) plus the organization knowledge. The AI can only answer from here.
     */
    public function systemPrompt(): string
    {
        $configured = trim((string) Setting::get('chat_ai_system_prompt', ''));

        $prompt = $configured !== ''
            ? $configured
            : "شما دستیار پشتیبانی آنلاین «مرکز رشد و کارآفرینی دکتر بیدی» هستید.\n"
                ."قوانین:\n"
                ."۱. فقط درباره این مجموعه، دوره‌ها، خدمات، کوچینگ و فعالیت‌های آن صحبت کنید؛ به موضوعات بیربط وارد نشوید.\n"
                ."۲. فقط بر اساس «اطلاعات رسمی مجموعه» که در ادامه آمده پاسخ دهید. اگر پاسخ سؤال در این اطلاعات نبود، چیزی از خودتان نسازید؛ با مهربانی بگویید پاسخ دقیق را کارشناس پشتیبانی انسانی می‌دهد و از کاربر بخواهید سؤالش را بگذارد تا کارشناسان پاسخ دهند.\n"
                ."۳. پاسخ‌ها کوتاه، دوستانه و به زبان فارسی باشند.\n"
                ."۴. قیمت‌ها و شرایط را فقط در صورتی ذکر کنید که در اطلاعات رسمی آمده باشد.\n"
                ."۵. در پایان هر پاسخ، اگر مفید بود، اطلاعات تماس یا دعوت به رزرو مشاوره را به‌صورت طبیعی یادآوری کنید.";

        $knowledge = $this->knowledge();

        return $knowledge !== ''
            ? $prompt."\n\n## اطلاعات رسمی مجموعه (تنها منبع معتبر پاسخ‌گویی):\n".$knowledge
            : $prompt;
    }

    /**
     * Send the conversation (system prompt + history) to the provider and
     * return the assistant reply. Admin messages are intentionally excluded
     * from history — the AI must never pretend to be a human agent.
     *
     * @param  array<int, array{role: string, body: string}>  $history
     * @return array{ok: bool, content: ?string, error: ?string}
     */
    public function complete(array $history): array
    {
        $token = Setting::getSecret('chat_ai_api_key');
        $baseUrl = (string) Setting::get('chat_ai_base_url', 'https://api.openai.com/v1');
        $model = (string) Setting::get('chat_ai_model', 'gpt-4o-mini');

        if (blank($token)) {
            return ['ok' => false, 'content' => null, 'error' => 'کلید API هوش مصنوعی تنظیم نشده است.'];
        }

        $messages = [['role' => 'system', 'content' => $this->systemPrompt()]];
        foreach (array_slice($history, -24) as $message) {
            $messages[] = [
                'role' => $message['role'] === 'ai' ? 'assistant' : 'user',
                'content' => (string) $message['body'],
            ];
        }

        try {
            $response = Http::timeout(45)
                ->withToken($token)
                ->asJson()
                ->post(rtrim($baseUrl, '/').'/chat/completions', [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => 0.6,
                    'max_tokens' => 700,
                ]);

            $payload = $response->json();
            $content = is_array($payload) ? ($payload['choices'][0]['message']['content'] ?? null) : null;

            if ($response->failed() || ! is_string($content) || trim($content) === '') {
                $detail = is_array($payload) ? ($payload['error']['message'] ?? ($payload['message'] ?? '')) : '';

                return ['ok' => false, 'content' => null, 'error' => $detail !== '' ? (string) $detail : 'پاسخ خالی از سرویس هوش مصنوعی دریافت شد.'];
            }

            return ['ok' => true, 'content' => trim($content), 'error' => null];
        } catch (\Throwable $exception) {
            report($exception);

            return ['ok' => false, 'content' => null, 'error' => $exception->getMessage()];
        }
    }
}
