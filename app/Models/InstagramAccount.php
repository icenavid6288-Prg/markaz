<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstagramAccount extends Model
{
    protected $fillable = [
        'name', 'instagram_user_id', 'username', 'profile_picture_url', 'access_token',
        'token_expires_at', 'scopes', 'status', 'last_connected_at', 'last_sync_at',
        'last_error', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'token_expires_at' => 'datetime',
            'scopes' => 'array',
            'last_connected_at' => 'datetime',
            'last_sync_at' => 'datetime',
            'metadata' => 'array',
        ];
    }
}
