<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserOnboardingProfile extends Model
{
    protected $fillable = [
        'user_id',
        'audience',
        'child_age',
        'grade',
        'primary_goal',
        'current_need',
        'interests',
        'answers',
        'recommendation_snapshot',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'interests' => 'array',
            'answers' => 'array',
            'recommendation_snapshot' => 'array',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }
}
