<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EitaaInboundEvent extends Model
{
    protected $table = 'eitaa_inbound_events';

    protected $fillable = ['bot_id', 'external_update_id', 'object', 'payload', 'status', 'error', 'processed_at'];

    protected $casts = ['payload' => 'array', 'processed_at' => 'datetime'];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(EitaaBot::class, 'bot_id');
    }
}
