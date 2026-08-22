<?php

namespace App\Support;

use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class InstructorScope
{
    public static function courses(User $user): Builder
    {
        $user->loadMissing('instructor');

        return Course::query()->where(function (Builder $query) use ($user): void {
            $query->where('instructor_id', $user->id)
                ->orWhereHas('instructor', fn ($instructor) => $instructor->where('user_id', $user->id));

            if ($user->instructor?->id) {
                $query->orWhere('instructor_id', $user->instructor->id);
            }
        });
    }
}
