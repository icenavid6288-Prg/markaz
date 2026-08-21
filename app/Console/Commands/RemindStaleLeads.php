<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\Setting;
use App\Services\Sms\SmsSender;
use Illuminate\Console\Command;
use Throwable;

class RemindStaleLeads extends Command
{
    protected $signature = 'crm:remind-stale-leads {--dry : فقط شمارش، بدون ارسال}';

    protected $description = 'لیدهای بی‌پاسخ را در دو مرحله با پیامک پیگیری می‌کند';

    public function handle(SmsSender $sms): int
    {
        if (! $this->isTruthy(Setting::get('lead_reminder_enabled', false))) {
            $this->info('یادآوری لیدهای بی‌پاسخ در تنظیمات غیرفعال است.');

            return self::SUCCESS;
        }

        // The legacy settings remain supported so existing installations keep
        // working while the admin can migrate to the separate two-step fields.
        $firstEnabled = $this->settingBool('lead_reminder_first_enabled', true);
        $firstDays = $this->settingInt('lead_reminder_first_days', 'lead_reminder_days', 7);
        $firstCooldownDays = $this->settingInt('lead_reminder_first_cooldown_days', 'lead_reminder_cooldown_days', 7);
        $firstMessage = $this->settingString('lead_reminder_first_sms_message', 'lead_reminder_sms_message', '');

        $secondEnabled = $this->settingBool('lead_reminder_second_enabled', true);
        $secondDays = $this->settingInt('lead_reminder_second_days', null, 14);
        $secondCooldownDays = $this->settingInt('lead_reminder_second_cooldown_days', null, 7);
        $secondMessage = (string) Setting::get(
            'lead_reminder_second_sms_message',
            '{name} عزیز، هنوز فرصت شروع مسیر رشد فرزندتان را دارید. برای شما یک پیشنهاد ویژه و مشاوره رایگان آماده کرده‌ایم: {site_name}'
        );

        $candidates = Lead::query()
            ->with('user')
            ->whereNot('status', 'customer')
            ->whereNotNull('phone')
            ->where('last_activity_at', '<=', now()->subDays(min($firstDays, $secondDays)))
            ->whereIn('reminder_stage', [0, 1])
            ->get();

        if ($candidates->isEmpty()) {
            $this->info('لید بی‌پاسخی برای یادآوری پیدا نشد.');

            return self::SUCCESS;
        }

        $sent = 0;
        $skipped = 0;

        foreach ($candidates as $lead) {
            try {
                if ($lead->user && $lead->user->hasAnyRole(['super_admin', 'admin', 'editor', 'instructor', 'coach'])) {
                    $skipped++;
                    continue;
                }

                $stage = (int) $lead->reminder_stage;
                $ageDays = $lead->last_activity_at?->diffInDays(now()) ?? 0;
                $cooldownDays = $stage === 0 ? $firstCooldownDays : $secondCooldownDays;
                $eligible = $stage === 0
                    ? $firstEnabled && $ageDays >= $firstDays
                    : $secondEnabled && $ageDays >= $secondDays;

                if (! $eligible || ($lead->last_reminded_at && $lead->last_reminded_at->gt(now()->subDays($cooldownDays)))) {
                    continue;
                }

                $message = $stage === 0 ? $firstMessage : $secondMessage;
                if ($message === '') {
                    $this->warn("متن پیامک مرحله ".($stage + 1)." خالی است؛ لید {$lead->id} ارسال نشد.");
                    continue;
                }

                if ($this->option('dry')) {
                    $sent++;
                    continue;
                }

                $sms->send($lead->phone, strtr($message, [
                    '{name}' => $lead->name ?: 'دوست عزیز',
                    '{site_name}' => (string) config('app.name'),
                ]));

                $nextStage = $stage + 1;
                LeadActivity::create([
                    'lead_id' => $lead->id,
                    'user_id' => $lead->user_id,
                    'type' => 'reminder',
                    'description' => $nextStage === 1
                        ? 'پیامک اول یادآوری خودکار برای لید بی‌پاسخ'
                        : 'پیامک دوم پیگیری خودکار با پیشنهاد ویژه و مشاوره رایگان',
                ]);

                $lead->update([
                    'last_reminded_at' => now(),
                    'reminder_stage' => $nextStage,
                ]);
                $sent++;
            } catch (Throwable $exception) {
                $this->error("ارسال به لید {$lead->id} ناموفق بود: {$exception->getMessage()}");
            }
        }

        $this->info("{$sent} پیام یادآوری ارسال شد؛ {$skipped} لید به دلیل اتصال به کارکنان حذف شدند.");

        return self::SUCCESS;
    }

    private function settingBool(string $key, bool $default): bool
    {
        return $this->isTruthy(Setting::get($key, $default ? '1' : '0'));
    }

    private function settingInt(string $key, ?string $legacyKey, int $default): int
    {
        $value = Setting::get($key, null);
        if ($value === null && $legacyKey !== null) {
            $value = Setting::get($legacyKey, $default);
        }

        return max(1, min(60, (int) ($value ?? $default)));
    }

    private function settingString(string $key, ?string $legacyKey, string $default): string
    {
        $value = Setting::get($key, null);
        if ($value === null && $legacyKey !== null) {
            $value = Setting::get($legacyKey, $default);
        }

        return (string) ($value ?? $default);
    }

    private function isTruthy(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
