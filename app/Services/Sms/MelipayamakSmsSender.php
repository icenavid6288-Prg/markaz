<?php

namespace App\Services\Sms;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class MelipayamakSmsSender implements SmsSender
{
    public function __construct(private readonly string $keyPrefix = 'sms_melipayamak_')
    {
    }

    public function send(string $phone, string $message): void
    {
        $username = (string) Setting::getSecret($this->keyPrefix.'username', '');
        $password = $this->apiPassword();
        $sender = (string) Setting::get($this->keyPrefix.'sender', '');
        if ($username === '' || $password === '' || $sender === '') {
            throw new RuntimeException('نام کاربری، رمز عبور/کلید API و شماره فرستنده ملی‌پیامک را وارد کنید.');
        }

        $response = Http::asForm()->timeout(15)->post('https://rest.payamak-panel.com/api/SendSMS/SendSMS', [
            'username' => $username,
            'password' => $password,
            'to' => $phone,
            'from' => $sender,
            'text' => $message,
            'isflash' => 'false',
        ]);
        $body = trim((string) $response->body());

        if ($response->failed() || ! $this->isSuccessfulResponse($body)) {
            throw new RuntimeException('ارسال پیامک از طریق ملی‌پیامک ناموفق بود: '.$this->translateError($body));
        }
    }

    /**
     * Send a one-time code. When a pattern (پترن / bodyId) is configured in
     * the panel, the code is delivered through the pattern API as the first
     * variable ({0}). Service lines (5000xxxx) cannot send free text, so they
     * require a pattern; credit lines fall back to a free-text message.
     */
    public function sendOtp(string $phone, string $code): void
    {
        $bodyId = trim((string) Setting::get($this->keyPrefix.'pattern', ''));
        if ($bodyId === '') {
            // Service lines (5000xxxx) only deliver through pre-approved patterns;
            // free text is rejected by the provider, so surface an actionable hint
            // instead of a cryptic error. Credit/promotional lines keep the fallback.
            $sender = (string) Setting::get($this->keyPrefix.'sender', '');
            if (str_starts_with($sender, '5000')) {
                throw new RuntimeException('شماره فرستنده 5000xxxx یک «خط خدماتی» است و فقط از طریق الگو (پترن) ارسال می‌کند؛ شناسه الگو را در تنظیمات پیامک وارد کنید.');
            }

            $this->send($phone, OtpMessage::compose($code));

            return;
        }

        if (! ctype_digit($bodyId)) {
            throw new RuntimeException('شناسه الگو (پترن) ملی‌پیامک باید عددی باشد؛ آن را از پنل ملی‌پیامک کپی کنید.');
        }

        $this->sendByPattern($phone, [$code], $bodyId);
    }

    /**
     * Send via a pre-approved pattern (BaseServiceNumber). The pattern text
     * lives in the Melipayamak panel and uses numbered variables; the values
     * are joined with ';' in the order the variables appear in the pattern.
     */
    private function sendByPattern(string $phone, array $values, string $bodyId): void
    {
        $username = (string) Setting::getSecret($this->keyPrefix.'username', '');
        $password = $this->apiPassword();
        if ($username === '' || $password === '') {
            throw new RuntimeException('نام کاربری و رمز عبور/کلید API ملی‌پیامک را وارد کنید.');
        }

        $response = Http::asForm()->timeout(15)->post('https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber', [
            'username' => $username,
            'password' => $password,
            'to' => $phone,
            'bodyId' => $bodyId,
            'text' => implode(';', $values),
        ]);
        $body = trim((string) $response->body());

        if ($response->failed() || ! $this->isSuccessfulResponse($body)) {
            throw new RuntimeException('ارسال پیامک الگو از طریق ملی‌پیامک ناموفق بود: '.$this->translateError($body));
        }
    }

    public function checkConnection(): array
    {
        $username = (string) Setting::getSecret($this->keyPrefix.'username', '');
        $password = $this->apiPassword();
        if ($username === '') {
            return ['ok' => false, 'message' => 'نام کاربری ملی‌پیامک در تنظیمات وارد نشده است.'];
        }
        if ($password === '') {
            return ['ok' => false, 'message' => 'رمز عبور یا کلید API ملی‌پیامک در تنظیمات وارد نشده است.'];
        }

        try {
            $response = Http::asForm()->timeout(15)->post('https://rest.payamak-panel.com/api/SendSMS/GetCredit', [
                'username' => $username,
                'password' => $password,
            ]);
            $body = trim((string) $response->body());

            if ($response->failed() || ! $this->isSuccessfulResponse($body)) {
                return ['ok' => false, 'message' => 'اتصال به ملی‌پیامک برقرار نیست: '.$this->translateError($body)];
            }

            // The REST API answers with JSON like {"Value":"5000","RetStatus":1,"StrRetStatus":"Ok"},
            // while older responses were a plain numeric credit. Both mean the credentials are valid.
            $data = json_decode($body, true);
            $value = is_array($data) ? (string) ($data['Value'] ?? '') : $body;

            return ['ok' => true, 'message' => 'اتصال به ملی‌پیامک برقرار است. اعتبار: '.($value !== '' ? $value : 'نامشخص')];
        } catch (Throwable $exception) {
            return ['ok' => false, 'message' => 'اتصال به ملی‌پیامک برقرار نیست: '.$exception->getMessage()];
        }
    }

