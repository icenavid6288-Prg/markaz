<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CoachingGoal extends Model
{
    protected $fillable = [
        'student_id',
        'coach_id',
        'title',
        'description',
        'status',
        'due_date',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(CoachingTask::class, 'goal_id');
    }
}
