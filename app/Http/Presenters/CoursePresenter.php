<?php

namespace App\Http\Presenters;

use App\Models\Course;

class CoursePresenter
{
    public static function payload(Course $course): array
    {
        return [
            'id' => $course->id,
            'title' => $course->title,
            'subtitle' => $course->subtitle,
            'slug' => $course->slug,
            'description' => $course->description,
            'thumbnail' => $course->thumbnail,
            'level' => $course->level,
            'price' => $course->price,
            'discount_price' => $course->discount_price,
            'duration_minutes' => $course->duration_minutes,
            'students_count' => $course->students_count,
            'rating_avg' => $course->rating_avg,
            'certificate_enabled' => $course->certificate_enabled,
            'is_in_person' => $course->is_in_person,
            'location' => $course->location,
            'schedule' => $course->schedule,
            'max_students' => $course->max_students,
            'in_person_description' => $course->in_person_description,
            'instructor' => $course->instructor ? [
                'id' => $course->instructor->id,
                'specialty' => $course->instructor->specialty,
                'bio' => $course->instructor->bio,
                'experience_years' => $course->instructor->experience_years,
                'user' => [
                    'name' => $course->instructor->user?->name,
                    'avatar' => $course->instructor->user?->avatar,
                ],
            ] : null,
            'category' => $course->category?->name,
        ];
    }
}
