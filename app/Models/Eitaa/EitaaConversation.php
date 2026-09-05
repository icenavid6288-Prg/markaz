<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EitaaConversation extends Model
{
    public const MODES = ['bot', 'human', 'closed'];

    protected $table = 'eitaa_conversations';

    protected $fillable = ['bot_id', 'target_id', 'external_chat_id', 'title', 'mode', 'unread_count', 'last_message_at', 'metadata'];

    protected $casts = ['unread_count' => 'integer', 'last_message_at' => 'datetime', 'metadata' => 'array'];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(EitaaBot::class, 'bot_id');
    }

    public function target(): BelongsTo
    {
        return $this->belongsTo(EitaaTarget::class, 'target_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(EitaaMessage::class, 'chat_id', 'external_chat_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(EitaaInboundEvent::class, 'bot_id', 'bot_id');
    }
}
