<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstagramAutomationRun extends Model
{
    protected $fillable = ['automation_id', 'conversation_id', 'message_id', 'status', 'input', 'output', 'error', 'executed_at'];

    protected function casts(): array
    {
        return ['input' => 'array', 'output' => 'array', 'executed_at' => 'datetime'];
    }

    public function automation(): BelongsTo { return $this->belongsTo(InstagramAutomation::class); }
    public function conversation(): BelongsTo { return $this->belongsTo(InstagramConversation::class); }
    public function message(): BelongsTo { return $this->belongsTo(InstagramMessage::class); }
}
