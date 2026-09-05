<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EitaaAutoReply extends Model
{
    protected $table = 'eitaa_auto_replies';

    protected $fillable = ['bot_id', 'name', 'trigger_type', 'keyword', 'response', 'priority', 'is_active', 'hit_count'];

    protected $casts = ['priority' => 'integer', 'is_active' => 'boolean', 'hit_count' => 'integer'];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(EitaaBot::class, 'bot_id');
    }
}
