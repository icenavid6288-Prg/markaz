<?php

namespace App\Services\Eitaa;

use App\Models\Setting;
use App\Models\Survey;
use Illuminate\Support\Str;
use Throwable;

/**
 * Renders a branded results card (PNG) with PHP GD + the bundled Vazirmatn
 * font. Persian text is shaped with ArabicShaper. Returns null when GD or the
 * fonts are unavailable, so callers can fall back to a plain-text summary.
 */
class EitaaCardGenerator
{
    private const WIDTH = 1080;
    private const MARGIN = 76;
    private const MAX_HEIGHT = 2800;

    public function generate(Survey $survey): ?string
    {
        if (! extension_loaded('gd') || ! function_exists('imagettftext')) {
            return null;
        }

        $regular = resource_path('fonts/Vazirmatn-Regular.ttf');
        $bold = resource_path('fonts/Vazirmatn-Bold.ttf');
        if (! is_file($regular) || ! is_file($bold)) {
            return null;
        }

        try {
            $survey->loadMissing(['questions', 'responses']);
            $stats = $this->questionStats($survey);
            $total = $survey->responses->count();
            $siteName = (string) Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی');
            $contentWidth = self::WIDTH - self::MARGIN * 2;

            $titleLines = $this->wrap($survey->title, $bold, 54, $contentWidth);
            $intro = $this->renderTemplate((string) $survey->setting('summary_intro', ''), $survey->title);
            $introLines = $intro !== '' ? $this->wrap($intro, $regular, 30, $contentWidth) : [];
            $outro = $this->renderTemplate((string) $survey->setting('summary_outro', ''), $survey->title);
            $footerText = $outro !== '' ? $outro : 'با تشکر از همراهی شما';
            $footerLines = $this->wrap($footerText, $regular, 30, $contentWidth);

            // ---- measure height ----
            $height = 120;
            $height += 46 + 10;              // site name
            $height += 74;                   // chip
            $height += count($titleLines) * 84 + 12;
            $height += count($introLines) * 48 + 16; // intro text
            $height += 60 + 30;              // stats line
            $questionsUsed = [];
            foreach ($stats as $question) {
                $qHeight = count($this->wrap($question['title'], $bold, 38, $contentWidth)) * 60;
                $lineCount = 0;
                foreach ($question['lines'] as $line) {
                    $lineCount += count($this->wrap($line, $regular, 32, $contentWidth));
                }
                $qHeight += $lineCount * 50 + 16;
                if ($height + $qHeight + 220 > self::MAX_HEIGHT) {
                    break;
                }
                $height += $qHeight;
                $questionsUsed[] = $question;
            }
            $height += 40 + count($footerLines) * 48 + 90; // footer + bottom padding

            // ---- create canvas with brand gradient ----
            $image = imagecreatetruecolor(self::WIDTH, $height);
            imagealphablending($image, true);
            imagesavealpha($image, true);

            $top = [12, 59, 46];
            $bottom = [22, 84, 62];
            for ($y = 0; $y < $height; $y++) {
                $t = $height > 1 ? $y / ($height - 1) : 0;
                $color = imagecolorallocate($image,
                    (int) round($top[0] + ($bottom[0] - $top[0]) * $t),
                    (int) round($top[1] + ($bottom[1] - $top[1]) * $t),
                    (int) round($top[2] + ($bottom[2] - $top[2]) * $t));
                imageline($image, 0, $y, self::WIDTH, $y, $color);
            }

            $white = imagecolorallocate($image, 255, 255, 255);
            $gold = imagecolorallocate($image, 233, 200, 122);
            $muted = imagecolorallocate($image, 197, 226, 212);
            $chipBg = imagecolorallocatealpha($image, 255, 255, 255, 26);
            $divider = imagecolorallocatealpha($image, 255, 255, 255, 45);

            $xRight = self::WIDTH - self::MARGIN;
            $y = 120;

            // site name
            $this->drawRtl($image, $bold, 30, $gold, $xRight, $y + 30, $siteName);
            $y += 46 + 10;

            // results chip (centered)
            $chipText = 'نتایج نظرسنجی';
            $chipW = (int) $this->lineWidth($chipText, $bold, 26) + 64;
            $chipX1 = (int) (self::WIDTH - $chipW) / 2;
            $chipY1 = $y;
            $this->roundedRect($image, $chipX1, $chipY1, $chipX1 + $chipW, $chipY1 + 58, 29, $chipBg);
            $this->drawRtlCentered($image, $bold, 26, $gold, $chipY1 + 40, $chipText, $chipX1, $chipX1 + $chipW);
            $y += 58 + 16;

            // title
            foreach ($titleLines as $line) {
                $this->drawRtl($image, $bold, 54, $white, $xRight, $y + 54, $line);
                $y += 84;
            }
            $y += 12;

            // intro text
            foreach ($introLines as $line) {
                $this->drawRtl($image, $regular, 30, $muted, $xRight, $y + 30, $line);
                $y += 48;
            }
            $y += 16;

            // stats
            $this->drawRtl($image, $bold, 38, $gold, $xRight, $y + 38, 'مجموع پاسخ‌ها: '.$total);
            $y += 60 + 30;

            // questions
            foreach ($questionsUsed as $question) {
                foreach ($this->wrap($question['title'], $bold, 38, $contentWidth) as $line) {
                    $this->drawRtl($image, $bold, 38, $white, $xRight, $y + 38, $line);
                    $y += 60;
                }
                foreach ($question['lines'] as $line) {
                    foreach ($this->wrap($line, $regular, 32, $contentWidth) as $wrapped) {
                        $this->drawRtl($image, $regular, 32, $white, $xRight, $y + 32, $wrapped);
                        $y += 50;
                    }
                }
                $y += 16;
            }

            // footer
            $y += 30;
            imageline($image, self::MARGIN, $y, $xRight, $y, $divider);
            $y += 40;
            foreach ($footerLines as $line) {
                $this->drawRtl($image, $regular, 30, $muted, $xRight, $y + 30, $line);
                $y += 48;
            }

            // ---- save ----
            $directory = storage_path('app/eitaa-cards');
            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            $path = $directory.'/card-'.$survey->share_token.'-'.Str::random(8).'.png';
            imagepng($image, $path);
            imagedestroy($image);

            return $path;
        } catch (Throwable $exception) {
            report($exception);

            return null;
        }
    }

