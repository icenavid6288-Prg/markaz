<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $fillable = [
        'user_id',
        'parent_id',
        'grade',
        'school',
        'birth_date',
        'talents',
        'interests',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'talents' => 'array',
            'interests' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'user_id', 'user_id');
    }

    public function coachingSessions(): HasMany
    {
        return $this->hasMany(CoachingSession::class, 'student_id', 'user_id');
    }

    public function goals(): HasMany
    {
        return $this->hasMany(CoachingGoal::class, 'student_id', 'user_id');
    }
}
