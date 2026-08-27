<?php

namespace App\Services\Sms;

use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class ConfiguredSmsSender implements SmsSender
{
    public function __construct(
        private readonly LogSmsSender $log,
        private readonly KavenegarSmsSender $kavenegar,
        private readonly SmsIrSmsSender $smsIr,
        private readonly MelipayamakSmsSender $melipayamak,
    ) {
    }

    public function send(string $phone, string $message): void
    {
        $driver = (string) Setting::get('sms_driver', 'log');
        $backupDriver = (string) Setting::get('sms_backup_driver', '');

        if ($driver === 'log' && $backupDriver === '') {
            $this->log->send($phone, $message);

            return;
        }

        if (! $this->isTruthy(Setting::get('sms_enabled', false))) {
            throw new RuntimeException('ارسال پیامک در تنظیمات غیرفعال است.');
        }

        try {
            $this->sendVia($driver, $phone, $message);
            Log::info('[SMS] message sent', ['driver' => $driver, 'phone' => substr($phone, 0, 4).'****']);

            return;
        } catch (Throwable $primaryException) {
            // If no backup panel is configured, surface the primary error.
            if ($backupDriver === '' || $backupDriver === 'log' || $backupDriver === $driver) {
                throw $primaryException;
            }

            Log::warning('[SMS] primary panel failed, switching to backup', [
                'primary' => $driver,
                'backup' => $backupDriver,
                'phone' => substr($phone, 0, 4).'****',
                'error' => $primaryException->getMessage(),
            ]);
        }

        try {
            $this->sendVia($backupDriver, $phone, $message, true);
            Log::info('[SMS] message sent via backup panel', ['driver' => $backupDriver, 'phone' => substr($phone, 0, 4).'****']);
        } catch (Throwable $backupException) {
            throw new RuntimeException(
                'ارسال پیامک از هر دو پنل ناموفق بود. (اصلی: '.$primaryException->getMessage().' — پشتیبان: '.$backupException->getMessage().')'
            );
        }
    }

    public function sendOtp(string $phone, string $code): void
    {
        $driver = (string) Setting::get('sms_driver', 'log');
        $backupDriver = (string) Setting::get('sms_backup_driver', '');

        if ($driver === 'log' && $backupDriver === '') {
            $this->log->sendOtp($phone, $code);

            return;
        }

        if (! $this->isTruthy(Setting::get('sms_enabled', false))) {
            throw new RuntimeException('ارسال پیامک در تنظیمات غیرفعال است.');
        }

        try {
            $this->sendOtpVia($driver, $phone, $code);
            Log::info('[SMS] OTP sent', ['driver' => $driver, 'phone' => substr($phone, 0, 4).'****']);

            return;
        } catch (Throwable $primaryException) {
            // If no backup panel is configured, surface the primary error.
            if ($backupDriver === '' || $backupDriver === 'log' || $backupDriver === $driver) {
                throw $primaryException;
            }

            Log::warning('[SMS] primary panel failed, switching to backup for OTP', [
                'primary' => $driver,
                'backup' => $backupDriver,
                'phone' => substr($phone, 0, 4).'****',
                'error' => $primaryException->getMessage(),
            ]);
        }

        try {
            $this->sendOtpVia($backupDriver, $phone, $code, true);
            Log::info('[SMS] OTP sent via backup panel', ['driver' => $backupDriver, 'phone' => substr($phone, 0, 4).'****']);
        } catch (Throwable $backupException) {
            throw new RuntimeException(
                'ارسال پیامک از هر دو پنل ناموفق بود. (اصلی: '.$primaryException->getMessage().' — پشتیبان: '.$backupException->getMessage().')'
            );
        }
    }

    public function checkConnection(): array
    {
        $driver = (string) Setting::get('sms_driver', 'log');
        $backupDriver = (string) Setting::get('sms_backup_driver', '');

        if ($driver === 'log' && $backupDriver === '') {
            return ['ok' => true, 'message' => 'درایور فعلی «لاگ» (توسعه) است؛ اتصال همیشه برقرار است.'];
        }

        $primary = $this->checkVia($driver);
        if ($backupDriver === '' || $backupDriver === 'log' || $backupDriver === $driver) {
            return $primary;
        }

        $backup = $this->checkVia($backupDriver, true);
        if ($primary['ok'] && $backup['ok']) {
            return ['ok' => true, 'message' => 'پنل اصلی: '.$primary['message'].' — پشتیبان: '.$backup['message']];
        }

        return ['ok' => false, 'message' => 'پنل اصلی: '.$primary['message'].' — پشتیبان: '.$backup['message']];
    }

    private function checkVia(string $driver, bool $backup = false): array
    {
        return match ($driver) {
            'log' => ['ok' => true, 'message' => 'درایور لاگ همیشه در دسترس است.'],
            'kavenegar' => ($backup ? new KavenegarSmsSender('sms_backup_kavenegar_') : $this->kavenegar)->checkConnection(),
            'smsir' => ($backup ? new SmsIrSmsSender('sms_backup_smsir_') : $this->smsIr)->checkConnection(),
            'melipayamak' => ($backup ? new MelipayamakSmsSender('sms_backup_melipayamak_') : $this->melipayamak)->checkConnection(),
            default => ['ok' => false, 'message' => "درایور پیامک «{$driver}» شناخته‌شده نیست."],
        };
    }

    private function sendVia(string $driver, string $phone, string $message, bool $backup = false): void
    {
        if ($driver === 'log') {
            $this->log->send($phone, $message);

            return;
        }

        match ($driver) {
            'kavenegar' => ($backup ? new KavenegarSmsSender('sms_backup_kavenegar_') : $this->kavenegar)->send($phone, $message),
            'smsir' => ($backup ? new SmsIrSmsSender('sms_backup_smsir_') : $this->smsIr)->send($phone, $message),
            'melipayamak' => ($backup ? new MelipayamakSmsSender('sms_backup_melipayamak_') : $this->melipayamak)->send($phone, $message),
            default => throw new RuntimeException("درایور پیامک «{$driver}» شناخته‌شده نیست."),
        };
    }

    private function sendOtpVia(string $driver, string $phone, string $code, bool $backup = false): void
    {
        if ($driver === 'log') {
            $this->log->sendOtp($phone, $code);

            return;
        }

        match ($driver) {
            'kavenegar' => ($backup ? new KavenegarSmsSender('sms_backup_kavenegar_') : $this->kavenegar)->sendOtp($phone, $code),
            'smsir' => ($backup ? new SmsIrSmsSender('sms_backup_smsir_') : $this->smsIr)->sendOtp($phone, $code),
            'melipayamak' => ($backup ? new MelipayamakSmsSender('sms_backup_melipayamak_') : $this->melipayamak)->sendOtp($phone, $code),
            default => throw new RuntimeException("درایور پیامک «{$driver}» شناخته‌شده نیست."),
        };
    }

    private function isTruthy(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
