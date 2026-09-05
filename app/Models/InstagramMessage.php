<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstagramMessage extends Model
{
    protected $fillable = [
        'conversation_id', 'external_id', 'direction', 'message_type', 'body',
        'external_parent_id', 'sender_id', 'recipient_id', 'media_url', 'media_type',
        'status', 'error_code', 'error_message', 'provider_response', 'payload',
        'sent_at', 'delivered_at', 'read_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array', 'provider_response' => 'array',
            'sent_at' => 'datetime', 'delivered_at' => 'datetime', 'read_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo { return $this->belongsTo(InstagramConversation::class, 'conversation_id'); }
}
