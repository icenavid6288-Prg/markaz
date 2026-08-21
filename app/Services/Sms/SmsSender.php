<?php

namespace App\Services\Sms;

interface SmsSender
{
    /**
     * Send a text message to the given phone number.
     */
    public function send(string $phone, string $message): void;

    /**
     * Send a one-time login/verification code to the given phone number.
     *
     * Providers that support pattern (template) SMS send the code as the
     * first pattern variable ({0}) instead of a free-text message.
     */
    public function sendOtp(string $phone, string $code): void;

    /**
     * Verify connectivity with the SMS provider WITHOUT sending any message.
     *
     * @return array{ok: bool, message: string}
     */
    public function checkConnection(): array;
}
