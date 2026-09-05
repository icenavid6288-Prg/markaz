<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Bookmark;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Note;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class CoursePlayerController extends Controller
{
    public function show(Request $request, Course $course, ?Lesson $lesson = null): Response|\Illuminate\Http\RedirectResponse
    {
        $enrollment = $this->resolveEnrollment($request, $course);
        $preview = ! $enrollment->exists;
        $course->load(['modules.lessons.quiz.questions', 'modules.lessons.assignments']);
        $lessons = $course->modules->flatMap(fn ($module) => $module->lessons)->values();
        $current = $lesson && $lesson->course_id === $course->id ? $lesson : $lessons->first(fn (Lesson $item) => ! $preview || $item->is_free) ?? $lessons->first();
        abort_unless($current, 404);
        abort_if($preview && ! $current->is_free, 403, 'برای مشاهده این درس باید در دوره ثبت‌نام کنید.');

        $progress = LessonProgress::query()->where('user_id', $request->user()->id)->whereIn('lesson_id', $lessons->pluck('id'))->get()->keyBy('lesson_id');

        // Quiz attempts for this user across the course, keyed by quiz id, so
        // the payload and the gating can read the latest result without N+1s.
        $quizAttempts = collect();
        $quizIds = $lessons->filter(fn (Lesson $item) => filled($item->quiz))->pluck('quiz.id')->unique()->values();
        if ($quizIds->isNotEmpty()) {
            $quizAttempts = QuizAttempt::query()
                ->where('user_id', $request->user()->id)
                ->whereIn('quiz_id', $quizIds)
                ->get()
                ->groupBy('quiz_id');
        }

        // The student's submissions across the course, keyed by assignment id,
        // so the payload and gating can read the latest one without N+1s.
        $submissions = collect();
        $assignmentIds = $lessons->flatMap(fn (Lesson $item) => $item->assignments)->pluck('id')->unique()->values();
        if ($assignmentIds->isNotEmpty()) {
            $submissions = Submission::query()
                ->where('user_id', $request->user()->id)
                ->whereIn('assignment_id', $assignmentIds)
                ->get()
                ->groupBy('assignment_id');
        }

        // Sequential gating: a lesson is locked while any previous media lesson
        // (video / audio / podcast) is still uncompleted, any previous quiz
        // lesson has not been passed yet, or any previous assignment lesson has
        // not been submitted yet, so users cannot skip past content.
        $lockedMap = $preview
            ? $lessons->mapWithKeys(fn (Lesson $item) => [$item->id => ! $item->is_free])->all()
            : $this->lockedLessons($lessons, $progress, $quizAttempts, $submissions);

        // Redirect to the furthest unlocked lesson when the requested one is locked.
        if (($lockedMap[$current->id] ?? false) === true) {
            $unlocked = $lessons->first(fn (Lesson $item) => ! ($lockedMap[$item->id] ?? false));

            return redirect()->route('learning.player', ['course' => $course->slug, 'lesson' => $unlocked?->id ?? $lessons->first()->id]);
        }

        $certificate = null;
        if ($enrollment->exists && $enrollment->status === 'completed' && $course->certificate_enabled) {
            $certificate = Certificate::query()->where('user_id', $request->user()->id)->where('course_id', $course->id)->first();
        }

        $note = Note::query()->where('user_id', $request->user()->id)->where('lesson_id', $current->id)->first();
        $bookmarked = Bookmark::query()->where('user_id', $request->user()->id)->where('lesson_id', $current->id)->exists();

        return Inertia::render('Learning/Player', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'thumbnail' => $course->thumbnail,
                'is_in_person' => $course->is_in_person,
                'location' => $course->location,
                'schedule' => $course->schedule,
                'in_person_description' => $course->in_person_description,
            ],
            'enrollment' => [
                'preview' => $preview,
                'progress_percent' => (int) $enrollment->progress_percent,
                'certificate' => $certificate ? ['number' => $certificate->certificate_number, 'url' => route('certificates.show', $certificate)] : null,
            ],
            'lessons' => $course->modules->map(fn ($module) => [
                'id' => $module->id,
                'title' => $module->title,
                'lessons' => $module->lessons->map(fn ($item) => $this->lessonPayload($item, $progress->get($item->id), false, (bool) ($lockedMap[$item->id] ?? false), $quizAttempts, $submissions))->values(),
            ])->values(),
            'currentLesson' => $this->lessonPayload($current, $progress->get($current->id), true, (bool) ($lockedMap[$current->id] ?? false), $quizAttempts, $submissions),
            'note' => $note?->content,
            'bookmarked' => $bookmarked,
        ]);
    }

    public function progress(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $enrollment = $this->requireEnrollment($request, $course);
        abort_unless($lesson->course_id === $course->id, 404);
        abort_if(in_array($lesson->type, ['quiz', 'assignment'], true), 422, 'این درس فقط با آزمون یا تکلیف تکمیل می‌شود.');

        $validated = $request->validate(['progress_percent' => ['required', 'integer', 'min:0', 'max:100'], 'status' => ['nullable', 'in:started,completed']]);
        $status = ($validated['status'] ?? null) === 'completed' || (int) $validated['progress_percent'] === 100 ? 'completed' : 'started';
        LessonProgress::updateOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id],
            ['status' => $status, 'progress_percent' => (int) $validated['progress_percent'], 'completed_at' => $status === 'completed' ? now() : null],
        );

        $total = max(1, Lesson::where('course_id', $course->id)->count());
        $completed = LessonProgress::where('user_id', $request->user()->id)->whereIn('lesson_id', Lesson::where('course_id', $course->id)->pluck('id'))->where('status', 'completed')->count();
        $courseProgress = (int) round(($completed / $total) * 100);
        $enrollment->update(['progress_percent' => $courseProgress, 'status' => $courseProgress === 100 ? 'completed' : 'active', 'completed_at' => $courseProgress === 100 ? now() : null]);

        return back()->with('success', 'پیشرفت درس ذخیره شد.');
    }

    /**
     * Resolve the viewer's enrollment, or an unsaved model when they are not
     * enrolled yet (preview mode is signalled by ->exists === false).
     */
    private function resolveEnrollment(Request $request, Course $course): Enrollment
    {
        return Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->firstOrNew();
    }

    /**
     * Require a saved enrollment (progress actions) or bail out with 403.
     */
    private function requireEnrollment(Request $request, Course $course): Enrollment
    {
        $enrollment = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->first();

        abort_unless($enrollment, 403, 'برای این اقدام باید در دوره ثبت‌نام کنید.');

        return $enrollment;
    }

    /**
     * @param \Illuminate\Support\Collection<int, Lesson> $lessons
     * @param \Illuminate\Support\Collection<int, LessonProgress> $progress
     * @param \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, QuizAttempt>> $quizAttempts
     * @param \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, Submission>> $submissions
     * @return array<int, bool>
     */
    private function lockedLessons($lessons, $progress, $quizAttempts, $submissions): array
    {
        $locked = [];
        $gateOpen = false;

        foreach ($lessons as $item) {
            $locked[$item->id] = $gateOpen;
            if ($this->isGatingLesson($item, $progress->get($item->id), $quizAttempts, $submissions)) {
                $gateOpen = true;
            }
        }

        return $locked;
    }

    /**
     * Media lessons gate while uncompleted; quiz lessons gate until a passing
     * attempt exists; assignment lessons gate until the student submits one.
     * Plain text lessons never block the next one.
     *
     * @param \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, QuizAttempt>> $quizAttempts
     * @param \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, Submission>> $submissions
     */
    private function isGatingLesson(Lesson $lesson, ?LessonProgress $progress, $quizAttempts, $submissions): bool
    {
        if ($this->isMediaLesson($lesson)) {
            return ($progress?->status ?? null) !== 'completed';
        }

        if ($lesson->type === 'quiz' && filled($lesson->quiz)) {
            return ! ($quizAttempts->get($lesson->quiz->id)?->contains('passed', true) ?? false);
        }

        if ($lesson->type === 'assignment' && $lesson->assignments->isNotEmpty()) {
            return ! $submissions->has($lesson->assignments->first()->id);
        }

        return false;
    }

    private function isMediaLesson(Lesson $lesson): bool
    {
        return filled($lesson->video_url)
            || in_array($lesson->type, ['video', 'audio', 'podcast'], true);
    }

    /**
     * @param \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, QuizAttempt>>|null $quizAttempts
     * @param \Illuminate\Support\Collection<int, \Illuminate\Support\Collection<int, Submission>>|null $submissions
     * @return array<string, mixed>
     */
    private function lessonPayload(Lesson $lesson, ?LessonProgress $progress, bool $full = false, bool $locked = false, $quizAttempts = null, $submissions = null): array
    {
        $quiz = $lesson->quiz;
        $assignment = $lesson->assignments->first();

        return [
            'id' => $lesson->id,
            'title' => $lesson->title,
            'type' => $lesson->type,
            'duration_minutes' => $lesson->duration_minutes,
            'is_free' => $lesson->is_free,
            'locked' => $locked,
            'progress_percent' => (int) ($progress?->progress_percent ?? 0),
            'status' => $progress?->status,
            'quiz' => $quiz ? $this->quizPayload($quiz, $quizAttempts?->get($quiz->id), $full) : null,
            'assignment' => $assignment ? $this->assignmentPayload($assignment, $submissions?->get($assignment->id)) : null,
            ...($full ? ['video_url' => $lesson->video_url, 'video_type' => $lesson->video_type, 'content' => $lesson->content, 'attachments' => $lesson->attachments] : []),
        ];
    }

    /**
     * @param \Illuminate\Support\Collection<int, Submission>|null $submissions
     * @return array<string, mixed>
     */
    private function assignmentPayload(Assignment $assignment, $submissions): array
    {
        $latest = $submissions?->sortByDesc('id')->first();

        return [
            'id' => $assignment->id,
            'title' => $assignment->title,
            'description' => $assignment->description,
            'max_score' => (int) $assignment->max_score,
            'due_days' => $assignment->due_days,
            'submission' => $latest ? [
                'id' => $latest->id,
                'content' => $latest->content,
                'attachment' => $latest->attachment,
                'attachment_url' => $latest->attachment ? route('learning.assignment.download', $latest) : null,
                'status' => $latest->status,
                'score' => $latest->score,
                'feedback' => $latest->feedback,
                'submitted_at' => $latest->submitted_at?->format('Y/m/d H:i'),
            ] : null,
        ];
    }

    /**
     * Correct answers are intentionally never serialized — grading happens
     * server-side in QuizController::submit.
     *
     * @param \Illuminate\Support\Collection<int, QuizAttempt>|null $attempts
     * @return array<string, mixed>
     */
    private function quizPayload(Quiz $quiz, $attempts, bool $full): array
    {
        $inProgress = $attempts?->firstWhere('submitted_at', null);
        $latest = $attempts?->sortByDesc('id')->first();

        return [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'passing_score' => (int) $quiz->passing_score,
            'time_limit_minutes' => $quiz->time_limit_minutes,
            'questions_count' => $quiz->questions->count(),
            'attempts_count' => $attempts?->count() ?? 0,
            'in_progress' => (bool) $inProgress,
            'in_progress_attempt_id' => $inProgress?->id,
            'last_attempt' => $latest ? [
                'id' => $latest->id,
                'score' => (int) $latest->score,
                'passed' => (bool) $latest->passed,
                'submitted_at' => $latest->submitted_at?->format('Y/m/d H:i'),
            ] : null,
            ...($full ? ['questions' => $quiz->questions->map(fn ($question) => [
                'id' => $question->id,
                'type' => $question->type,
                'question' => $question->question,
                'options' => $question->options ?? [],
                'score' => (int) $question->score,
            ])->values()->all()] : []),
        ];
    }
}
