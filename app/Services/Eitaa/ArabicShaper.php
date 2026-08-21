<?php

namespace App\Services\Eitaa;

/**
 * Converts Persian/Arabic text into presentation forms so PHP GD
 * (which does not do OpenType shaping) renders joined, connected script.
 *
 * Shaping is applied per word (a word boundary breaks joining), and the
 * shaped word is reversed into visual order for GD's left-to-right drawing.
 * Pure-Latin or digit-only words are left untouched so numbers keep their order.
 */
class ArabicShaper
{
    /** @var array<int, int[]> base codepoint => [isolated, final, initial, medial] */
    private const FORMS = [
        0x0621 => [0xFE80],
        0x0622 => [0xFE81, 0xFE82],
        0x0623 => [0xFE83, 0xFE84],
        0x0624 => [0xFE85, 0xFE86],
        0x0625 => [0xFE87, 0xFE88],
        0x0626 => [0xFE89, 0xFE8A, 0xFE8B, 0xFE8C],
        0x0627 => [0xFE8D, 0xFE8E],
        0x0628 => [0xFE8F, 0xFE90, 0xFE91, 0xFE92],
        0x0629 => [0xFE93, 0xFE94],
        0x062A => [0xFE95, 0xFE96, 0xFE97, 0xFE98],
        0x062B => [0xFE99, 0xFE9A, 0xFE9B, 0xFE9C],
        0x062C => [0xFE9D, 0xFE9E, 0xFE9F, 0xFEA0],
        0x062D => [0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4],
        0x062E => [0xFEA5, 0xFEA6, 0xFEA7, 0xFEA8],
        0x062F => [0xFEA9, 0xFEAA],
        0x0630 => [0xFEAB, 0xFEAC],
        0x0631 => [0xFEAD, 0xFEAE],
        0x0632 => [0xFEAF, 0xFEB0],
        0x0633 => [0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4],
        0x0634 => [0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8],
        0x0635 => [0xFEB9, 0xFEBA, 0xFEBB, 0xFEBC],
        0x0636 => [0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0],
        0x0637 => [0xFEC1, 0xFEC2, 0xFEC3, 0xFEC4],
        0x0638 => [0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8],
        0x0639 => [0xFEC9, 0xFECA, 0xFECB, 0xFECC],
        0x063A => [0xFECD, 0xFECE, 0xFECF, 0xFED0],
        0x0641 => [0xFED1, 0xFED2, 0xFED3, 0xFED4],
        0x0642 => [0xFED5, 0xFED6, 0xFED7, 0xFED8],
        0x0643 => [0xFED9, 0xFEDA, 0xFEDB, 0xFEDC],
        0x0644 => [0xFEDD, 0xFEDE, 0xFEDF, 0xFEE0],
        0x0645 => [0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4],
        0x0646 => [0xFEE5, 0xFEE6, 0xFEE7, 0xFEE8],
        0x0647 => [0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC],
        0x0648 => [0xFEED, 0xFEEE],
        0x0649 => [0xFEEF, 0xFEF0],
        0x064A => [0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4],
        0x067E => [0xFB56, 0xFB57, 0xFB58, 0xFB59], // پ
        0x0686 => [0xFB7A, 0xFB7B, 0xFB7C, 0xFB7D], // چ
        0x0698 => [0xFB8A, 0xFB8B], // ژ
        0x06A9 => [0xFB8E, 0xFB8F, 0xFB90, 0xFB91], // ک
        0x06AF => [0xFB92, 0xFB93, 0xFB94, 0xFB95], // گ
        0x06BE => [0xFBAA, 0xFBAB, 0xFBAC, 0xFBAD], // ھ
        0x06CC => [0xFBFC, 0xFBFD, 0xFBFE, 0xFBFF], // ی
    ];

    /** @var array<int, int[]> lam(0644) + alef variant => [isolated, final] ligatures */
    private const LAM_ALEF = [
        0x0622 => [0xFEF5, 0xFEF6],
        0x0623 => [0xFEF7, 0xFEF8],
        0x0625 => [0xFEF9, 0xFEFA],
        0x0627 => [0xFEFB, 0xFEFC],
    ];

