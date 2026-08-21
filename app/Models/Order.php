<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'status',
        'subtotal',
        'discount',
        'coupon_id',
        'total',
        'payment_method',
        'paid_at',
        'reservation_expires_at',
        'billing',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'reservation_expires_at' => 'datetime',
            'billing' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public static function generateOrderNumber(): string
    {
        return 'SRD-'.now()->format('Ymd').'-'.strtoupper(substr(uniqid(), -6));
    }
}
