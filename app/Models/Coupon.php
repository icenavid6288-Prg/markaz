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
        return $this->is_active
            && ($this->max_uses === null || $this->used_count < $this->max_uses)
            && ($this->expires_at === null || $this->expires_at->isFuture())
            && $subtotal >= $this->min_order;
    }

    public function discountFor(int $subtotal): int
    {
        return $this->type === 'percent'
            ? (int) round($subtotal * $this->value / 100)
            : min($this->value, $subtotal);
    }
}
