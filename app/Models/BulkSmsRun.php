<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BulkSmsRun extends Model
{
    protected $fillable = [
        'message', 'recipients_count', 'sent_count', 'failed_count',
        'status', 'started_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(BulkSmsRunRecipient::class, 'run_id');
    }
}
