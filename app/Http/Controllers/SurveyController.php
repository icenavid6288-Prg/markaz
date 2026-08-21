<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\Crm\LeadService;
use App\Services\Crm\SurveyLeadLinker;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class SurveyController extends Controller
{
    public function show(Request $request, Survey $survey): Response
    {
        $this->ensureAvailable($survey);
        $response = $this->resolveResponse($request, $survey);
        $questions = $this->orderedQuestions($survey, $response);
        $isRegistered = $request->user() !== null || $response->user_id !== null;
        $registrationAfter = $survey->registrationAfter();

        // registration_after === 0 means register BEFORE the survey starts.
        if ($registrationAfter === 0 && ! $isRegistered && $questions->isNotEmpty()) {
            $request->session()->put('survey_response_'.$survey->id, $response->id);

            return redirect()->route('survey.register', $survey);
        }

        $registrationRequired = ! $isRegistered && $registrationAfter > 0 && $registrationAfter < $questions->count();
        $visibleQuestions = $registrationRequired ? $questions->take($registrationAfter) : $questions;
        $answers = $response->answers ?? [];

        // One question per page: the user must answer the current question before
        // the survey advances to the next one. Use array_key_exists rather than
        // empty() so that falsy answers (e.g. number 0) are correctly treated as
        // answered and do not cause the page to loop back on refresh.
        $current = $visibleQuestions->first(fn (SurveyQuestion $question) => ! array_key_exists((string) $question->id, $answers));
        $answers = collect($answers)->filter(fn ($value, $key) => $visibleQuestions->pluck('id')->contains((int) $key))->all();
        $answeredCount = count(array_filter($answers, fn ($value) => ! $this->isEmptyAnswer($value)));

        return Inertia::render('Survey/Show', [
            'survey' => [
                'title' => $survey->title,
                'description' => $survey->description,
                'welcome_message' => $survey->welcome_message,
                'completion_message' => $survey->completion_message ?: 'از وقتی که برای پاسخ‌گویی گذاشتید سپاسگزاریم.',
                'show_progress' => (bool) $survey->setting('show_progress', true),
                'allow_back_navigation' => (bool) $survey->setting('allow_back_navigation', true),
                'completion_redirect' => $this->safeRedirect((string) $survey->setting('completion_redirect', '')),
            ],
            'question' => $current ? $this->presentQuestion($current) : null,
            'questions_count' => $visibleQuestions->count(),
            'answers' => $answers,
            'current_index' => $current ? $visibleQuestions->search(fn (SurveyQuestion $question) => $question->id === $current->id) : $visibleQuestions->count(),
            'registered' => $isRegistered,
            'registrationRequired' => $registrationRequired,
            'registrationAfter' => $registrationAfter,
            'completed' => $response->status === 'completed' || $current === null,
            'totalQuestions' => $questions->count(),
        ]);
    }

    public function answer(Request $request, Survey $survey): RedirectResponse
    {
        $this->ensureAvailable($survey);
        $response = $this->resolveResponse($request, $survey);
        $questions = $this->orderedQuestions($survey, $response);
        $isRegistered = $request->user() !== null || $response->user_id !== null;
        $registrationAfter = $survey->registrationAfter();
        $visibleIds = (! $isRegistered && $registrationAfter > 0 && $registrationAfter < $questions->count())
            ? $questions->take($registrationAfter)->pluck('id')->all()
            : $questions->pluck('id')->all();

        // Single-question mode: the payload carries the question id + its answer.
        $questionId = (int) $request->input('question_id');
        $value = $request->input('answer');
        abort_unless(in_array($questionId, $visibleIds, true), 422, 'سؤال موردنظر در این مرحله قابل پاسخ‌گویی نیست.');

        /** @var SurveyQuestion $question */
        $question = $questions->firstWhere('id', $questionId);
        if ($question->is_required && $this->isEmptyAnswer($value)) {
            return back()->withErrors(['answers.'.$question->id => 'پاسخ این سؤال الزامی است.']);
        }
        if (! $this->isValidAnswer($question, $value)) {
            return back()->withErrors(['answers.'.$question->id => 'پاسخ این سؤال معتبر نیست.']);
        }

        $answers = $response->answers ?? [];
        $answers[(string) $question->id] = $value;

        if ($request->user() && ! $response->user_id) {
            $response->user_id = $request->user()->id;
            $response->status = 'registered';
            $response->registered_at = now();
        }

        $response->fill([
            'answers' => $answers,
            'answered_count' => count(array_filter($answers, fn ($item) => ! $this->isEmptyAnswer($item))),
            'ip_hash' => hash('sha256', (string) $request->ip()),
            'user_agent' => Str::limit((string) $request->userAgent(), 1000),
        ])->save();

        $needsRegistration = ! $request->user() && ! $response->user_id
            && $registrationAfter > 0 && $registrationAfter < $questions->count()
            && count($answers) >= $registrationAfter;
        if ($needsRegistration) {
            return redirect()->route('survey.register', $survey);
        }

        // Find the next unanswered visible question, otherwise the survey is complete.
        // A question is considered answered as soon as its key exists in the answers
        // array — even if the stored value is falsy (e.g. 0 or empty string).
        $next = $questions
            ->whereIn('id', $visibleIds)
            ->first(fn (SurveyQuestion $item) => ! array_key_exists((string) $item->id, $answers));

        if ($next === null) {
            if ($response->status !== 'completed') {
                $response->update(['status' => 'completed', 'completed_at' => now()]);
                app(SurveyLeadLinker::class)->link($response);
            }

            return redirect()->route('survey.show', $survey);
        }

        return redirect()->route('survey.show', $survey)->with('next_question', $next->id);
    }

    public function register(Request $request, Survey $survey): Response|RedirectResponse
    {
        $this->ensureAvailable($survey);
        if ($request->user()) {
            return redirect()->route('survey.show', $survey);
        }

        $response = $this->resolveResponse($request, $survey);
        if ($response->status === 'completed') {
            return redirect()->route('survey.show', $survey);
        }

        $totalQuestions = $survey->questions()->count();

        return Inertia::render('Survey/Register', [
            'survey' => ['title' => $survey->title],
            'answeredCount' => $response->answered_count,
            'remainingCount' => max(0, $totalQuestions - $response->answered_count),
            'registerBeforeStart' => $survey->registrationAfter() === 0,
        ]);
    }

    public function storeRegistration(Request $request, Survey $survey, LeadService $leads): RedirectResponse
    {
        $this->ensureAvailable($survey);
        if ($request->user()) {
            return redirect()->route('survey.show', $survey);
        }

        $response = $this->resolveResponse($request, $survey);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'phone' => $data['phone'],
            // The User model hashes the password via the 'hashed' cast.
            'password' => $data['password'],
        ]);

        $response->update([
            'user_id' => $user->id,
            'status' => 'registered',
            'registered_at' => now(),
        ]);

        // Keep the CRM in sync with the main registration flow: the form is a
        // lead-capture touchpoint, so the new account gets a linked lead too.
        $lead = $leads->findOrCreate($data['phone'], $data['name']);
        $lead->fill(['name' => $data['name'], 'source' => 'registration'])->save();
        $leads->linkToUser($lead, $user, 'ثبت‌نام از داخل فرم «'.$survey->title.'»');

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('survey.show', $survey)->with('success', 'حساب شما ساخته شد؛ حالا ادامه نظرسنجی را تکمیل کنید.');
    }

    private function ensureAvailable(Survey $survey): void
    {
        abort_unless($survey->status === 'published', 404);
        abort_unless(! $survey->starts_at || $survey->starts_at->isPast(), 404);
        abort_unless(! $survey->ends_at || $survey->ends_at->isFuture(), 404);
        abort_unless($survey->questions()->exists(), 404);
    }

    private function resolveResponse(Request $request, Survey $survey): SurveyResponse
    {
        $sessionKey = 'survey_response_'.$survey->id;
        $responseId = $request->session()->get($sessionKey);
        $response = $responseId ? SurveyResponse::where('survey_id', $survey->id)->find($responseId) : null;

        if (! $response && $request->user() && ! $survey->setting('allow_multiple_responses', false)) {
            $response = $survey->responses()->where('user_id', $request->user()->id)->latest()->first();
        }

        if (! $response) {
            $response = $survey->responses()->create([
                'user_id' => $request->user()?->id,
                'status' => $request->user() ? 'registered' : 'in_progress',
                'registered_at' => $request->user() ? now() : null,
                'ip_hash' => hash('sha256', (string) $request->ip()),
                'user_agent' => Str::limit((string) $request->userAgent(), 1000),
            ]);
        }

        $request->session()->put($sessionKey, $response->id);

        return $response;
    }

    private function orderedQuestions(Survey $survey, SurveyResponse $response)
    {
        $questions = $survey->questions()->get();
        if ($survey->setting('randomize_questions', false)) {
            return $questions->sortBy(fn (SurveyQuestion $question) => crc32($response->id.':'.$question->id))->values();
        }

        return $questions;
    }

    /** @return array<string, mixed> */
    private function presentQuestion(SurveyQuestion $question): array
    {
        return [
            'id' => $question->id,
            'type' => $question->type,
            'title' => $question->title,
            'description' => $question->description,
            'options' => $question->options ?? [],
            'required' => $question->is_required,
        ];
    }

    private function isEmptyAnswer(mixed $value): bool
    {
        return $value === null || $value === '' || (is_array($value) && count(array_filter($value, fn ($item) => $item !== '')) === 0);
    }

    private function isValidAnswer(SurveyQuestion $question, mixed $value): bool
    {
        if ($this->isEmptyAnswer($value)) {
            return ! $question->is_required;
        }
        if ($question->type === 'multiple' && ! is_array($value)) {
            return false;
        }
        if (in_array($question->type, ['single', 'yes_no'], true) && ! is_string($value)) {
            return false;
        }
        if ($question->type === 'number' && (! is_numeric($value) || (float) $value < 0)) {
            return false;
        }
        if ($question->type === 'rating' && (! is_numeric($value) || (int) $value < 1 || (int) $value > 5)) {
            return false;
        }
        if ($question->type === 'multiple' || $question->type === 'single') {
            $allowed = $question->options ?? [];
            $values = is_array($value) ? $value : [$value];
            return collect($values)->every(fn ($item) => in_array((string) $item, array_map('strval', $allowed), true));
        }

        return is_scalar($value) || is_array($value);
    }

    /** @param \Illuminate\Support\Collection<int, SurveyQuestion> $questions */
    private function hasAllRequiredAnswers($questions, array $answers): bool
    {
        return $questions->every(fn (SurveyQuestion $question) => ! $question->is_required || ! $this->isEmptyAnswer($answers[(string) $question->id] ?? null));
    }

    private function safeRedirect(string $url): string
    {
        return Str::startsWith($url, '/') && ! Str::startsWith($url, '//') ? $url : '';
    }
}
