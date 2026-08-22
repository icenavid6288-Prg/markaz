<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Services\Eitaa\EitaaPublisher;
use App\Support\PerslineTemplates;
use App\Support\SurveyResults;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PerslineController extends Controller
{
    public function index(): Response
    {
        $surveys = Survey::query()
            ->whereIn('persline_type', array_keys(PerslineTemplates::all()))
            ->withCount([
                'questions',
                'responses',
                'responses as completed_responses_count' => fn ($query) => $query->where('status', 'completed'),
            ])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Persline/Index', [
            'forms' => $surveys->through(fn (Survey $survey) => $this->presentSurvey($survey)),
            'types' => $this->typeOptions(),
        ]);
    }

    public function create(Request $request): Response
    {
        $type = (string) $request->query('type', '');
        $template = array_key_exists($type, PerslineTemplates::all()) ? PerslineTemplates::forType($type) : null;

        return Inertia::render('Admin/Persline/Form', [
            'form' => null,
            'types' => $this->typeOptions(),
            'questionTypes' => $this->questionTypes(),
            'templates' => PerslineTemplates::all(),
            'selectedTemplate' => $template,
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
            ]);
            $this->syncQuestions($survey, $questions);

            return $survey;
        });
        $this->storePoster($request, $survey);

        return redirect()->route('admin.persline.edit', $survey)->with('success', 'فرم پرسلاین ساخته شد؛ لینک پاسخ‌گویی آماده انتشار است.');
    }

    public function edit(Survey $survey): Response
    {
        $this->ensurePersline($survey);
        $survey->load('questions');

        return Inertia::render('Admin/Persline/Form', [
            'form' => $this->presentSurvey($survey, true),
            'types' => $this->typeOptions(),
            'questionTypes' => $this->questionTypes(),
            'templates' => PerslineTemplates::all(),
            'selectedTemplate' => null,
        ]);
    }

    public function update(Request $request, Survey $survey): RedirectResponse
    {
        $this->ensurePersline($survey);
        $data = $this->validated($request);

        DB::transaction(function () use ($data, $survey): void {
            $questions = $data['questions'];
            unset($data['questions']);
            $survey->update($data);
            $survey->questions()->delete();
            $this->syncQuestions($survey, $questions);
        });
        $this->storePoster($request, $survey->fresh() ?? $survey);

        return back()->with('success', 'فرم پرسلاین و سؤال‌های آن ذخیره شد.');
    }

    public function destroy(Survey $survey): RedirectResponse
    {
        $this->ensurePersline($survey);
        $survey->delete();

        return back()->with('success', 'فرم پرسلاین و پاسخ‌های آن حذف شد.');
    }

    public function responses(Request $request, Survey $survey, SurveyResults $results): Response
    {
        $this->ensurePersline($survey);

        return Inertia::render('Admin/Surveys/Responses', $results->page($survey, $request, 'persline'));
    }

    public function export(Survey $survey, SurveyResults $results): StreamedResponse
    {
        $this->ensurePersline($survey);

        return $results->csv($survey, 'persline');
    }

    public function publishToEitaa(Survey $survey, EitaaPublisher $publisher): RedirectResponse
    {
        $this->ensurePersline($survey);
        $result = $publisher->publish($publisher->messageFor($survey));

        if ($result['ok']) {
            // A manual publish counts as the scheduled publish too, so the
            // scheduled command does not send the form a second time.
            $survey->update(['eitaa_published_at' => now(), 'eitaa_scheduled_at' => null]);

            return back()->with('success', 'فرم پرسلاین '.$result['message']);
        }

        return back()->with('error', $result['message']);
    }

    public function sendSummaryToEitaa(Survey $survey, EitaaPublisher $publisher): RedirectResponse
    {
        $this->ensurePersline($survey);

        if (! $survey->isClosed()) {
            return back()->with('error', 'جمع‌بندی فقط برای فرم‌های بسته‌شده ارسال می‌شود.');
        }

        $result = $publisher->publishSummary($survey);

        if ($result['ok']) {
            $survey->update(['eitaa_summary_sent_at' => now()]);

            return back()->with('success', 'جمع‌بندی نتایج '.$result['message']);
        }

        return back()->with('error', $result['message']);
    }

    /** @return array<string, array<string, string>> */
    private function typeOptions(): array
    {
        return collect(PerslineTemplates::all())->mapWithKeys(fn (array $template, string $key) => [$key => [
            'label' => $template['label'],
            'short_label' => $template['short_label'],
            'description' => $template['description'],
        ]])->all();
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
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'persline_type' => ['required', 'in:ads,eitaa,warm_lead'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'welcome_message' => ['nullable', 'string', 'max:5000'],
            'completion_message' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', 'in:draft,published,closed'],
            'settings' => ['nullable', 'array'],
            'settings.registration_after' => ['required', 'integer', 'min:0', 'max:1000'],
            'settings.show_progress' => ['sometimes', 'boolean'],
            'settings.randomize_questions' => ['sometimes', 'boolean'],
            'settings.allow_multiple_responses' => ['sometimes', 'boolean'],
            'settings.allow_back_navigation' => ['sometimes', 'boolean'],
            'settings.completion_redirect' => ['nullable', 'string', 'max:500'],
            'settings.summary_intro' => ['nullable', 'string', 'max:2000'],
            'settings.summary_outro' => ['nullable', 'string', 'max:2000'],
            'eitaa_scheduled_at' => ['nullable', 'date'],
            'questions' => ['nullable', 'array', 'max:100'],
            'questions.*.type' => ['required', 'in:single,multiple,text,textarea,number,rating,yes_no'],
            'questions.*.title' => ['required', 'string', 'max:2000'],
            'questions.*.description' => ['nullable', 'string', 'max:2000'],
            'questions.*.options' => ['nullable', 'array', 'max:50'],
            'questions.*.options.*' => ['nullable', 'string', 'max:500'],
            'questions.*.is_required' => ['sometimes', 'boolean'],
            'questions.*.include_in_summary' => ['sometimes', 'boolean'],
            'questions.*.settings' => ['nullable', 'array'],
            'questions.*.settings.lead_key' => ['nullable', 'in:name,phone,email,child_age,grade,need,child_name'],
            'file' => ['nullable', 'file', 'mimes:json,csv,txt', 'max:4096'],
            'poster_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_poster' => ['sometimes', 'boolean'],
        ]);

        $questions = $request->hasFile('file')
            ? $this->parseQuestionFile($request->file('file'))
            : $this->normalizeQuestions($data['questions'] ?? []);

        if ($questions === []) {
            throw ValidationException::withMessages(['questions' => 'حداقل یک سؤال دستی وارد کنید یا فایل سؤال‌ها را بارگذاری کنید.']);
        }

        $template = PerslineTemplates::forType((string) $data['persline_type']);
        $data['settings'] = array_merge(
            ['summary_intro' => '', 'summary_outro' => ''],
            $template['default_settings'],
            $data['settings'] ?? [],
        );
        $data['questions'] = $questions;
        unset($data['file'], $data['poster_file'], $data['remove_poster']);

        return $data;
    }

    /** @param array<int, array<string, mixed>> $questions @return array<int, array<string, mixed>> */
    private function normalizeQuestions(array $questions): array
    {
        return collect($questions)
            ->map(function (array $question): array {
                $type = (string) ($question['type'] ?? 'text');
                $options = collect($question['options'] ?? [])
                    ->map(fn ($option) => trim((string) $option))
                    ->filter()
                    ->values()
                    ->all();

                if ($type === 'yes_no') {
                    $options = ['بله', 'خیر'];
                }
                if (in_array($type, ['text', 'textarea', 'number', 'rating'], true)) {
                    $options = [];
                }

                return [
                    'type' => $type,
                    'title' => trim((string) ($question['title'] ?? '')),
                    'description' => filled($question['description'] ?? null) ? trim((string) $question['description']) : null,
                    'options' => $options,
                    'settings' => is_array($question['settings'] ?? null) ? $question['settings'] : [],
                    'is_required' => (bool) ($question['is_required'] ?? true),
                    'include_in_summary' => (bool) ($question['include_in_summary'] ?? true),
                ];
            })
            ->filter(fn (array $question) => $question['title'] !== '')
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function parseQuestionFile(UploadedFile $file): array
    {
        $contents = file_get_contents($file->getRealPath());
        if ($contents === false || trim($contents) === '') {
            throw ValidationException::withMessages(['file' => 'فایل سؤال‌ها خالی است.']);
        }

        return match (strtolower($file->getClientOriginalExtension())) {
            'json' => $this->parseJson($contents),
            'csv' => $this->parseCsv($contents),
            default => $this->parseText($contents),
        };
    }

    /** @return array<int, array<string, mixed>> */
    private function parseJson(string $contents): array
    {
        $decoded = json_decode($contents, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw ValidationException::withMessages(['file' => 'ساختار JSON معتبر نیست.']);
        }

        if (is_array($decoded) && isset($decoded['questions']) && is_array($decoded['questions'])) {
            $decoded = $decoded['questions'];
        }
        if (! is_array($decoded) || array_is_list($decoded) === false) {
            throw ValidationException::withMessages(['file' => 'JSON باید یک آرایه از سؤال‌ها یا شیئی با کلید questions باشد.']);
        }

        return $this->normalizeQuestions($decoded);
    }

    /** @return array<int, array<string, mixed>> */
    private function parseCsv(string $contents): array
    {
        $rows = [];
        foreach (preg_split('/\r\n|\n|\r/', trim($contents)) ?: [] as $line) {
            if (trim($line) !== '') {
                $rows[] = str_getcsv($line);
            }
        }
        if ($rows === []) {
            return [];
        }

        $first = array_map(fn ($value) => strtolower(trim((string) preg_replace('/^\xEF\xBB\xBF/', '', $value))), $rows[0]);
        $hasHeader = count(array_intersect($first, ['title', 'question', 'type', 'options', 'required'])) > 0;
        if ($hasHeader) {
            array_shift($rows);
        }

        $questions = [];
        foreach ($rows as $row) {
            $values = $hasHeader ? array_combine($first, array_pad($row, count($first), '')) : [
                'type' => $row[0] ?? 'text',
                'title' => $row[1] ?? '',
                'options' => $row[2] ?? '',
                'required' => $row[3] ?? '1',
            ];
            if (! is_array($values)) {
                continue;
            }
            $questions[] = [
                'type' => $this->normalizeType((string) ($values['type'] ?? 'text')),
                'title' => $values['title'] ?? ($values['question'] ?? ''),
                'options' => $this->splitOptions((string) ($values['options'] ?? '')),
                'is_required' => $this->toBoolean($values['required'] ?? ($values['is_required'] ?? true)),
            ];
        }

        return $this->normalizeQuestions($questions);
    }

    /** @return array<int, array<string, mixed>> */
    private function parseText(string $contents): array
    {
        $questions = [];
        $current = null;
        $sawNumberedQuestion = false;
        $lines = preg_split('/\r\n|\n|\r/', $contents) ?: [];

        foreach ($lines as $rawLine) {
            $line = trim(preg_replace('/^\xEF\xBB\xBF/', '', $rawLine));
            if ($line === '') {
                continue;
            }

            if (preg_match('/^\s*(?:\d+|[۰-۹]+)[\.\)\-]\s*(.+)$/u', $line, $match)) {
                if ($current !== null) {
                    $questions[] = $current;
                }
                $current = ['type' => 'text', 'title' => trim($match[1]), 'options' => [], 'is_required' => true];
                $sawNumberedQuestion = true;
                continue;
            }

            if ($current !== null && preg_match('/^\s*(?:[*•]|-)\s*(.+)$/u', $line, $match)) {
                $current['type'] = 'single';
                $current['options'][] = trim($match[1]);
                continue;
            }

            if ($current !== null && $sawNumberedQuestion) {
                $current['title'] .= ' '.trim($line);
            }
        }

        if ($current !== null) {
            $questions[] = $current;
        }

        if (! $sawNumberedQuestion) {
            $questions = collect($lines)
                ->map(fn ($line) => trim((string) $line))
                ->filter()
                ->map(fn ($title) => ['type' => 'text', 'title' => $title, 'options' => [], 'is_required' => true])
                ->all();
        }

        return $this->normalizeQuestions($questions);
    }

    /** @return array<int, string> */
    private function splitOptions(string $value): array
    {
        return collect(preg_split('/\s*[|؛;]\s*/u', trim($value)) ?: [])
            ->map(fn ($option) => trim($option))
            ->filter()
            ->values()
            ->all();
    }

    private function normalizeType(string $type): string
    {
        return match (trim(mb_strtolower($type))) {
            'multiple', 'multi', 'چند گزینه‌ای', 'چندگزینه‌ای' => 'multiple',
            'textarea', 'long_text', 'تشریحی', 'پاسخ تشریحی' => 'textarea',
            'number', 'عدد' => 'number',
            'rating', 'امتیاز' => 'rating',
            'yes_no', 'بله/خیر', 'بله / خیر' => 'yes_no',
            'single', 'single_choice', 'یک گزینه‌ای', 'تک گزینه‌ای' => 'single',
            default => 'text',
        };
    }

    private function toBoolean(mixed $value): bool
    {
        return ! in_array(mb_strtolower(trim((string) $value)), ['', '0', 'false', 'no', 'خیر', 'نه'], true);
    }

    /** @param array<int, array<string, mixed>> $questions */
    private function syncQuestions(Survey $survey, array $questions): void
    {
        foreach ($questions as $index => $question) {
            $survey->questions()->create([
                'type' => $question['type'],
                'title' => $question['title'],
                'description' => $question['description'] ?? null,
                'options' => $question['options'] ?? [],
                'settings' => $question['settings'] ?? [],
                'is_required' => (bool) ($question['is_required'] ?? true),
                'include_in_summary' => (bool) ($question['include_in_summary'] ?? true),
                'sort_order' => $index,
            ]);
        }
    }

    /** @return array<string, mixed> */
    private function presentSurvey(Survey $survey, bool $withQuestions = false): array
    {
        $data = [
            'id' => $survey->id,
            'title' => $survey->title,
            'persline_type' => $survey->persline_type,
            'share_token' => $survey->share_token,
            'share_url' => url('/survey/'.$survey->share_token),
            'description' => $survey->description,
            'welcome_message' => $survey->welcome_message,
            'completion_message' => $survey->completion_message,
            'status' => $survey->status,
            'settings' => array_merge([
                'registration_after' => 0,
                'show_progress' => true,
                'randomize_questions' => false,
                'allow_multiple_responses' => false,
                'allow_back_navigation' => true,
                'completion_redirect' => '',
                'summary_intro' => '',
                'summary_outro' => '',
            ], $survey->settings ?? []),
            'eitaa_scheduled_at' => $survey->eitaa_scheduled_at?->format('Y-m-d\\TH:i'),
            'eitaa_published_at' => $survey->eitaa_published_at?->format('Y-m-d\\TH:i'),
            'eitaa_summary_sent_at' => $survey->eitaa_summary_sent_at?->format('Y-m-d\\TH:i'),
            'questions_count' => $survey->questions_count ?? $survey->questions()->count(),
            'responses_count' => $survey->responses_count ?? $survey->responses()->count(),
            'completed_responses_count' => $survey->completed_responses_count ?? $survey->responses()->where('status', 'completed')->count(),
            'poster_url' => $survey->posterUrl(),
        ];

        if ($withQuestions) {
            $data['questions'] = $survey->questions->map(fn (SurveyQuestion $question) => [
                'type' => $question->type,
                'title' => $question->title,
                'description' => $question->description,
                'options' => $question->options ?? [],
                'settings' => $question->settings ?? [],
                'is_required' => $question->is_required,
                'include_in_summary' => $question->include_in_summary !== false,
            ])->values()->all();
        }

        return $data;
    }

    private function storePoster(Request $request, Survey $survey): void
    {
        $settings = is_array($survey->settings) ? $survey->settings : [];
        $current = (string) ($settings['poster'] ?? '');

        if ($request->boolean('remove_poster') && ! $request->hasFile('poster_file')) {
            $this->deletePosterFile($current);
            $settings['poster'] = '';
            $survey->update(['settings' => $settings]);

            return;
        }

        $file = $request->file('poster_file');
        if (! $file || ! $file->isValid()) {
            return;
        }

        $directory = public_path('images/surveys');
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $prefix = 'survey-'.$survey->getKey().'-poster';
        foreach (glob($directory.'/'.$prefix.'.*') ?: [] as $oldFile) {
            if (is_file($oldFile)) {
                @unlink($oldFile);
            }
        }

        $extension = strtolower($file->extension() ?: 'jpg');
        if (! in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true)) {
            $extension = 'jpg';
        }
        $file->move($directory, $prefix.'.'.$extension);
        $settings['poster'] = '/images/surveys/'.$prefix.'.'.$extension;
        $survey->update(['settings' => $settings]);
    }

    private function deletePosterFile(string $path): void
    {
        if ($path === '' || ! str_starts_with($path, '/images/surveys/')) {
            return;
        }
        $full = public_path(ltrim($path, '/'));
        if (is_file($full)) {
            @unlink($full);
        }
    }

    private function ensurePersline(Survey $survey): void
    {
        abort_unless(in_array($survey->persline_type, array_keys(PerslineTemplates::all()), true), 404);
    }
}
