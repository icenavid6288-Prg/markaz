<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;

class EitaaAiSetting extends Model
{
    protected $table = 'eitaa_ai_settings';

    protected $fillable = [
        'enabled', 'provider', 'api_key_credential_id', 'api_key_encrypted',
        'base_url', 'model', 'temperature', 'max_tokens', 'system_prompt',
    ];

    protected $casts = [
        'enabled' => 'boolean', 'temperature' => 'float', 'max_tokens' => 'integer',
    ];

    protected $hidden = ['api_key_encrypted'];

    public function setApiKey(?string $plain): void
    {
        $this->update(['api_key_encrypted' => filled($plain) ? encrypt($plain) : null]);
    }

    public function apiKey(): ?string
    {
        try {
            return filled($this->api_key_encrypted) ? decrypt($this->api_key_encrypted) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    public static function singleton(): self
    {
        return static::query()->first() ?? static::create();
    }
}
