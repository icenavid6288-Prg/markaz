<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Lead extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'child_age',
        'grade',
        'need',
        'service_type',
        'source',
        'status',
        'assigned_to',
        'notes',
        'tags',
        'last_activity_at',
        'last_reminded_at',
        'reminder_stage',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'last_activity_at' => 'datetime',
            'last_reminded_at' => 'datetime',
            'reminder_stage' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(LeadActivity::class)->latest();
    }

    /**
     * امتیاز منبع — منابع با نیت خرید بالاتر، امتیاز بیشتری می‌گیرند.
     */
    public static function sourceScore(?string $source): int
    {
        return match ($source) {
            'registration' => 20,
            'referral' => 18,
            'website' => 12,
            'instagram' => 10,
            'eitaa' => 8,
            default => 5,
        };
    }

    /**
     * امتیاز بازدید از صفحات قیمت (دوره‌ها، خدمات، چک‌اوت، سبد خرید).
     */
    public static function pricingScore(int $views): int
    {
        return match (true) {
            $views >= 3 => 25,
            $views === 2 => 20,
            $views === 1 => 15,
            default => 0,
        };
    }

    /**
     * امتیاز تازگی لید — هرچه لید جدیدتر باشد داغ‌تر است.
     */
    public static function ageScore(?Carbon $createdAt): int
    {
        if (! $createdAt) {
            return 0;
        }

        $days = max(0, (int) $createdAt->diffInDays(now()));

        return match (true) {
            $days <= 1 => 30,
            $days <= 3 => 24,
            $days <= 7 => 16,
            $days <= 14 => 10,
            $days <= 30 => 5,
            default => 0,
        };
    }

    /**
     * برچسب اولویت بر اساس امتیاز کل.
     */
    public static function scoreLabel(int $score): string
    {
        return match (true) {
            $score >= 70 => 'داغ',
            $score >= 45 => 'بالا',
            $score >= 25 => 'متوسط',
            default => 'کم',
        };
    }
}
