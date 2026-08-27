<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\CoachingGoal;
use App\Models\CoachingSession;
use App\Models\Enrollment;
use App\Models\QuizAttempt;
use App\Models\Student;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParentDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $children = Student::query()
            ->with('user:id,name,avatar')
            ->where('parent_id', $user->id)
            ->orderBy('user_id')
            ->get();

        $payload = $children->map(fn (Student $student) => $this->childSummary($student))->values();

        return Inertia::render('Parent/Dashboard', [
            'profile' => ['name' => $user->name, 'relation' => $user->parentProfile?->relation],
            'children' => $payload,
            'stats' => [
                'children_count' => $payload->count(),
                'courses_count' => (int) $payload->sum('stats.courses'),
                'average_progress' => $payload->isNotEmpty() ? (int) round($payload->avg('stats.average_progress')) : 0,
                'pending_assignments' => (int) $payload->sum('stats.pending_assignments'),
                'certificates' => (int) $payload->sum('stats.certificates'),
                'upcoming_sessions' => (int) $payload->sum('stats.upcoming_sessions'),
            ],
        ]);
    }

    public function linkChild(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'grade' => ['nullable', 'string', 'max:50'],
            'school' => ['nullable', 'string', 'max:120'],
        ]);

        $child = User::query()->where('phone', $validated['phone'])->where('is_active', true)->first();
        if (! $child) {
            return back()->withErrors(['phone' => 'حسابی با این شماره پیدا نشد. ابتدا فرزند باید در سایت ثبت‌نام کند.']);
        }
        abort_if($child->id === $request->user()->id, 422, 'نمی‌توانید حساب خودتان را به‌عنوان فرزند متصل کنید.');

        $existing = Student::query()->where('user_id', $child->id)->first();
        if ($existing && $existing->parent_id !== $request->user()->id) {
            return back()->withErrors(['phone' => 'این حساب قبلاً به والد دیگری متصل شده است.']);
        }

        if (! $child->hasRole('student')) {
            $child->assignRole('student');
        }

        Student::updateOrCreate(
            ['user_id' => $child->id],
            [
                'parent_id' => $request->user()->id,
                'grade' => $validated['grade'] ?? $existing?->grade,
                'school' => $validated['school'] ?? $existing?->school,
            ],
        );

        return back()->with('success', 'فرزند به حساب شما متصل شد.');
    }

    public function show(Request $request, Student $student): Response
    {
        abort_unless($student->parent_id === $request->user()->id, 403);

        $enrollments = Enrollment::query()
            ->with('course:id,title,slug,thumbnail,duration_minutes,certificate_enabled')
            ->where('user_id', $student->user_id)
            ->latest('updated_at')
            ->get();

        $certificates = Certificate::query()
            ->with('course:id,title')
            ->where('user_id', $student->user_id)
            ->latest('issued_at')
            ->get();

        $submissions = Submission::query()
            ->with(['assignment.course:id,title', 'assignment.lesson:id,title'])
            ->where('user_id', $student->user_id)
            ->latest('submitted_at')
            ->limit(30)
            ->get();

        $attempts = QuizAttempt::query()
            ->with(['quiz.course:id,title', 'quiz.lesson:id,title'])
            ->where('user_id', $student->user_id)
            ->latest('submitted_at')
            ->limit(30)
            ->get();

        $sessions = CoachingSession::query()
            ->with('coach:id,name')
            ->where('student_id', $student->user_id)
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->orderBy('scheduled_at')
            ->limit(20)
            ->get();

        $goals = CoachingGoal::query()
            ->withCount(['tasks as total_tasks'])
            ->withCount(['tasks as completed_tasks' => fn ($query) => $query->where('status', 'done')])
            ->where('student_id', $student->user_id)
            ->orderByRaw("CASE status WHEN 'in_progress' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END")
            ->orderBy('due_date')
            ->limit(20)
            ->get();

        $pendingAssignments = $submissions->where('status', 'submitted')->count();
        $averageProgress = $enrollments->isNotEmpty() ? (int) round($enrollments->avg('progress_percent')) : 0;
        $completedCourses = $enrollments->where('status', 'completed')->count();

        return Inertia::render('Parent/ChildReport', [
            'child' => [
                'id' => $student->id,
                'name' => $student->user?->name,
                'avatar' => $student->user?->avatar,
                'grade' => $student->grade,
                'school' => $student->school,
                'birth_date' => $student->birth_date?->toISOString(),
                'talents' => $student->talents ?? [],
                'interests' => $student->interests ?? [],
                'stats' => [
                    'courses' => $enrollments->count(),
                    'completed_courses' => $completedCourses,
                    'average_progress' => $averageProgress,
                    'pending_assignments' => $pendingAssignments,
                    'certificates' => $certificates->count(),
                    'upcoming_sessions' => $sessions->whereIn('status', ['pending', 'confirmed'])->count(),
                    'active_goals' => $goals->whereIn('status', ['pending', 'in_progress'])->count(),
                ],
                'courses' => $enrollments->map(fn (Enrollment $enrollment) => [
                    'id' => $enrollment->id,
                    'title' => $enrollment->course?->title,
                    'slug' => $enrollment->course?->slug,
                    'thumbnail' => $enrollment->course?->thumbnail,
                    'duration_minutes' => $enrollment->course?->duration_minutes,
                    'progress_percent' => (int) $enrollment->progress_percent,
                    'status' => $enrollment->status,
                    'completed_at' => $enrollment->completed_at?->toISOString(),
                    'certificate' => $certificates->firstWhere('course_id', $enrollment->course_id) ? [
                        'number' => $certificates->firstWhere('course_id', $enrollment->course_id)->certificate_number,
                        'url' => route('certificates.show', $certificates->firstWhere('course_id', $enrollment->course_id)),
                    ] : null,
                ])->values(),
                'assignments' => $submissions->map(fn (Submission $submission) => [
                    'id' => $submission->id,
                    'course' => $submission->assignment?->course?->title,
                    'lesson' => $submission->assignment?->lesson?->title,
                    'title' => $submission->assignment?->title,
                    'status' => $submission->status,
                    'score' => $submission->score,
                    'max_score' => $submission->assignment?->max_score,
                    'feedback' => $submission->feedback,
                    'submitted_at' => $submission->submitted_at?->toISOString(),
                ])->values(),
                'quizzes' => $attempts->map(fn (QuizAttempt $attempt) => [
                    'id' => $attempt->id,
                    'course' => $attempt->quiz?->course?->title,
                    'lesson' => $attempt->quiz?->lesson?->title,
                    'title' => $attempt->quiz?->title,
                    'score' => (int) $attempt->score,
                    'passed' => (bool) $attempt->passed,
                    'submitted_at' => $attempt->submitted_at?->toISOString(),
                ])->values(),
                'sessions' => $sessions->map(fn (CoachingSession $session) => [
                    'id' => $session->id,
                    'coach' => $session->coach?->name,
                    'scheduled_at' => $session->scheduled_at?->toISOString(),
                    'duration_minutes' => $session->duration_minutes,
                    'status' => $session->status,
                ])->values(),
                'goals' => $goals->map(fn (CoachingGoal $goal) => [
                    'id' => $goal->id,
                    'title' => $goal->title,
                    'status' => $goal->status,
                    'due_date' => $goal->due_date?->toISOString(),
                    'total_tasks' => (int) $goal->total_tasks,
                    'completed_tasks' => (int) $goal->completed_tasks,
                ])->values(),
                'certificates' => $certificates->map(fn (Certificate $certificate) => [
                    'id' => $certificate->id,
                    'number' => $certificate->certificate_number,
                    'issued_at' => $certificate->issued_at?->toISOString(),
                    'course' => $certificate->course?->title,
                    'url' => route('certificates.show', $certificate),
                ])->values(),
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function childSummary(Student $student): array
    {
        $enrollments = Enrollment::query()->where('user_id', $student->user_id)->get();
        $pendingAssignments = Submission::query()->where('user_id', $student->user_id)->where('status', 'submitted')->count();
        $certificates = Certificate::query()->where('user_id', $student->user_id)->count();
        $upcomingSessions = CoachingSession::query()->where('student_id', $student->user_id)->whereIn('status', ['pending', 'confirmed'])->count();
        $activeGoals = CoachingGoal::query()->where('student_id', $student->user_id)->whereIn('status', ['pending', 'in_progress'])->count();

        return [
            'id' => $student->id,
            'name' => $student->user?->name,
            'avatar' => $student->user?->avatar,
            'grade' => $student->grade,
            'school' => $student->school,
            'stats' => [
                'courses' => $enrollments->count(),
                'average_progress' => $enrollments->isNotEmpty() ? (int) round($enrollments->avg('progress_percent')) : 0,
                'pending_assignments' => $pendingAssignments,
                'certificates' => $certificates,
                'upcoming_sessions' => $upcomingSessions,
                'active_goals' => $activeGoals,
            ],
            'url' => route('panel.parent.children.show', $student),
        ];
    }
}
