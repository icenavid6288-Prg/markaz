<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EitaaBot extends Model
{
    protected $table = 'eitaa_bots';

    protected $fillable = [
        'name', 'access_token_encrypted', 'username', 'bot_id', 'status', 'is_active',
        'test_mode', 'rate_limit_per_minute', 'last_connected_at', 'last_message_at', 'last_error', 'metadata',
    ];

    protected $casts = [
        'is_active' => 'boolean', 'test_mode' => 'boolean',
        'last_connected_at' => 'datetime', 'last_message_at' => 'datetime', 'metadata' => 'array',
    ];

    protected $hidden = ['access_token_encrypted'];

    public function targets(): HasMany
    {
        return $this->hasMany(EitaaTarget::class, 'bot_id');
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(EitaaCampaign::class, 'bot_id');
    }

    public function setAccessToken(?string $plain): void
    {
        $this->update(['access_token_encrypted' => filled($plain) ? encrypt($plain) : null]);
    }

    public function accessToken(): ?string
    {
        try {
            return filled($this->access_token_encrypted) ? decrypt($this->access_token_encrypted) : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