    /**
     * The REST API answers with JSON like {"Value":"1500","RetStatus":1,"StrRetStatus":"Ok"},
     * while older responses were a plain numeric id/credit. Both mean success.
     */
    private function isSuccessfulResponse(string $body): bool
    {
        if (is_numeric($body)) {
            return true;
        }

        $data = json_decode($body, true);
        if (! is_array($data)) {
            return false;
        }

        return (string) ($data['RetStatus'] ?? '') === '1'
            || strtolower((string) ($data['StrRetStatus'] ?? '')) === 'ok';
    }

    /**
     * Accounts switched to the newer console auth require the ApiKey instead of the
     * panel password (the REST API reads it from the same "password" field). When an
     * ApiKey is configured it always wins over the legacy password.
     */
    private function apiPassword(): string
    {
        $apikey = (string) Setting::getSecret($this->keyPrefix.'apikey', '');
        if ($apikey !== '') {
            return $apikey;
        }

        return (string) Setting::getSecret($this->keyPrefix.'password', '');
    }

    /**
     * Maps the documented REST error codes to actionable Persian hints and falls
     * back to the raw body so real failures stay debuggable.
     */
    private function translateError(string $body): string
    {
        $data = json_decode($body, true);
        $value = is_array($data) ? (string) ($data['Value'] ?? '') : '';

        return match ($value) {
            '-110' => 'حساب شما در حالت «کلید API» است — کلید API را از کنسول ملی‌پیامک بگیرید و در فیلد «کلید API» تنظیمات وارد کنید.',
            '-109' => 'برای استفاده از API باید IP مجاز در پنل ملی‌پیامک تنظیم شود.',
            '-108' => 'IP شما به دلیل تلاش‌های ناموفق برای استفاده از API مسدود شده است؛ با پشتیبانی ملی‌پیامک تماس بگیرید.',
            '-10' => 'متن الگو حاوی لینک است؛ لینک را از متن الگو در پنل ملی‌پیامک حذف کنید.',
            '-7' => 'خطایی در شماره فرستنده رخ داده است؛ با پشتیبانی ملی‌پیامک تماس بگیرید.',
            '-6' => 'خطای داخلی سرویس ملی‌پیامک رخ داده است؛ کمی بعد دوباره تلاش کنید.',
            '-5' => 'مقادیر ارسالی با متغیرهای الگو همخوانی ندارد؛ الگو باید متغیر {0} برای کد تأیید داشته باشد.',
            '-4' => 'کد الگو (پترن) صحیح نیست یا توسط مدیر سامانه تأیید نشده است؛ شناسه الگو را از پنل ملی‌پیامک بررسی کنید.',
            '-3' => 'خط ارسالی در سیستم تعریف نشده است؛ با پشتیبانی ملی‌پیامک تماس بگیرید.',
            '-2' => 'در هر بار ارسال فقط یک شماره گیرنده مجاز است.',
            '-1' => 'دسترسی برای استفاده از این وب‌سرویس غیرفعال است؛ با پشتیبانی ملی‌پیامک تماس بگیرید.',
            '0' => 'نام کاربری یا رمز عبور صحیح نیست.',
            '2' => 'اعتبار کافی در پنل ملی‌پیامک وجود ندارد.',
            '6' => 'سامانه ملی‌پیامک در حال بروزرسانی است؛ کمی بعد دوباره تلاش کنید.',
            '7' => 'متن حاوی کلمه فیلترشده است؛ با واحد اداری ملی‌پیامک تماس بگیرید.',
            '11' => 'پیام ارسال نشد.',
            '16' => 'شماره گیرنده یافت نشد.',
            '17' => 'متن پیامک خالی است.',
            '18' => 'شماره گیرنده نامعتبر است.',
            '19' => 'از محدودیت ساعتی ارسال فراتر رفته‌اید؛ کمی بعد تلاش کنید.',
            default => $body !== '' ? $body : 'پاسخ نامعتبر از سرویس',
        };
    }
}
