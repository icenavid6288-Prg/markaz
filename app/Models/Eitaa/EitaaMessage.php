<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EitaaMessage extends Model
{
    protected $table = 'eitaa_messages';

    protected $fillable = [
        'bot_id', 'target_id', 'campaign_id', 'direction', 'chat_id', 'external_message_id',
        'message_type', 'body', 'file_path', 'status', 'attempts', 'priority', 'available_at',
        'error_category', 'error', 'metadata', 'sent_at',
    ];

    protected $casts = [
        'attempts' => 'integer', 'priority' => 'integer', 'available_at' => 'integer',
        'metadata' => 'array', 'sent_at' => 'datetime',
    ];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(EitaaBot::class, 'bot_id');
    }

    public function target(): BelongsTo
    {
        return $this->belongsTo(EitaaTarget::class, 'target_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(EitaaCampaign::class, 'campaign_id');
    }

    /** Messages eligible for the worker right now (rate-limit spacing included). */
    public function scopeDispatchable(Builder $query, int $limit): Builder
    {
        return $query->where('status', 'queued')
            ->where(function (Builder $q) {
                $q->whereNull('available_at')->orWhere('available_at', '<=', time());
            })
            ->orderBy('priority')
            ->orderBy('id')
            ->limit($limit);
    }
}
