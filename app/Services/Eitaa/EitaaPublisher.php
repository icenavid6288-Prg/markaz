<?php

namespace App\Services\Eitaa;

use App\Models\Setting;
use App\Models\Survey;
use Illuminate\Support\Facades\Http;
use Throwable;

class EitaaPublisher
{
    /**
     * Send a text message to the configured Eitaa channel via the EitaaYar bot API.
     *
     * @return array{ok: bool, message: string}
     */
    public function publish(string $text): array
    {
        $token = Setting::getSecret('eitaa_bot_token');
        $channel = (string) Setting::get('eitaa_channel_id', '');

        if (blank($token) || blank($channel)) {
            return ['ok' => false, 'message' => 'اتصال ایتا هنوز تنظیم نشده است. ابتدا در تنظیمات سایت، بخش «اتصال به کانال ایتا» را کامل کنید.'];
        }

        try {
            $response = Http::timeout(15)
                ->asForm()
                ->post('https://eitaayar.ir/api/'.$token.'/sendMessage', [
                    'chat_id' => $channel,
                    'text' => $text,
                ]);

            $payload = $response->json();
            if ($response->failed() || (is_array($payload) && ($payload['ok'] ?? false) === false)) {
                $detail = is_array($payload) ? ($payload['description'] ?? '') : '';

                return ['ok' => false, 'message' => 'انتشار در کانال ایتا ناموفق بود.'.($detail ? ' ('.$detail.')' : '')];
            }

            return ['ok' => true, 'message' => 'با موفقیت در کانال ایتا منتشر شد.'];
        } catch (Throwable $exception) {
            report($exception);

            return ['ok' => false, 'message' => 'انتشار در کانال ایتا ناموفق بود: '.$exception->getMessage()];
        }
    }

    public function messageFor(Survey $survey): string
    {
        $template = (string) Setting::get('eitaa_post_template', '');
        $shareUrl = url('/survey/'.$survey->share_token);

        if ($template !== '') {
            return str_replace(['{title}', '{link}'], [$survey->title, $shareUrl], $template);
        }

        return "📊 نظرسنجی جدید: {$survey->title}\n\n🔗 {$shareUrl}";
    }

    /**
     * Build a results summary message for a closed survey.
     * Choice questions show the answer distribution, ratings the average,
     * and free-text questions just the number of answers.
     */
    public function summaryFor(Survey $survey): string
    {
        $survey->loadMissing(['questions', 'responses']);
        $responses = $survey->responses;
        $total = $responses->count();
        $title = $survey->title;

        $lines = ["📊 نتایج نظرسنجی: {$title}"];

        $intro = $this->renderTemplate((string) $survey->setting('summary_intro', ''), $title);
        if ($intro !== '') {
            $lines[] = '';
            $lines[] = $intro;
        }

        $lines[] = '';
        $lines[] = "مجموع پاسخ‌ها: {$total}";

        foreach ($survey->questions->filter(fn ($question) => $question->include_in_summary !== false) as $question) {
            $lines[] = '';
            $lines[] = "❓ {$question->title}";

            $answers = $responses->map(fn ($response) => $response->answersForQuestions($survey->questions))->filter();
            $questionKey = (string) $question->id;

            if (in_array($question->type, ['single', 'multiple', 'yes_no'], true)) {
                $counts = [];
                $filled = 0;
                foreach ($answers as $answerSet) {
                    $value = $answerSet[$questionKey] ?? null;
                    if ($value === null || $value === '') {
                        continue;
                    }
                    $filled++;
                    foreach (is_array($value) ? $value : [$value] as $item) {
                        $item = (string) $item;
                        $counts[$item] = ($counts[$item] ?? 0) + 1;
                    }
                }
                if ($counts === []) {
                    $lines[] = '—';
                    continue;
                }
                arsort($counts);
                foreach ($counts as $option => $count) {
                    $percent = $filled > 0 ? round($count / $filled * 100) : 0;
                    $lines[] = "{$option}: {$count} ({$percent}٪)";
                }
            } elseif ($question->type === 'rating') {
                $values = [];
                foreach ($answers as $answerSet) {
                    $value = $answerSet[$questionKey] ?? null;
                    if ($value === null || $value === '' || ! is_numeric($value)) {
                        continue;
                    }
                    $values[] = (float) $value;
                }
                $lines[] = $values === []
                    ? '—'
                    : 'میانگین: '.number_format(array_sum($values) / count($values), 1).' از ۵';
            } else {
                $filled = 0;
                foreach ($answers as $answerSet) {
                    $value = $answerSet[$questionKey] ?? null;
                    if ($value !== null && $value !== '') {
                        $filled++;
                    }
                }
                $lines[] = $filled > 0 ? "تعداد پاسخ: {$filled}" : '—';
            }
        }

        $outro = $this->renderTemplate((string) $survey->setting('summary_outro', ''), $title);
        $lines[] = '';
        $lines[] = $outro !== '' ? $outro : 'از همراهی شما سپاسگزاریم. 🙏';

        return mb_substr(implode("\n", $lines), 0, 3900);
    }

    private function renderTemplate(string $template, string $title): string
    {
        return str_replace('{title}', $title, $template);
    }

    /**
     * Publish the results summary of a closed survey: a branded PNG card when
     * image generation is possible, otherwise the plain-text summary.
     *
     * @return array{ok: bool, message: string, mode: string}
     */
    public function publishSummary(Survey $survey): array
    {
        $cardPath = null;
        $imageEnabled = (string) Setting::get('eitaa_summary_image', '1') !== '0';

        if ($imageEnabled) {
            $cardPath = app(EitaaCardGenerator::class)->generate($survey);
        }

        if ($cardPath !== null) {
            $result = $this->publishPhoto($cardPath, 'نتایج نظرسنجی: '.$survey->title);
            @unlink($cardPath);

            return [...$result, 'mode' => 'image'];
        }

        $result = $this->publish($this->summaryFor($survey));

        return [...$result, 'mode' => 'text'];
    }

    /** @return array{ok: bool, message: string} */
    public function publishPhoto(string $path, string $caption = ''): array
    {
        $token = Setting::getSecret('eitaa_bot_token');
        $channel = (string) Setting::get('eitaa_channel_id', '');

        if (blank($token) || blank($channel)) {
            return ['ok' => false, 'message' => 'اتصال ایتا هنوز تنظیم نشده است. ابتدا در تنظیمات سایت، بخش «اتصال به کانال ایتا» را کامل کنید.'];
        }

        if (! is_file($path)) {
            return ['ok' => false, 'message' => 'ساخت کارت جمع‌بندی ناموفق بود.'];
        }

        try {
            $response = Http::timeout(30)
                ->attach('photo', fopen($path, 'r'), basename($path))
                ->post('https://eitaayar.ir/api/'.$token.'/sendPhoto', [
                    'chat_id' => $channel,
                    'caption' => $caption,
                ]);

            $payload = $response->json();
            if ($response->failed() || (is_array($payload) && ($payload['ok'] ?? false) === false)) {
                $detail = is_array($payload) ? ($payload['description'] ?? '') : '';

                return ['ok' => false, 'message' => 'ارسال تصویر به کانال ایتا ناموفق بود.'.($detail ? ' ('.$detail.')' : '')];
            }

            return ['ok' => true, 'message' => 'کارت جمع‌بندی با موفقیت در کانال ایتا منتشر شد.'];
        } catch (Throwable $exception) {
            report($exception);

            return ['ok' => false, 'message' => 'ارسال تصویر به کانال ایتا ناموفق بود: '.$exception->getMessage()];
        }
    }
}
