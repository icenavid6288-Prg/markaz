<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EitaaTarget extends Model
{
    protected $table = 'eitaa_targets';

    protected $fillable = [
        'bot_id', 'chat_id', 'title', 'type', 'status', 'opt_in_status',
        'member_count', 'tags', 'last_send_at', 'last_error_at', 'last_error',
    ];

    protected $casts = [
        'tags' => 'array', 'member_count' => 'integer',
        'last_send_at' => 'datetime', 'last_error_at' => 'datetime',
    ];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(EitaaBot::class, 'bot_id');
    }

    public function campaignTargets(): HasMany
    {
        return $this->hasMany(EitaaCampaignTarget::class);
    }
}
