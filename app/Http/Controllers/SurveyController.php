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

/**
 * @phpstan-return Response|RedirectResponse
 */
class SurveyController extends Controller
{
    public function show(Request $request, Survey $survey): Response|RedirectResponse
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
            'questions' => $visibleQuestions->map(fn (SurveyQuestion $q) => $this->presentQuestion($q))->values()->all(),
            'answers' => collect($answers)->filter(fn ($value, $key) => $visibleQuestions->pluck('id')->contains((int) $key))->all(),
            'registered' => $isRegistered,
            'registrationRequired' => $registrationRequired,
            'registrationAfter' => $registrationAfter,
            'completed' => $response->status === 'completed',
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

        // Accept all answers at once: payload is answers[question_id] = value.
        $rawAnswers = $request->input('answers', []);
        $answers = $response->answers ?? [];
        $errors = [];

        foreach ($visibleIds as $qid) {
            $value = $rawAnswers[$qid] ?? $rawAnswers[(string) $qid] ?? null;
            /** @var SurveyQuestion|null $question */
            $question = $questions->firstWhere('id', $qid);
            if (! $question) {
                continue;
            }
            if ($question->is_required && $this->isEmptyAnswer($value)) {
                $errors['answers.'.$qid] = 'پاسخ این سؤال الزامی است.';
                continue;
            }
            if (! $this->isEmptyAnswer($value) && ! $this->isValidAnswer($question, $value)) {
                $errors['answers.'.$qid] = 'پاسخ این سؤال معتبر نیست.';
                continue;
            }
            $answers[(string) $qid] = $value;
        }

        if ($errors) {
            return back()->withErrors($errors);
        }

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

        // After answering the visible questions, check if registration is needed
        // before the survey can be marked as completed.
        $needsRegistration = ! $request->user() && ! $response->user_id
            && $registrationAfter > 0 && $registrationAfter < $questions->count();
        if ($needsRegistration) {
            return redirect()->route('survey.register', $survey);
        }

        if ($response->status !== 'completed') {
            $response->update(['status' => 'completed', 'completed_at' => now()]);
            app(SurveyLeadLinker::class)->link($response);
        }

        return redirect()->route('survey.show', $survey);
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

        $sessionPhone = (string) $request->session()->get('survey_register_phone_'.$survey->id, '');
        $showCodeStep = $request->query('step') === 'code' && filled($sessionPhone);