    /** @return array<int, array{title: string, lines: string[]}> */
    private function questionStats(Survey $survey): array
    {
        $responses = $survey->responses;
        $stats = [];

        foreach ($survey->questions->filter(fn ($question) => $question->include_in_summary !== false) as $question) {
            $answers = $responses->map(fn ($response) => $response->answersForQuestions($survey->questions))->filter();
            $key = (string) $question->id;
            $lines = [];

            if (in_array($question->type, ['single', 'multiple', 'yes_no'], true)) {
                $counts = [];
                $filled = 0;
                foreach ($answers as $set) {
                    $value = $set[$key] ?? null;
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
                    $lines[] = 'بدون پاسخ';
                } else {
                    arsort($counts);
                    foreach ($counts as $option => $count) {
                        $percent = $filled > 0 ? round($count / $filled * 100) : 0;
                        $lines[] = $option.' — '.$count.' ('.$percent.'%)';
                    }
                }
            } elseif ($question->type === 'rating') {
                $values = [];
                foreach ($answers as $set) {
                    $value = $set[$key] ?? null;
                    if ($value === null || $value === '' || ! is_numeric($value)) {
                        continue;
                    }
                    $values[] = (float) $value;
                }
                $lines[] = $values === []
                    ? 'بدون پاسخ'
                    : 'میانگین: '.number_format(array_sum($values) / count($values), 1).' از ۵';
            } else {
                $filled = 0;
                foreach ($answers as $set) {
                    $value = $set[$key] ?? null;
                    if ($value !== null && $value !== '') {
                        $filled++;
                    }
                }
                $lines[] = 'تعداد پاسخ: '.$filled;
            }

            $stats[] = ['title' => $question->title, 'lines' => $lines];
        }

        return $stats;
    }

