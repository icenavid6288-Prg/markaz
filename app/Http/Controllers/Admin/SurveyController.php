<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Services\Eitaa\EitaaPublisher;
use App\Support\SurveyResults;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response;

class SurveyController extends Controller
{
    public function index(): Response
    {
        $surveys = Survey::query()
            ->withCount([
                'questions',
                'responses',
                'responses as completed_responses_count' => fn ($query) => $query->where('status', 'completed'),
            ])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Surveys/Index', [
            'surveys' => $surveys->through(fn (Survey $survey) => $this->presentSurvey($survey)),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Surveys/Form', [
            'survey' => null,
            'questionTypes' => $this->questionTypes(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $survey = DB::transaction(function () use ($data, $request): Survey {
            $questions = $data['questions'];
            unset($data['questions']);
            $survey = Survey::create([
                ...$data,
                'created_by' => $request->user()->id,
                'share_token' => Str::lower(Str::random(32)),
            ]);
            $this->syncQuestions($survey, $questions);

            return $survey;
        });

        return redirect()->route('admin.surveys.edit', $survey)->with('success', 'نظرسنجی ساخته شد. لینک خصوصی آن آماده انتشار است.');
    }

    public function responses(Request $request, Survey $survey, SurveyResults $results): Response
    {
        return Inertia::render('Admin/Surveys/Responses', $results->page($survey, $request, 'survey'));
    }

    public function export(Survey $survey, SurveyResults $results): StreamedResponse
    {
        return $results->csv($survey, 'survey');
    }

    public function edit(Survey $survey): Response
    {
        $survey->load('questions');

        return Inertia::render('Admin/Surveys/Form', [
            'survey' => $this->presentSurvey($survey, true),
            'questionTypes' => $this->questionTypes(),
        ]);
    }

    public function update(Request $request, Survey $survey): RedirectResponse
    {
        $data = $this->validated($request);
        DB::transaction(function () use ($data, $survey): void {
            $questions = $data['questions'];
            unset($data['questions']);
            $survey->update($data);
            $this->syncQuestions($survey, $questions);
        });

        return back()->with('success', 'تنظیمات و سؤال‌های نظرسنجی ذخیره شد.');
    }

    public function destroy(Survey $survey): RedirectResponse
    {
        $survey->delete();

        return back()->with('success', 'نظرسنجی حذف شد.');
    }

    public function publishToEitaa(Survey $survey, EitaaPublisher $publisher): RedirectResponse
    {
        $result = $publisher->publish($publisher->messageFor($survey));

        if ($result['ok']) {
            // A manual publish counts as the scheduled publish too, so the
            // scheduled command does not send the survey a second time.
            $survey->update(['eitaa_published_at' => now(), 'eitaa_scheduled_at' => null]);

            return back()->with('success', 'نظرسنجی '.$result['message']);
        }

        return back()->with('error', $result['message']);
    }

    public function sendSummaryToEitaa(Survey $survey, EitaaPublisher $publisher): RedirectResponse
    {
        if (! $survey->isClosed()) {
            return back()->with('error', 'جمع‌بندی فقط برای نظرسنجی‌های بسته‌شده ارسال می‌شود.');
        }

        $result = $publisher->publishSummary($survey);

        if ($result['ok']) {
            $survey->update(['eitaa_summary_sent_at' => now()]);

            return back()->with('success', 'جمع‌بندی نتایج '.$result['message']);
        }

        return back()->with('error', $result['message']);
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'welcome_message' => ['nullable', 'string', 'max:4000'],
            'completion_message' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'in:draft,published,closed'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'eitaa_scheduled_at' => ['nullable', 'date'],
            'settings' => ['nullable', 'array'],
            'settings.registration_after' => ['required', 'integer', 'min:0', 'max:1000'],
            'settings.display_mode' => ['sometimes', 'in:all,paged'],
            'settings.show_progress' => ['sometimes', 'boolean'],
            'settings.randomize_questions' => ['sometimes', 'boolean'],
            'settings.allow_multiple_responses' => ['sometimes', 'boolean'],
            'settings.allow_back_navigation' => ['sometimes', 'boolean'],
            'settings.collect_name' => ['sometimes', 'boolean'],
            'settings.collect_phone' => ['sometimes', 'boolean'],
            'settings.completion_redirect' => ['nullable', 'string', 'max:500'],
            'settings.summary_intro' => ['nullable', 'string', 'max:2000'],
            'settings.summary_outro' => ['nullable', 'string', 'max:2000'],
            'questions' => ['required', 'array', 'min:1', 'max:100'],
            'questions.*.id' => ['nullable', 'integer'],
            'questions.*.type' => ['required', 'in:single,multiple,text,textarea,number,rating,yes_no'],
            'questions.*.title' => ['required', 'string', 'max:1000'],
            'questions.*.description' => ['nullable', 'string', 'max:1000'],
            'questions.*.options' => ['nullable', 'array', 'max:50'],
            'questions.*.options.*' => ['nullable', 'string', 'max:255'],
            'questions.*.is_required' => ['sometimes', 'boolean'],
            'questions.*.include_in_summary' => ['sometimes', 'boolean'],
        ]);

