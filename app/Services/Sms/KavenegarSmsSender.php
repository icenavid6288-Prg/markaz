<?php

namespace App\Services\Sms;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class KavenegarSmsSender implements SmsSender
{
    public function __construct(private readonly string $keyPrefix = 'sms_kavenegar_')
    {
    }

    public function send(string $phone, string $message): void
    {
        $apiKey = (string) Setting::getSecret($this->keyPrefix.'api_key', '');
        if ($apiKey === '') {
            throw new RuntimeException('کلید API کاوه‌نگار در تنظیمات پیامک وارد نشده است.');
        }

        $response = Http::asForm()->timeout(15)->post("https://api.kavenegar.com/v1/{$apiKey}/sms/send.json", [
            'receptor' => $phone,
            'sender' => Setting::get($this->keyPrefix.'sender', ''),
            'message' => $message,
        ]);

        if ($response->failed() || data_get($response->json(), 'return.status', 200) >= 300) {
            throw new RuntimeException('ارسال پیامک از طریق کاوه‌نگار ناموفق بود.');
        }
    }

    public function sendOtp(string $phone, string $code): void
    {
        $this->send($phone, OtpMessage::compose($code));
    }

    public function checkConnection(): array
    {
        $apiKey = (string) Setting::getSecret($this->keyPrefix.'api_key', '');
        if ($apiKey === '') {
            return ['ok' => false, 'message' => 'کلید API کاوه‌نگار در تنظیمات پیامک وارد نشده است.'];
        }

        try {
            $response = Http::asForm()->timeout(15)->post("https://api.kavenegar.com/v1/{$apiKey}/account/info.json");
            $payload = $response->json();

            if ($response->failed() || data_get($payload, 'return.status', 200) >= 300) {
                $detail = (string) data_get($payload, 'return.message', 'پاسخ نامعتبر از سرویس');

                return ['ok' => false, 'message' => 'اتصال به کاوه‌نگار برقرار نیست: '.$detail];
            }

            $credit = data_get($payload, 'entries.credit');

            return ['ok' => true, 'message' => 'اتصال به کاوه‌نگار برقرار است.'.($credit !== null ? ' اعتبار باقی‌مانده: '.$credit.' ریال' : '')];
        } catch (Throwable $exception) {
            return ['ok' => false, 'message' => 'اتصال به کاوه‌نگار برقرار نیست: '.$exception->getMessage()];
        }
    }
}