    private function renderTemplate(string $template, string $title): string
    {
        return str_replace('{title}', $title, $template);
    }

    /**
     * Draw an RTL line right-aligned at $xRight (baseline at $baseline).
     * Each word is shaped independently and laid out right-to-left.
     */
    private function drawRtl(\GdImage $image, string $font, int $size, int $color, int $xRight, int $baseline, string $text): void
    {
        $words = preg_split('/\s+/u', trim($text)) ?: [];
        $space = $this->textWidth(' ', $font, $size);
        $x = $xRight;

        foreach ($words as $word) {
            $rendered = ArabicShaper::render($word);
            $width = $this->textWidth($rendered, $font, $size);
            $x -= $width;
            imagettftext($image, $size, 0, (int) round($x), $baseline, $color, $font, $rendered);
            $x -= $space;
        }
    }

    private function drawRtlCentered(\GdImage $image, string $font, int $size, int $color, int $baseline, string $text, int $x1, int $x2): void
    {
        $center = ($x1 + $x2) / 2;
        $width = $this->lineWidth($text, $font, $size);
        $this->drawRtl($image, $font, $size, $color, (int) round($center + $width / 2), $baseline, $text);
    }

    /** @return string[] */
    private function wrap(string $text, string $font, int $size, int $maxWidth): array
    {
        $words = preg_split('/\s+/u', trim($text)) ?: [];
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            $candidate = $current === '' ? $word : $current.' '.$word;
            if ($current === '' || $this->lineWidth($candidate, $font, $size) <= $maxWidth) {
                $current = $candidate;
            } else {
                $lines[] = $current;
                $current = $word;
            }
        }
        if ($current !== '') {
            $lines[] = $current;
        }

        return $lines === [] ? [''] : $lines;
    }

    private function lineWidth(string $text, string $font, int $size): float
    {
        $words = preg_split('/\s+/u', trim($text)) ?: [];
        $total = 0.0;
        foreach ($words as $word) {
            $total += $this->textWidth(ArabicShaper::render($word), $font, $size);
        }
        if (count($words) > 1) {
            $total += $this->textWidth(' ', $font, $size) * (count($words) - 1);
        }

        return $total;
    }

    private function textWidth(string $text, string $font, int $size): float
    {
        $bbox = imagettfbbox($size, 0, $font, $text);
        $minX = min($bbox[0], $bbox[6]);
        $maxX = max($bbox[2], $bbox[4]);

        return max(0.0, $maxX - $minX);
    }

    private function roundedRect(\GdImage $image, int $x1, int $y1, int $x2, int $y2, int $radius, int $color): void
    {
        $radius = max(0, min($radius, (int) (($y2 - $y1) / 2), (int) (($x2 - $x1) / 2)));
        imagefilledrectangle($image, $x1 + $radius, $y1, $x2 - $radius, $y2, $color);
        imagefilledrectangle($image, $x1, $y1 + $radius, $x2, $y2 - $radius, $color);
        imagefilledarc($image, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, 180, 270, $color, IMG_ARC_PIE);
        imagefilledarc($image, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, 270, 360, $color, IMG_ARC_PIE);
        imagefilledarc($image, $x2 - $radius, $y2 - $radius, $radius * 2, $radius * 2, 0, 90, $color, IMG_ARC_PIE);
        imagefilledarc($image, $x1 + $radius, $y2 - $radius, $radius * 2, $radius * 2, 90, 180, $color, IMG_ARC_PIE);
    }
}