        $data['settings'] = array_merge([
            'registration_after' => 3,
            'display_mode' => 'all',
            'show_progress' => true,
            'randomize_questions' => false,
            'allow_multiple_responses' => false,
            'allow_back_navigation' => true,
            'collect_name' => true,
            'collect_phone' => true,
            'completion_redirect' => '',
            'summary_intro' => '',
            'summary_outro' => '',
        ], $data['settings'] ?? []);

        foreach ($data['questions'] as &$question) {
            $question['id'] = isset($question['id']) && is_numeric($question['id']) ? (int) $question['id'] : null;
            $question['options'] = collect($question['options'] ?? [])
                ->map(fn ($option) => trim((string) $option))
                ->filter()
                ->values()
                ->all();
            $question['is_required'] = (bool) ($question['is_required'] ?? false);
            $question['include_in_summary'] = (bool) ($question['include_in_summary'] ?? true);
        }
        unset($question);

        return $data;
    }

    /** @param array<int, array<string, mixed>> $questions */
    private function syncQuestions(Survey $survey, array $questions): void
    {
        $existing = $survey->questions()->get()->keyBy('id');
        $hasExplicitIds = collect($questions)->contains(fn (array $question) => filled($question['id'] ?? null));
        $usedIds = [];

        foreach ($questions as $index => $question) {
            $questionId = $hasExplicitIds && isset($question['id']) ? (int) $question['id'] : null;
            $model = $questionId > 0 && $existing->has($questionId)
                ? $existing->get($questionId)
                : (! $hasExplicitIds ? $existing->values()->get($index) : null);
            $attributes = [
                'type' => $question['type'],
                'title' => $question['title'],
                'description' => $question['description'] ?? null,
                'options' => $question['options'] ?? [],
                'settings' => [],
                'is_required' => (bool) ($question['is_required'] ?? false),
                'include_in_summary' => (bool) ($question['include_in_summary'] ?? true),
                'sort_order' => $index,
            ];

            if ($model) {
                $model->update($attributes);
                $usedIds[] = $model->id;
            } else {
                $usedIds[] = $survey->questions()->create($attributes)->id;
            }
        }

        $query = $survey->questions();
        if ($usedIds !== []) {
            $query->whereNotIn('id', $usedIds);
        }
        $query->delete();
    }

    /** @return array<string, string> */
    private function questionTypes(): array
    {
        return [
            'single' => 'یک گزینه‌ای',
            'multiple' => 'چند گزینه‌ای',
            'text' => 'پاسخ کوتاه',
            'textarea' => 'پاسخ تشریحی',
            'number' => 'عدد',
            'rating' => 'امتیاز ۱ تا ۵',
            'yes_no' => 'بله / خیر',
        ];
    }

    /** @return array<string, mixed> */
    private function presentSurvey(Survey $survey, bool $withQuestions = false): array
    {
        $data = [
            'id' => $survey->id,
            'title' => $survey->title,
            'share_token' => $survey->share_token,
            'share_url' => url('/survey/'.$survey->share_token),
            'description' => $survey->description,
            'welcome_message' => $survey->welcome_message,
            'completion_message' => $survey->completion_message,
            'status' => $survey->status,
            'settings' => array_merge([
                'registration_after' => 3,
                'display_mode' => 'all',
                'show_progress' => true,
                'randomize_questions' => false,
                'allow_multiple_responses' => false,
                'allow_back_navigation' => true,
                'collect_name' => true,
                'collect_phone' => true,
                'completion_redirect' => '',
                'summary_intro' => '',
                'summary_outro' => '',
            ], $survey->settings ?? []),
            'starts_at' => $survey->starts_at?->format('Y-m-d\\TH:i'),
            'ends_at' => $survey->ends_at?->format('Y-m-d\\TH:i'),
            'eitaa_scheduled_at' => $survey->eitaa_scheduled_at?->format('Y-m-d\\TH:i'),
            'eitaa_published_at' => $survey->eitaa_published_at?->format('Y-m-d\\TH:i'),
            'eitaa_summary_sent_at' => $survey->eitaa_summary_sent_at?->format('Y-m-d\\TH:i'),
            'questions_count' => $survey->questions_count ?? $survey->questions()->count(),
            'responses_count' => $survey->responses_count ?? $survey->responses()->count(),
            'completed_responses_count' => $survey->completed_responses_count ?? $survey->responses()->where('status', 'completed')->count(),
        ];

        if ($withQuestions) {
            $data['questions'] = $survey->questions->map(fn ($question) => [
                'id' => $question->id,
                'type' => $question->type,
                'title' => $question->title,
                'description' => $question->description,
                'options' => $question->options ?? [],
                'is_required' => $question->is_required,
                'include_in_summary' => $question->include_in_summary !== false,
            ])->values()->all();
            $results = app(SurveyResults::class);
            $data['responses'] = $survey->responses()->with('user:id,name,phone')->latest()->limit(50)->get()
                ->map(fn ($response) => $results->presentResponse($response, $survey->questions))
                ->all();
        }

        return $data;
    }
}
