<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EitaaCampaign extends Model
{
    public const STATUSES = ['draft', 'scheduled', 'running', 'paused', 'completed', 'failed', 'cancelled'];

    protected $table = 'eitaa_campaigns';

    protected $fillable = [
        'bot_id', 'name', 'description', 'message_body', 'status', 'audience_type',
        'audience_filters', 'template_id', 'scheduled_at', 'rate_limit_per_minute',
        'max_retries', 'total_targets', 'sent_count', 'failed_count', 'started_at', 'completed_at',
    ];

    protected $casts = [
        'audience_filters' => 'array', 'scheduled_at' => 'datetime',
        'started_at' => 'datetime', 'completed_at' => 'datetime',
        'rate_limit_per_minute' => 'integer', 'max_retries' => 'integer',
        'total_targets' => 'integer', 'sent_count' => 'integer', 'failed_count' => 'integer',
    ];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(EitaaBot::class, 'bot_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(EitaaTemplate::class, 'template_id');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(EitaaCampaignTarget::class, 'campaign_id');
    }
}
