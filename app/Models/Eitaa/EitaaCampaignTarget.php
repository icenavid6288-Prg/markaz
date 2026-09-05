<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EitaaCampaignTarget extends Model
{
    protected $table = 'eitaa_campaign_targets';

    protected $fillable = ['campaign_id', 'target_id', 'status', 'message_id', 'attempts', 'error', 'sent_at'];

    protected $casts = ['attempts' => 'integer', 'sent_at' => 'datetime'];
}
