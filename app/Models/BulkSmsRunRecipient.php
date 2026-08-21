<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BulkSmsRunRecipient extends Model
{
    protected $fillable = ['run_id', 'name', 'phone', 'status', 'error', 'sent_at'];

    protected function casts(): array
    {
        return ['sent_at' => 'datetime'];
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(BulkSmsRun::class, 'run_id');
    }
}
