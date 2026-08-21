<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingConsent extends Model
{
    protected $fillable = [
        'user_id', 'phone', 'email', 'sms', 'email_marketing', 'in_app', 'consented_at', 'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'sms' => 'boolean',
            'email_marketing' => 'boolean',
            'in_app' => 'boolean',
            'consented_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
