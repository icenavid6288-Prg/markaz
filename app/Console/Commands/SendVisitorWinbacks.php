<?php

namespace App\Console\Commands;

use App\Models\Lead;
use App\Models\Order;
use App\Models\PageView;
use App\Models\Setting;
use App\Models\User;
use App\Models\VisitorWinback;
use App\Notifications\VisitorWinbackNotification;
use App\Services\Sms\SmsSender;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class SendVisitorWinbacks extends Command
{
    protected $signature = 'marketing:winback-visitors {--dry : فقط شمارش، بدون ارسال}';

    protected $description = 'بازدیدکنندگانی که مطالب سایت را دیده‌اند اما اقدامی (خرید/لید) نداشته‌اند را با پیامک و اعلان پیگیری می‌کند';

    public function handle(SmsSender $sms): int
    {
        if (! $this->isTruthy(Setting::get('winback_enabled', false))) {
            $this->info('پیگیری بازدیدکنندگان در تنظیمات غیرفعال است.');

            return self::SUCCESS;
        }

        $days = max(1, min(60, (int) Setting::get('winback_days', 3)));
        $minPages = max(1, (int) Setting::get('winback_min_pages', 3));
        $cooldownDays = max(1, (int) Setting::get('winback_cooldown_days', 14));
        $smsMessage = (string) Setting::get('winback_sms_message', '');
        $notificationMessage = (string) Setting::get('winback_notification_message', '');

        $since = now()->subDays($days);
        $cooldownSince = now()->subDays($cooldownDays);

        $candidates = DB::table('page_views')
            ->join('users', 'users.id', '=', 'page_views.user_id')
            ->where('page_views.visited_at', '>=', $since)
            ->where('users.is_active', true)
            ->whereNotNull('users.phone')
            ->where(function ($query): void {
                foreach (['%/courses%', '%/shop%', '%/services%', '%/blog%', '%/coaching%', '%/products%'] as $pattern) {
                    $query->orWhere('page_views.url', 'like', $pattern);
                }
            })
            ->groupBy('page_views.user_id')
            ->havingRaw('COUNT(DISTINCT page_views.url) >= ?', [$minPages])
            ->pluck('page_views.user_id');

        if ($candidates->isEmpty()) {
            $this->info('بازدیدکننده‌ای برای پیگیری پیدا نشد.');

            return self::SUCCESS;
        }

        $sent = 0;
        $skipped = 0;

        foreach ($candidates as $userId) {
            try {
                $user = User::query()->with('roles')->find($userId);
                if (! $user) {
                    continue;
                }

                // Already messaged within the cooldown window.
                $alreadySent = VisitorWinback::query()
                    ->where('user_id', $user->id)
                    ->where('sent_at', '>=', $cooldownSince)
                    ->exists();
                if ($alreadySent) {
                    $skipped++;

                    continue;
                }

                // Has bought something, or is a staff member.
                $hasPaidOrder = Order::query()->where('user_id', $user->id)->where('status', 'paid')->exists();
                $isStaff = $user->hasAnyRole(['super_admin', 'admin', 'editor', 'instructor', 'coach']);
                if ($hasPaidOrder || $isStaff) {
                    $skipped++;

                    continue;
                }

                // Already a lead being followed up.
                $hasLead = Lead::query()->where('phone', $user->phone)->whereNotIn('status', ['customer'])->exists();
                if ($hasLead) {
                    $skipped++;

                    continue;
                }

                if ($this->option('dry')) {
                    $sent++;

                    continue;
                }

                DB::transaction(function () use ($user, $smsMessage, $notificationMessage, $sms) {
                    if ($smsMessage !== '') {
                        $sms->send($user->phone, strtr($smsMessage, ['{name}' => $user->name ?: 'دوست عزیز', '{site_name}' => (string) config('app.name')]));
                        VisitorWinback::create(['user_id' => $user->id, 'phone' => $user->phone, 'channel' => 'sms', 'sent_at' => now()]);
                    }
                    if ($notificationMessage !== '') {
                        $user->notify(new VisitorWinbackNotification(strtr($notificationMessage, ['{name}' => $user->name ?: 'دوست عزیز', '{site_name}' => (string) config('app.name')])));
                        VisitorWinback::create(['user_id' => $user->id, 'phone' => $user->phone, 'channel' => 'in_app', 'sent_at' => now()]);
                    }
                });

                $sent++;
            } catch (Throwable $exception) {
                $this->error("ارسال به کاربر {$userId} ناموفق بود: {$exception->getMessage()}");
            }
        }

        $this->info("{$sent} کاربر پیگیری شد؛ {$skipped} کاربر به دلیل خرید/لید/پیگیری قبلی حذف شدند.");

        return self::SUCCESS;
    }

    private function isTruthy(mixed $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}
