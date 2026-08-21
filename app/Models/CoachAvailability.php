<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CoachAvailability extends Model
{
    protected $table = 'coach_availability';

    protected $fillable = [
        'coach_id',
        'available_date',
        'start_time',
        'end_time',
        'is_booked',
        'series_id',
    ];

    protected function casts(): array
    {
        return [
            'available_date' => 'date',
            'is_booked' => 'boolean',
        ];
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coach_id');
    }
}
