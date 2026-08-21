<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AdminLoginRequest;
use App\Models\PhoneLoginToken;
use App\Models\User;
use App\Services\Sms\SmsSender;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the phone-number login step.
     */
    public function create(Request $request): Response
    {
        if ($request->boolean('fresh')) {
            $request->session()->forget(['login_phone', 'login_dev_code', 'auth_modal_return_url']);
        }

        $phone = $request->session()->get('login_phone');
        $showCodeStep = $request->query('step') === 'code' && filled($phone);

        return Inertia::render('Auth/Login', $this->loginProps([
            'step' => $showCodeStep ? 'code' : 'phone',
            'phone' => $showCodeStep ? $phone : '',
            'dev_code' => $showCodeStep && app()->environment(['local', 'testing'])
                ? $request->session()->get('login_dev_code')
                : null,
        ]));
    }

    /**
     * Display the password-based administrator login.
     */
    public function adminCreate(): Response
    {
        return Inertia::render('Auth/AdminLogin', [
            'status' => session('status'),
        ]);
    }

    /**
     * Authenticate an administrator without an SMS code.
     */
    public function adminStore(AdminLoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard', absolute: false));
    }

    /**
     * Display the SMS code verification step.
     */
    public function verifyView(Request $request): Response|RedirectResponse
    {
        $phone = $request->session()->get('login_phone');

        if (! $phone) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/Login', $this->loginProps([
            'step' => 'code',
            'phone' => $phone,
            'dev_code' => app()->environment(['local', 'testing']) ? $request->session()->get('login_dev_code') : null,
        ]));
    }

    /**
     * Authenticate with phone + password, or send a one-time login code
     * to the submitted phone number when no password is provided.
     */
    public function store(Request $request, SmsSender $sms): RedirectResponse
    {
        if ($request->filled('password')) {
            $this->authenticateWithPassword($request);
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard', absolute: false));
        }

        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
        ]);

        $phone = $request->string('phone')->toString();
        $isModal = $request->boolean('modal');
        $requestKey = 'login-code-request:'.$phone;
        $ipKey = 'login-code-request-ip:'.$request->ip();

        if ($isModal) {
            $request->session()->put('auth_modal_return_url', $this->modalReturnUrl($request));
        }

        if (RateLimiter::tooManyAttempts($requestKey, 3) || RateLimiter::tooManyAttempts($ipKey, 30)) {
            $seconds = max(RateLimiter::availableIn($requestKey), RateLimiter::availableIn($ipKey));
            $message = 'درخواست‌های زیادی ثبت کرده‌اید. لطفاً '.ceil($seconds / 60).' دقیقه دیگر تلاش کنید.';

            return $isModal
                ? redirect()->to($this->modalReturnUrl($request))->withErrors(['phone' => $message])
                : back()->withErrors(['phone' => $message])->withInput();
        }

        RateLimiter::hit($requestKey, 300);
        RateLimiter::hit($ipKey, 300);

        if (! User::where('phone', $phone)->where('is_active', true)->exists()) {
            $message = 'اگر حساب کاربری ندارید، ابتدا ثبت‌نام کنید.';
            $request->session()->forget(['login_phone', 'login_dev_code']);

            if ($isModal) {
                $request->session()->flash('auth_modal', [
                    'mode' => 'register',
                    'step' => 'phone',
                    'phone' => $phone,
                    'status' => $message,
                ]);

                return redirect()->to($this->modalReturnUrl($request))->with('status', $message);
            }

            return redirect()->route('register', ['phone' => $phone])->with('status', $message);
        }

        $code = (string) random_int(100000, 999999);

        PhoneLoginToken::updateOrCreate(
            ['phone' => $phone],
            [
                'token' => Hash::make($code),
                'created_at' => now(),
            ]
        );

        try {
            $sms->sendOtp($phone, $code);
        } catch (Throwable $exception) {
            report($exception);
            $message = 'ارسال کد ورود ناموفق بود. لطفاً کمی بعد دوباره تلاش کنید.';

            return $isModal
                ? redirect()->to($this->modalReturnUrl($request))->withErrors(['phone' => $message])->withInput()
                : back()->withErrors(['phone' => $message])->withInput();
        }

        $request->session()->put('login_phone', $phone);
        if (app()->environment(['local', 'testing'])) {
            $request->session()->flash('login_dev_code', $code);
        }

        if ($isModal) {
            $modalState = [
                'mode' => 'login',
                'step' => 'code',
                'phone' => $phone,
                'dev_code' => app()->environment(['local', 'testing']) ? $code : null,
                'status' => 'کد ورود به شماره شما پیامک شد.',
            ];

            $request->session()->flash('auth_modal', $modalState);

            return redirect()->to($this->modalReturnUrl($request))
                ->with('status', 'کد ورود به شماره شما پیامک شد.');
        }

        return redirect()->route('login', ['step' => 'code'])->with('status', 'کد ورود به شماره شما پیامک شد.');
    }

    /**
     * Verify the SMS code and authenticate the user.
     *
     * @throws ValidationException
     */
    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'code' => ['required', 'string', 'size:6'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $phone = $request->string('phone')->toString();
        $isModal = $request->boolean('modal');
        $returnUrl = $isModal ? $this->modalReturnUrl($request) : null;
        $sessionPhone = $request->session()->get('login_phone');

        if (! $sessionPhone || ! hash_equals($sessionPhone, $phone)) {
            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'phone', 'نشست ورود منقضی شده است. دوباره شماره موبایل خود را وارد کنید.')
                : throw ValidationException::withMessages(['phone' => 'نشست ورود منقضی شده است. دوباره شماره موبایل خود را وارد کنید.']);
        }

        $verifyKey = 'login-code-verify:'.$phone;
        $verifyIpKey = 'login-code-verify-ip:'.$request->ip();
        if (RateLimiter::tooManyAttempts($verifyKey, 5) || RateLimiter::tooManyAttempts($verifyIpKey, 50)) {
            $seconds = max(RateLimiter::availableIn($verifyKey), RateLimiter::availableIn($verifyIpKey));
            $message = 'تعداد تلاش‌ها بیش از حد مجاز است. لطفاً '.ceil($seconds / 60).' دقیقه دیگر کد جدید بگیرید.';

            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'code', $message)
                : throw ValidationException::withMessages(['code' => $message]);
        }

        $loginToken = PhoneLoginToken::where('phone', $phone)->first();

        if (! $loginToken || $loginToken->created_at->addMinutes(5)->isPast()) {
            $loginToken?->delete();
            $message = 'کد ورود منقضی شده است. کد جدید بگیرید.';

            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'code', $message)
                : throw ValidationException::withMessages(['code' => $message]);
        }

        if (! Hash::check($request->string('code')->toString(), $loginToken->token)) {
            RateLimiter::hit($verifyKey, 300);
            RateLimiter::hit($verifyIpKey, 300);
            $message = 'کد ورود صحیح نیست.';

            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'code', $message)
                : throw ValidationException::withMessages(['code' => $message]);
        }

        $user = User::where('phone', $phone)->where('is_active', true)->first();

        if (! $user) {
            $message = 'امکان ورود با این شماره وجود ندارد.';

            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'phone', $message)
                : throw ValidationException::withMessages(['phone' => $message]);
        }

        RateLimiter::clear($verifyKey);
        RateLimiter::clear($verifyIpKey);
        $loginToken->delete();
        $request->session()->forget(['login_phone', 'login_dev_code', 'auth_modal_return_url', 'auth_modal']);
        $request->session()->regenerate();
        Auth::login($user, $request->boolean('remember'));

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Authenticate any active user with a phone number and password.
     *
     * @throws ValidationException
     */
    private function authenticateWithPassword(Request $request): void
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $phone = $request->string('phone')->toString();
        $phoneKey = 'password-login:'.Str::lower($phone).'|'.$request->ip();
        $ipKey = 'password-login-ip:'.$request->ip();

        if (RateLimiter::tooManyAttempts($phoneKey, 5) || RateLimiter::tooManyAttempts($ipKey, 30)) {
            $seconds = max(RateLimiter::availableIn($phoneKey), RateLimiter::availableIn($ipKey));

            throw ValidationException::withMessages([
                'phone' => 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً '.ceil($seconds / 60).' دقیقه دیگر تلاش کنید.',
            ]);
        }

        $user = User::query()
            ->where('phone', $phone)
            ->where('is_active', true)
            ->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), (string) $user->password)) {
            RateLimiter::hit($phoneKey, 300);
            RateLimiter::hit($ipKey, 300);

            throw ValidationException::withMessages([
                'phone' => 'شماره موبایل یا رمز عبور صحیح نیست.',
            ]);
        }

        RateLimiter::clear($phoneKey);
        RateLimiter::clear($ipKey);
        Auth::login($user, $request->boolean('remember'));
    }

    /**
     * @param array<string, mixed> $extra
     * @return array<string, mixed>
     */
    private function loginProps(array $extra = []): array
    {
        return [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            ...$extra,
        ];
    }

    private function modalReturnUrl(Request $request): string
    {
        $referer = $request->session()->get('auth_modal_return_url')
            ?: $request->header('Referer')
            ?: url()->previous()
            ?: route('home');

        if (Str::startsWith($referer, '/')) {
            return url($referer);
        }

        return Str::startsWith($referer, url('/')) ? $referer : route('home');
    }

    private function modalError(Request $request, string $returnUrl, string $phone, string $field, string $message): RedirectResponse
    {
        $request->session()->flash('auth_modal', [
            'mode' => 'login',
            'step' => 'code',
            'phone' => $phone,
            'dev_code' => app()->environment(['local', 'testing'])
                ? $request->session()->get('login_dev_code')
                : null,
        ]);

        return redirect()->to($returnUrl)->withErrors([$field => $message]);
    }
}
