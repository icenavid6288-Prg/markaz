<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CoachingSession extends Model
{
    protected $fillable = [
        'coach_id',
        'student_id',
        'scheduled_at',
        'duration_minutes',
        'status',
        'meeting_link',
        'price',
        'report',
        'notes',
        'rating',
        'cancelled_at',
        'cancel_reason',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'price' => 'integer',
        ];
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function reportEntry(): HasOne
    {
        return $this->hasOne(CoachingReport::class, 'session_id');
    }
}
