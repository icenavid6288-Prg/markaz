<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;

/**
 * Development driver that writes messages to the log instead of
 * dispatching a real SMS. Swap with a gateway driver (e.g. Kavenegar,
 * SMS.ir, Melipayamak) when credentials are available.
 */
class LogSmsSender implements SmsSender
{
    public function send(string $phone, string $message): void
    {
        Log::info("[SMS][{$phone}] {$message}");
    }

    public function sendOtp(string $phone, string $code): void
    {
        $this->send($phone, OtpMessage::compose($code));
    }

    public function checkConnection(): array
    {
        return ['ok' => true, 'message' => 'درایور فعلی «لاگ» (توسعه) است؛ اتصال همیشه برقرار است.'];
    }
}
