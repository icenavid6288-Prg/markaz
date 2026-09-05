<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EitaaNotification extends Model
{
    protected $table = 'eitaa_notifications';

    protected $fillable = ['bot_id', 'type', 'title', 'body', 'level', 'read_at', 'metadata'];

    protected $casts = ['read_at' => 'datetime', 'metadata' => 'array'];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(EitaaBot::class, 'bot_id');
    }
}
