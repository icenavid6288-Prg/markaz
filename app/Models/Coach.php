<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coach extends Model
{
    protected $fillable = [
        'user_id',
        'specialty',
        'bio',
        'experience_years',
        'hourly_rate',
        'rating',
        'is_featured',
        'is_available',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'is_available' => 'boolean',
            'rating' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(CoachingSession::class, 'coach_id', 'user_id');
    }

    public function availability(): HasMany
    {
        return $this->hasMany(CoachAvailability::class, 'coach_id', 'user_id');
    }
}