        return Inertia::render('Survey/Register', [
            'survey' => ['title' => $survey->title],
            'answeredCount' => $response->answered_count,
            'remainingCount' => max(0, $totalQuestions - $response->answered_count),
            'registerBeforeStart' => $survey->registrationAfter() === 0,
            'status' => session('status'),
            'step' => $showCodeStep ? 'code' : 'form',
            'phone' => $showCodeStep ? $sessionPhone : '',
            'dev_code' => $showCodeStep && app()->environment(['local', 'testing'])
                ? $request->session()->get('survey_register_dev_code')
                : null,
        ]);
    }

    public function storeRegistration(Request $request, Survey $survey, SmsSender $sms): RedirectResponse
    {
        $this->ensureAvailable($survey);
        if ($request->user()) {
            return redirect()->route('survey.show', $survey);
        }

        $this->resolveResponse($request, $survey);
        $pending = $request->session()->get('survey_register_data_'.$survey->id);
        $resending = is_array($pending) && $request->string('phone')->toString() === (string) ($pending['phone'] ?? '');

        $rules = [
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
        ];
        if (! $resending) {
            $rules['name'] = ['required', 'string', 'max:255'];
            $rules['phone'][] = 'unique:'.User::class;
            $rules['password'] = ['required', 'confirmed', Rules\Password::defaults()];
        }

        $request->validate($rules);

        $phone = $request->string('phone')->toString();
        $requestKey = 'survey-register:'.$phone;
        $ipKey = 'survey-register-ip:'.$request->ip();
        if (RateLimiter::tooManyAttempts($requestKey, 3) || RateLimiter::tooManyAttempts($ipKey, 20)) {
            $seconds = max(RateLimiter::availableIn($requestKey), RateLimiter::availableIn($ipKey));

            throw ValidationException::withMessages([
                'phone' => 'درخواست‌های زیادی ثبت کرده‌اید. لطفاً '.ceil($seconds / 60).' دقیقه دیگر تلاش کنید.',
            ]);
        }
        RateLimiter::hit($requestKey, 300);
        RateLimiter::hit($ipKey, 300);

        $code = (string) random_int(100000, 999999);
        PhoneLoginToken::updateOrCreate(
            ['phone' => $phone],
            ['token' => Hash::make($code), 'created_at' => now()],
        );

        try {
            $sms->sendOtp($phone, $code);
        } catch (Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'phone' => 'ارسال کد تأیید ناموفق بود. لطفاً کمی بعد دوباره تلاش کنید.',
            ]);
        }

        $request->session()->put('survey_register_phone_'.$survey->id, $phone);
        if (! $resending) {
            $request->session()->put('survey_register_data_'.$survey->id, [
                'name' => $request->string('name')->toString(),
                'phone' => $phone,
                'password' => Hash::make($request->string('password')->toString()),
            ]);
        }
        if (app()->environment(['local', 'testing'])) {
            $request->session()->flash('survey_register_dev_code', $code);
        }

        return redirect()->route('survey.register', ['survey' => $survey, 'step' => 'code'])
            ->with('status', 'کد تأیید به شماره شما پیامک شد.');
    }

    public function verifyRegistration(Request $request, Survey $survey, LeadService $leads): RedirectResponse
    {
        $this->ensureAvailable($survey);
        if ($request->user()) {
            return redirect()->route('survey.show', $survey);
        }

        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $phone = $request->string('phone')->toString();
        $sessionPhone = (string) $request->session()->get('survey_register_phone_'.$survey->id, '');
        $pending = $request->session()->get('survey_register_data_'.$survey->id);

        if ($sessionPhone === '' || ! hash_equals($sessionPhone, $phone) || ! is_array($pending)) {
            throw ValidationException::withMessages([
                'phone' => 'نشست ثبت‌نام منقضی شده است. دوباره فرم را تکمیل کنید.',
            ]);
        }

        $verifyKey = 'survey-register-verify:'.$phone;
        if (RateLimiter::tooManyAttempts($verifyKey, 5)) {
            throw ValidationException::withMessages([
                'code' => 'تعداد تلاش‌ها بیش از حد مجاز است. کمی بعد کد جدید بگیرید.',
            ]);
        }

        $token = PhoneLoginToken::where('phone', $phone)->first();
        if (! $token || $token->created_at->addMinutes(5)->isPast()) {
            $token?->delete();
            throw ValidationException::withMessages(['code' => 'کد تأیید منقضی شده است. دوباره درخواست دهید.']);
        }

        if (! Hash::check($request->string('code')->toString(), $token->token)) {
            RateLimiter::hit($verifyKey, 300);
            throw ValidationException::withMessages(['code' => 'کد واردشده صحیح نیست.']);
        }

        if (User::where('phone', $phone)->exists()) {
            throw ValidationException::withMessages(['phone' => 'شماره موبایل قبلاً ثبت شده است. وارد حساب خود شوید.']);
        }

        RateLimiter::clear($verifyKey);
        $token->delete();

        $user = User::create([
            'name' => $pending['name'],
            'phone' => $pending['phone'],
            'password' => $pending['password'],
        ]);
        $user->assignDefaultCustomerRole();

        $response = $this->resolveResponse($request, $survey);
        $response->update([
            'user_id' => $user->id,
            'status' => 'registered',
            'registered_at' => now(),
        ]);

        $lead = $leads->findOrCreate($pending['phone'], $pending['name']);
        $lead->fill(['name' => $pending['name'], 'source' => 'registration'])->save();
        $leads->linkToUser($lead, $user, 'ثبت‌نام از داخل فرم «'.$survey->title.'»');

        $request->session()->forget([
            'survey_register_phone_'.$survey->id,
            'survey_register_data_'.$survey->id,
            'survey_register_dev_code',
        ]);
        $request->session()->regenerate();
        Auth::login($user);

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
