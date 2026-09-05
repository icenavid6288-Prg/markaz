<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'max_uses',
        'used_count',
        'min_order',
        'expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function isValid(int $subtotal = 0): bool
    {
        $active = filter_var($this->getAttribute('is_active'), FILTER_VALIDATE_BOOLEAN);
        $maxUses = $this->getAttribute('max_uses');
        $usedCount = (int) ($this->getAttribute('used_count') ?? 0);
        $minOrder = (int) ($this->getAttribute('min_order') ?? 0);
        // Admins leave "حداکثر استفاده" empty (saved as 0) to mean unlimited.
        $hasUsageLimit = $maxUses !== null && (int) $maxUses > 0;
        $expiresAt = $this->expires_at;
        // Shared-host MySQL databases often contain legacy zero dates for an
        // empty datetime field. They mean "no expiry", not "already expired".
        if ($expiresAt && ($expiresAt->year < 2000 || $expiresAt->format('Y-m-d') === '0000-00-00')) {
            $expiresAt = null;
        }

        return $active
            && (! $hasUsageLimit || $usedCount < (int) $maxUses)
            && ($expiresAt === null || $expiresAt->isFuture())
            && $subtotal >= $minOrder;
    }

    public function discountFor(int $subtotal): int
    {
        $value = max(0, (int) $this->value);

        return $this->type === 'percent'
            ? min($subtotal, (int) round($subtotal * min($value, 100) / 100))
            : min($value, $subtotal);
    }
}
