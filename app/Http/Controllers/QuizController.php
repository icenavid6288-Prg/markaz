<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    /**
     * Open a fresh attempt so the player can show the questions. The actual
     * grade is computed server-side on submit, so the client never sees the
     * correct answers.
     */
    public function start(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $quiz = $this->quizFor($request, $course, $lesson);

        $existing = QuizAttempt::query()
            ->where('user_id', $request->user()->id)
            ->where('quiz_id', $quiz->id)
            ->whereNull('submitted_at')
            ->latest('id')
            ->first();

        if (! $existing) {
            QuizAttempt::create([
                'user_id' => $request->user()->id,
                'quiz_id' => $quiz->id,
                'score' => 0,
                'answers' => [],
                'passed' => false,
                'started_at' => now(),
            ]);
        }

        return back();
    }

    public function submit(Request $request, Course $course, Lesson $lesson, QuizAttempt $attempt): RedirectResponse
    {
        $quiz = $this->quizFor($request, $course, $lesson);
        abort_unless($attempt->quiz_id === $quiz->id && $attempt->user_id === $request->user()->id, 403);
        abort_if($attempt->submitted_at !== null, 422, 'این تلاش قبلاً ثبت شده است.');

        if ($quiz->time_limit_minutes && $attempt->started_at?->addMinutes((int) $quiz->time_limit_minutes)->isPast()) {
            $attempt->update([
                'answers' => [],
                'score' => 0,
                'passed' => false,
                'submitted_at' => now(),
            ]);

            return back()->with('error', 'زمان آزمون به پایان رسیده است.');
        }

        $validated = $request->validate([
            'answers' => ['required', 'array'],
        ]);

        $questions = $quiz->questions()->get();
        $total = (int) $questions->sum('score');
        $earned = 0;
        $graded = [];

        foreach ($questions as $question) {
            $answer = $this->normalizeAnswer($validated['answers'][$question->id] ?? null);
            $correct = $this->isCorrect($question, $answer);
            if ($correct) {
                $earned += (int) $question->score;
            }
            $graded[(string) $question->id] = ['correct' => $correct, 'answer' => $answer];
        }

        $score = $total > 0 ? (int) round(($earned / $total) * 100) : 0;
        $passed = $score >= (int) $quiz->passing_score;

        $attempt->update([
            'answers' => $graded,
            'score' => $score,
            'passed' => $passed,
            'submitted_at' => now(),
        ]);

        // Passing the quiz completes the lesson, exactly like watching a video.
        if ($passed) {
            $this->markLessonCompleted($request, $course, $lesson);
        }

        return back()->with('success', $passed
            ? 'آزمون را با موفقیت پشت سر گذاشتید. درس تکمیل شد.'
            : "نمره شما برای قبولی کافی نبود؛ حداقل نمره قبولی {$quiz->passing_score}٪ است.");
    }

    /** @return array<int, string> */
    private function normalizeAnswer(mixed $answer): array
    {
        if (! is_array($answer)) {
            $answer = $answer === null ? [] : [$answer];
        }

        return collect($answer)
            ->map(fn ($value) => (string) $value)
            ->filter(fn ($value) => $value !== '')
            ->values()
            ->all();
    }

    /** @param array<int, string> $answer */
    private function isCorrect(Question $question, array $answer): bool
    {
        $correct = collect($question->correct_answer ?? [])
            ->map(fn ($value) => (string) $value)
            ->values()
            ->all();

        if ($question->type === 'multiple') {
            sort($answer);
            sort($correct);

            return $answer === $correct;
        }

        return count($answer) === 1 && count($correct) === 1 && $answer[0] === $correct[0];
    }

    private function quizFor(Request $request, Course $course, Lesson $lesson): Quiz
    {
        abort_unless($lesson->course_id === $course->id, 404);
        Enrollment::query()->where('user_id', $request->user()->id)->where('course_id', $course->id)->firstOrFail();
        $quiz = $lesson->quiz;
        abort_unless($quiz, 404);

        return $quiz;
    }

    private function markLessonCompleted(Request $request, Course $course, Lesson $lesson): void
    {
        LessonProgress::updateOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lesson->id],
            ['status' => 'completed', 'progress_percent' => 100, 'completed_at' => now()],
        );

        $total = max(1, Lesson::where('course_id', $course->id)->count());
        $completed = LessonProgress::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('lesson_id', Lesson::where('course_id', $course->id)->pluck('id'))
            ->where('status', 'completed')
            ->count();
        $courseProgress = (int) round(($completed / $total) * 100);

        $enrollment = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->firstOrFail();
        // Model-level update so the completion hook (certificate issuance) fires.
        $enrollment->update([
            'progress_percent' => $courseProgress,
            'status' => $courseProgress === 100 ? 'completed' : 'active',
            'completed_at' => $courseProgress === 100 ? now() : null,
        ]);
    }
}
