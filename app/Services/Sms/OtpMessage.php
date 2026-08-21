<?php

namespace App\Services\Sms;

use App\Models\Setting;

/**
 * Composes the one-time-code SMS text from the configurable template.
 *
 * The template accepts both the named {code} placeholder and the numeric
 * {0} placeholder used by pattern-based panels (e.g. Melipayamak), so the
 * admin can write either form and it still gets replaced with the real code.
 */
final class OtpMessage
{
    public static function compose(string $code): string
    {
        $template = (string) Setting::get('sms_otp_message', 'کد تأیید شما در مرکز رشد و کارآفرینی دکتر بیدی: {code}');

        return strtr($template, [
            '{code}' => $code,
            '{0}' => $code,
        ]);
    }
}
