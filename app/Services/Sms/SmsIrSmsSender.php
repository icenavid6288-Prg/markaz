<?php

namespace App\Services\Sms;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class SmsIrSmsSender implements SmsSender
{
    public function __construct(private readonly string $keyPrefix = 'sms_ir_')
    {
    }

    public function send(string $phone, string $message): void
    {
        $apiKey = (string) Setting::getSecret($this->keyPrefix.'api_key', '');
        $lineNumber = (string) Setting::get($this->keyPrefix.'line_number', '');
        if ($apiKey === '' || $lineNumber === '') {
            throw new RuntimeException('API Key و شماره خط SMS.ir را در تنظیمات وارد کنید.');
        }

        $response = Http::withHeaders([
            'X-API-KEY' => $apiKey,
            'Accept' => 'text/plain',
        ])->timeout(15)->post('https://api.sms.ir/v1/send/bulk', [
            'lineNumber' => (int) $lineNumber,
            'messageText' => $message,
            'mobiles' => [$phone],
        ]);

        if ($response->failed() || data_get($response->json(), 'status', 1) === 0) {
            throw new RuntimeException('ارسال پیامک از طریق SMS.ir ناموفق بود.');
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
            return ['ok' => false, 'message' => 'API Key سرویس SMS.ir در تنظیمات پیامک وارد نشده است.'];
        }

        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $apiKey,
                'Accept' => 'application/json',
            ])->timeout(15)->get('https://api.sms.ir/v1/credit');
            $payload = $response->json();

            if ($response->failed() || data_get($payload, 'status', 0) !== 1) {
                $detail = (string) data_get($payload, 'message', 'پاسخ نامعتبر از سرویس');

                return ['ok' => false, 'message' => 'اتصال به SMS.ir برقرار نیست: '.$detail];
            }

            $credit = data_get($payload, 'data.credit') ?? data_get($payload, 'credit');

            return ['ok' => true, 'message' => 'اتصال به SMS.ir برقرار است.'.($credit !== null ? ' اعتبار: '.$credit : '')];
        } catch (Throwable $exception) {
            return ['ok' => false, 'message' => 'اتصال به SMS.ir برقرار نیست: '.$exception->getMessage()];
        }
    }
}
