<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructorDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $courses = Course::query()
            ->withCount(['lessons', 'enrollments'])
            ->where(fn ($query) => $query
                ->where('instructor_id', $user->id)
                ->orWhereHas('instructor', fn ($instructor) => $instructor->where('user_id', $user->id)))
            ->latest()
            ->get();
        $courseIds = $courses->pluck('id');
        $learners = $courseIds->isEmpty() ? collect() : Enrollment::query()
            ->with(['user', 'course'])
            ->whereIn('course_id', $courseIds)
            ->latest('updated_at')
            ->limit(12)
            ->get();

        return Inertia::render('Instructor/Dashboard', [
            'profile' => [
                'name' => $user->name,
                'avatar' => $user->avatar,
                'bio' => $user->bio,
                'instructor' => $user->instructor ? [
                    'specialty' => $user->instructor->specialty,
                    'experience_years' => $user->instructor->experience_years,
                ] : null,
            ],
            'stats' => [
                'courses' => $courses->count(),
                'published_courses' => $courses->where('is_published', true)->count(),
                'learners' => $courseIds->isEmpty() ? 0 : Enrollment::whereIn('course_id', $courseIds)->distinct('user_id')->count('user_id'),
                'lessons' => $courseIds->isEmpty() ? 0 : Lesson::whereIn('course_id', $courseIds)->count(),
            ],
            'courses' => $courses->map(fn ($course) => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
                'is_published' => $course->is_published,
                'students_count' => $course->students_count,
                'lessons_count' => $course->lessons_count,
                'enrollments_count' => $course->enrollments_count,
                'rating_avg' => $course->rating_avg,
            ])->values(),
            'learners' => $learners->map(fn ($enrollment) => [
                'id' => $enrollment->id,
                'name' => $enrollment->user?->name,
                'course' => $enrollment->course?->title,
                'progress_percent' => (int) $enrollment->progress_percent,
                'status' => $enrollment->status,
            ])->values(),
        ]);
    }
}
