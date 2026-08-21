<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Presenters\CoursePresenter;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Quiz;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructorController extends Controller
{
    public function show(Request $request, Instructor $instructor): Response
    {
        abort_unless($instructor->user?->is_active, 404);

        $avatarUrl = static function (?string $avatar): ?string {
            if (! $avatar) {
                return null;
            }

            return preg_match('/^https?:\\/\\//', $avatar) === 1
                ? $avatar
                : asset(ltrim($avatar, '/'));
        };

        // `courses.instructor_id` has historically referenced both the instructor's
        // own id and their user id — match either, same defensive check as the panel.
        $courses = Course::published()
            ->with(['category'])
            ->withCount(['lessons', 'enrollments'])
            ->where(function ($query) use ($instructor) {
                $query->where('instructor_id', $instructor->id);
                if ($instructor->user_id) {
                    $query->orWhere('instructor_id', $instructor->user_id);
                }
            })
            ->orderByDesc('is_featured')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        $courseIds = $courses->pluck('id');
        $quizzes = $courseIds->isEmpty() ? collect() : Quiz::query()
            ->withCount('questions')
            ->with(['course' => fn ($query) => $query->select('id', 'title', 'slug')])
            ->with(['lesson' => fn ($query) => $query->select('id', 'title', 'slug', 'course_id')])
            ->whereIn('course_id', $courseIds)
            ->orderBy('course_id')
            ->orderBy('id')
            ->get();

        $name = $instructor->user?->name ?? 'مدرس';
        $bio = $instructor->user?->bio ?: $instructor->bio;
        $avatar = $avatarUrl($instructor->user?->avatar);

        $seo = Seo::page(
            $request,
            "{$name} | مدرس مرکز رشد و کارآفرینی دکتر بیدی",
            $bio
                ?: "دوره‌ها و آزمون‌های {$name}؛ مدرس مهارت‌های آینده در مرکز رشد و کارآفرینی دکتر بیدی.",
            null,
            [
                '@type' => 'ProfilePage',
                'mainEntity' => [
                    '@type' => 'Person',
                    'name' => $name,
                    'url' => url('/instructors/'.$instructor->id),
                    'jobTitle' => $instructor->specialty,
                ],
            ],
            $avatar,
        );

        return Inertia::render('Instructors/Show', [
            'seo' => $seo,
            'instructor' => [
                'id' => $instructor->id,
                'name' => $name,
                'avatar' => $avatar,
                'specialty' => $instructor->specialty,
                'bio' => $bio,
                'experience_years' => $instructor->experience_years,
                'is_featured' => $instructor->is_featured,
            ],
            'stats' => [
                'courses' => $courses->count(),
                'lessons' => $courses->sum('lessons_count'),
                'students' => $courses->sum('students_count'),
                'quizzes' => $quizzes->count(),
            ],
            'courses' => $courses->map(fn (Course $course) => CoursePresenter::payload($course))->values(),
            'quizzes' => $quizzes->map(fn (Quiz $quiz) => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'passing_score' => $quiz->passing_score,
                'time_limit_minutes' => $quiz->time_limit_minutes,
                'questions_count' => $quiz->questions_count,
                'course' => $quiz->course ? [
                    'title' => $quiz->course->title,
                    'slug' => $quiz->course->slug,
                ] : null,
                'lesson' => $quiz->lesson ? [
                    'title' => $quiz->lesson->title,
                ] : null,
            ])->values(),
        ]);
    }
}
