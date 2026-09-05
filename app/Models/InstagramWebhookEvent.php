<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstagramWebhookEvent extends Model
{
    protected $fillable = ['external_id', 'object', 'payload', 'processed_at', 'error'];

    protected function casts(): array
    {
        return ['payload' => 'array', 'processed_at' => 'datetime'];
    }
}
