<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstagramConversation extends Model
{
    protected $fillable = [
        'external_id', 'channel', 'participant_id', 'participant_username', 'lead_id',
        'instagram_account_id', 'assigned_to', 'status', 'unread_count', 'last_message_at',
        'last_inbound_at', 'last_outbound_at', 'last_error', 'tags', 'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array', 'tags' => 'array', 'last_message_at' => 'datetime',
            'last_inbound_at' => 'datetime', 'last_outbound_at' => 'datetime',
        ];
    }

    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
    public function account(): BelongsTo { return $this->belongsTo(InstagramAccount::class, 'instagram_account_id'); }
    public function assignee(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to'); }
    public function messages(): HasMany { return $this->hasMany(InstagramMessage::class, 'conversation_id')->latest(); }
}
