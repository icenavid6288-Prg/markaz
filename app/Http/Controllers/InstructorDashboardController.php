<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Submission;
use App\Support\InstructorScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructorDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $courses = InstructorScope::courses($user)->withCount(['lessons', 'enrollments'])->latest()->get();
        $courseIds = $courses->pluck('id');
        $learners = $courseIds->isEmpty() ? collect() : Enrollment::query()
            ->with(['user', 'course'])
            ->whereIn('course_id', $courseIds)
            ->latest('updated_at')
            ->limit(12)
            ->get();

        $submissions = $courseIds->isEmpty() ? collect() : Submission::query()
            ->with(['user:id,name', 'assignment:id,title,course_id,max_score,lesson_id', 'assignment.course:id,title'])
            ->whereHas('assignment', fn ($assignment) => $assignment->whereIn('course_id', $courseIds))
            ->latest('submitted_at')
            ->limit(20)
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
                'pending_submissions' => $submissions->where('status', 'submitted')->count(),
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
            'submissions' => $submissions->map(fn (Submission $submission) => [
                'id' => $submission->id,
                'assignment_id' => $submission->assignment_id,
                'student' => $submission->user?->name,
                'title' => $submission->assignment?->title,
                'course' => $submission->assignment?->course?->title,
                'content' => $submission->content,
                'attachment_url' => $submission->attachment ? route('learning.assignment.download', $submission) : null,
                'status' => $submission->status,
                'score' => $submission->score,
                'max_score' => (int) ($submission->assignment?->max_score ?? 100),
                'feedback' => $submission->feedback,
                'submitted_at' => $submission->submitted_at?->toISOString(),
            ])->values(),
        ]);
    }

    public function grade(Request $request, Submission $submission): RedirectResponse
    {
        $submission->loadMissing('assignment');
        abort_unless($submission->assignment, 404);
        abort_unless(InstructorScope::courses($request->user())->whereKey($submission->assignment->course_id)->exists(), 403);

        $validated = $request->validate([
            'score' => ['required', 'integer', 'min:0', 'max:'.$submission->assignment->max_score],
            'feedback' => ['nullable', 'string', 'max:2000'],
        ]);

        $submission->update([
            'score' => (int) $validated['score'],
            'feedback' => trim((string) ($validated['feedback'] ?? '')) ?: null,
            'status' => 'graded',
        ]);

        return back()->with('success', 'نمره تکلیف ثبت شد.');
    }
}
