<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachingReport extends Model
{
    protected $fillable = [
        'session_id',
        'coach_id',
        'student_id',
        'content',
        'next_steps',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(CoachingSession::class, 'session_id');
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