    /**
     * Shape a single word for GD rendering (joins letters and reverses into visual order).
     */
    public static function render(string $word): string
    {
        $word = str_replace(["\u{200C}", "\u{200D}"], '', $word);
        $codepoints = self::toCodepoints($word);

        // Only words that actually contain Arabic/Persian letters are shaped
        // and reversed; digit-only words (even Persian digits) keep their order.
        $hasArabic = false;
        foreach ($codepoints as $cp) {
            if (isset(self::FORMS[$cp])) {
                $hasArabic = true;
                break;
            }
        }
        if (! $hasArabic) {
            return $word;
        }

        $count = count($codepoints);
        $shaped = [];
        for ($i = 0; $i < $count; $i++) {
            $current = $codepoints[$i];

            // Lam-alef ligature.
            if ($current === 0x0644 && $i + 1 < $count && isset(self::LAM_ALEF[$codepoints[$i + 1]])) {
                $forms = self::LAM_ALEF[$codepoints[$i + 1]];
                $prevJoins = $i > 0 && self::isDual($codepoints[$i - 1]);
                $shaped[] = $prevJoins ? $forms[1] : $forms[0];
                $i++;
                continue;
            }

            if (! isset(self::FORMS[$current])) {
                $shaped[] = $current;
                continue;
            }

            $prev = $i > 0 ? $codepoints[$i - 1] : null;
            $prevJoins = $prev !== null && self::isDual($prev);
            $currentDual = count(self::FORMS[$current]) === 4;

            $forms = self::FORMS[$current];
            if ($prevJoins && $currentDual) {
                $shaped[] = $forms[3]; // medial
            } elseif ($prevJoins) {
                $shaped[] = $forms[1]; // final
            } elseif ($currentDual) {
                $shaped[] = $forms[2]; // initial
            } else {
                $shaped[] = $forms[0]; // isolated
            }
        }

        return self::fromCodepoints(array_reverse($shaped));
    }

    private static function isDual(int $codepoint): bool
    {
        return isset(self::FORMS[$codepoint]) && count(self::FORMS[$codepoint]) === 4;
    }

    /** @return int[] */
    private static function toCodepoints(string $text): array
    {
        $codepoints = [];
        $length = strlen($text);
        for ($i = 0; $i < $length;) {
            $code = ord($text[$i]);
            if ($code < 0x80) {
                $codepoints[] = $code;
                $i++;
            } elseif (($code & 0xE0) === 0xC0) {
                $codepoints[] = (($code & 0x1F) << 6) | (ord($text[$i + 1]) & 0x3F);
                $i += 2;
            } elseif (($code & 0xF0) === 0xE0) {
                $codepoints[] = (($code & 0x0F) << 12) | ((ord($text[$i + 1]) & 0x3F) << 6) | (ord($text[$i + 2]) & 0x3F);
                $i += 3;
            } elseif (($code & 0xF8) === 0xF0) {
                $codepoints[] = (($code & 0x07) << 18) | ((ord($text[$i + 1]) & 0x3F) << 12) | ((ord($text[$i + 2]) & 0x3F) << 6) | (ord($text[$i + 3]) & 0x3F);
                $i += 4;
            } else {
                $codepoints[] = $code;
                $i++;
            }
        }

        return $codepoints;
    }

    /** @param int[] $codepoints */
    private static function fromCodepoints(array $codepoints): string
    {
        $result = '';
        foreach ($codepoints as $cp) {
            if ($cp < 0x80) {
                $result .= chr($cp);
            } elseif ($cp < 0x800) {
                $result .= chr(0xC0 | ($cp >> 6)).chr(0x80 | ($cp & 0x3F));
            } elseif ($cp < 0x10000) {
                $result .= chr(0xE0 | ($cp >> 12)).chr(0x80 | (($cp >> 6) & 0x3F)).chr(0x80 | ($cp & 0x3F));
            } else {
                $result .= chr(0xF0 | ($cp >> 18)).chr(0x80 | (($cp >> 12) & 0x3F)).chr(0x80 | (($cp >> 6) & 0x3F)).chr(0x80 | ($cp & 0x3F));
            }
        }

        return $result;
    }
}
