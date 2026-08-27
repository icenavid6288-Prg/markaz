<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\Quiz;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuizController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $query = Quiz::query()->with(['course:id,title', 'lesson:id,title,type,module_id'])->withCount(['questions', 'attempts']);

        if ($search !== '') {
            $query->where(function ($nested) use ($search) {
                $nested->where('title', 'like', "%{$search}%")
                    ->orWhereHas('lesson', fn ($lesson) => $lesson->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('course', fn ($course) => $course->where('title', 'like', "%{$search}%"));
            });
        }

        return Inertia::render('Admin/Quizzes/Index', [
            'quizzes' => $query->latest()->paginate(15)->withQueryString()->through(fn (Quiz $quiz) => $this->presentQuiz($quiz)),
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Quizzes/Form', [
            'quiz' => null,
            'lessons' => $this->lessonOptions(),
            'questionTypes' => $this->questionTypes(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $quiz = DB::transaction(function () use ($data): Quiz {
            $questions = $data['questions'];
            unset($data['questions']);
            $lesson = Lesson::findOrFail($data['lesson_id']);
            $quiz = Quiz::create([
                ...$data,
                'course_id' => $lesson->course_id,
            ]);
            $this->syncQuestions($quiz, $questions);

            return $quiz;
        });

        return redirect()->route('admin.quizzes.edit', $quiz)->with('success', 'آزمون ساخته شد. می‌توانید سؤال‌ها را ویرایش کنید.');
    }

    public function edit(Quiz $quiz): Response
    {
        $quiz->load('questions');

        return Inertia::render('Admin/Quizzes/Form', [
            'quiz' => $this->presentQuiz($quiz, true),
            'lessons' => $this->lessonOptions(),
            'questionTypes' => $this->questionTypes(),
        ]);
    }

    public function update(Request $request, Quiz $quiz): RedirectResponse
    {
        $data = $this->validated($request);
        DB::transaction(function () use ($data, $quiz): void {
            $questions = $data['questions'];
            unset($data['questions']);
            $lesson = Lesson::findOrFail($data['lesson_id']);
            $quiz->update([
                ...$data,
                'course_id' => $lesson->course_id,
            ]);
            $quiz->questions()->delete();
            $this->syncQuestions($quiz, $questions);
        });

        return back()->with('success', 'آزمون و سؤال‌های آن ذخیره شد.');
    }

    public function destroy(Quiz $quiz): RedirectResponse
    {
        $quiz->delete();

        return back()->with('success', 'آزمون حذف شد.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'lesson_id' => ['required', 'integer', 'exists:lessons,id'],
            'passing_score' => ['required', 'integer', 'min:0', 'max:100'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1', 'max:600'],
            'questions' => ['required', 'array', 'min:1', 'max:100'],
            'questions.*.type' => ['required', 'in:single,multiple,true_false'],
            'questions.*.question' => ['required', 'string', 'max:2000'],
            'questions.*.options' => ['nullable', 'array', 'max:10'],
            'questions.*.options.*' => ['nullable', 'string', 'max:255'],
            'questions.*.correct_answer' => ['required', 'array', 'min:1', 'max:10'],
            'questions.*.correct_answer.*' => ['nullable', 'string', 'max:50'],
            'questions.*.score' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        foreach ($data['questions'] as &$question) {
            $question['options'] = collect($question['options'] ?? [])
                ->map(fn ($option) => trim((string) $option))
                ->filter()
                ->values()
                ->all();
            $question['correct_answer'] = collect($question['correct_answer'] ?? [])
                ->map(fn ($value) => trim((string) $value))
                ->filter(fn ($value) => $value !== '')
                ->values()
                ->all();
            $question['score'] = (int) ($question['score'] ?? 1);

            // True/false questions always use the same two options.
            if ($question['type'] === 'true_false') {
                $question['options'] = ['درست', 'نادرست'];
            }
        }
        unset($question);

        return $data;
    }

    /** @param array<int, array<string, mixed>> $questions */
    private function syncQuestions(Quiz $quiz, array $questions): void
    {
        foreach ($questions as $index => $question) {
            $quiz->questions()->create([
                'type' => $question['type'],
                'question' => $question['question'],
                'options' => $question['options'] ?? [],
                'correct_answer' => $question['correct_answer'] ?? [],
                'score' => $question['score'],
                'sort_order' => $index,
            ]);
        }
    }

    /** @return array<string, string> */
    private function questionTypes(): array
    {
        return [
            'single' => 'یک گزینه‌ای',
            'multiple' => 'چند گزینه‌ای',
            'true_false' => 'درست / نادرست',
        ];
    }

    /** @return array<int, array{id: int, label: string}> */
    private function lessonOptions(): array
    {
        return Lesson::query()
            ->with(['course:id,title', 'module:id,title'])
            ->orderBy('course_id')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Lesson $lesson) => [
                'id' => $lesson->id,
                'label' => trim(($lesson->course?->title ?? 'بدون دوره').' — '.($lesson->module?->title ?? '').' — '.$lesson->title, ' —'),
            ])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function presentQuiz(Quiz $quiz, bool $withQuestions = false): array
    {
        $data = [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'lesson_id' => $quiz->lesson_id,
            'lesson' => $quiz->lesson ? ['id' => $quiz->lesson->id, 'title' => $quiz->lesson->title] : null,
            'course' => $quiz->course ? ['id' => $quiz->course->id, 'title' => $quiz->course->title] : null,
            'passing_score' => (int) $quiz->passing_score,
            'time_limit_minutes' => $quiz->time_limit_minutes,
            'questions_count' => (int) ($quiz->questions_count ?? $quiz->questions()->count()),
            'attempts_count' => (int) ($quiz->attempts_count ?? $quiz->attempts()->count()),
            'created_at' => $quiz->created_at?->format('Y/m/d'),
        ];

        if ($withQuestions) {
            $data['questions'] = $quiz->questions->map(fn ($question) => [
                'type' => $question->type,
                'question' => $question->question,
                'options' => $question->options ?? [],
                'correct_answer' => $question->correct_answer ?? [],
                'score' => (int) $question->score,
            ])->values()->all();
        }

        return $data;
    }
}
