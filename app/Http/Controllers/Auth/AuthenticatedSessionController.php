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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
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
            'dev_code' => $showCodeStep && $this->otpCodeEnabled()
                ? $request->session()->get('login_dev_code')
                : null,
        ]));
    }

    /**
     * Display the administrator password login screen.
     */
    public function adminCreate(Request $request): Response
    {
        return Inertia::render('Auth/AdminLogin', [
            'status' => session('status'),
        ]);
    }

    /**
     * Authenticate an administrator with the dedicated password form.
     */
    public function adminStore(AdminLoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard', absolute: false));
    }

    /**
     * Legacy endpoint retained for existing OTP links.
     */
    public function adminCreateLegacy(Request $request): Response
    {
        if ($request->boolean('fresh')) {
            $request->session()->forget(['admin_login_phone', 'admin_login_dev_code']);
        }

        $phone = $request->session()->get('admin_login_phone');
        $showCodeStep = $request->query('step') === 'code' && filled($phone);

        return Inertia::render('Auth/AdminLogin', [
            'status' => session('status'),
            'step' => $showCodeStep ? 'code' : 'phone',
            'phone' => $showCodeStep ? $phone : '',
            'dev_code' => $showCodeStep && $this->otpCodeEnabled()
                ? $request->session()->get('admin_login_dev_code')
                : null,
        ]);
    }

    /**
     * Send a one-time SMS code to an administrator. Passwords are never accepted.
     */
    public function adminStoreOtp(Request $request, SmsSender $sms): RedirectResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
        ]);

        $phone = $request->string('phone')->toString();
        $requestKey = 'admin-login-code-request:'.$phone;
        $ipKey = 'admin-login-code-request-ip:'.$request->ip();

        if (RateLimiter::tooManyAttempts($requestKey, 3) || RateLimiter::tooManyAttempts($ipKey, 30)) {
            $seconds = max(RateLimiter::availableIn($requestKey), RateLimiter::availableIn($ipKey));

            return back()->withErrors([
                'phone' => 'درخواست‌های زیادی ثبت کرده‌اید. لطفاً '.ceil($seconds / 60).' دقیقه دیگر تلاش کنید.',
            ])->withInput();
        }

        RateLimiter::hit($requestKey, 300);
        RateLimiter::hit($ipKey, 300);

        $user = User::query()->where('phone', $phone)->first();

        if (! $user || ! $user->canAccessAdminPanel()) {
            $request->session()->forget(['admin_login_phone', 'admin_login_dev_code']);
            Log::warning('Admin OTP login rejected', [
                'phone_hash' => hash('sha256', $phone),
                'ip' => $request->ip(),
            ]);

            return back()->withErrors([
                'phone' => 'امکان ورود به پنل با این شماره وجود ندارد.',
            ])->withInput();
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
            Log::error('Admin OTP SMS failed', [
                'phone_hash' => hash('sha256', $phone),
                'error' => $exception->getMessage(),
            ]);

            if ($this->otpCodeEnabled()) {
                $request->session()->put('admin_login_phone', $phone);
                $request->session()->flash('admin_login_dev_code', $code);

                return redirect()->route('admin.login', ['step' => 'code'])
                    ->with('status', 'ارسال پیامک در دسترس نبود؛ کد ورود روی صفحه نمایش داده شد.');
            }

            return back()->withErrors([
                'phone' => 'ارسال کد ورود ناموفق بود. لطفاً کمی بعد دوباره تلاش کنید.',
            ])->withInput();
        }

        $request->session()->put('admin_login_phone', $phone);
        if ($this->otpCodeEnabled()) {
            $request->session()->flash('admin_login_dev_code', $code);
        }

        return redirect()->route('admin.login', ['step' => 'code'])
            ->with('status', 'کد ورود به شماره شما پیامک شد.');
    }

    /**
     * Verify the administrator SMS code and open the admin panel.
     *
     * @throws ValidationException
     */
    public function adminVerify(Request $request): RedirectResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $phone = $request->string('phone')->toString();
        $sessionPhone = $request->session()->get('admin_login_phone');

        if (! $sessionPhone || ! hash_equals($sessionPhone, $phone)) {
            throw ValidationException::withMessages([
                'phone' => 'نشست ورود منقضی شده است. دوباره شماره موبایل خود را وارد کنید.',
            ]);
        }

        $verifyKey = 'admin-login-code-verify:'.$phone;
        $verifyIpKey = 'admin-login-code-verify-ip:'.$request->ip();

        if (RateLimiter::tooManyAttempts($verifyKey, 5) || RateLimiter::tooManyAttempts($verifyIpKey, 50)) {
            $seconds = max(RateLimiter::availableIn($verifyKey), RateLimiter::availableIn($verifyIpKey));

            throw ValidationException::withMessages([
                'code' => 'تعداد تلاش‌ها بیش از حد مجاز است. لطفاً '.ceil($seconds / 60).' دقیقه دیگر کد جدید بگیرید.',
            ]);
        }

        $loginToken = PhoneLoginToken::where('phone', $phone)->first();

        if (! $loginToken || $loginToken->created_at->addMinutes(5)->isPast()) {
            $loginToken?->delete();

            throw ValidationException::withMessages([
                'code' => 'کد ورود منقضی شده است. کد جدید بگیرید.',
            ]);
        }

        if (! Hash::check($request->string('code')->toString(), $loginToken->token)) {
            RateLimiter::hit($verifyKey, 300);
            RateLimiter::hit($verifyIpKey, 300);

            throw ValidationException::withMessages([
                'code' => 'کد ورود صحیح نیست.',
            ]);
        }

        $user = User::query()->where('phone', $phone)->first();

        if (! $user || ! $user->canAccessAdminPanel()) {
            throw ValidationException::withMessages([
                'phone' => 'امکان ورود به پنل با این شماره وجود ندارد.',
            ]);
        }

        RateLimiter::clear($verifyKey);
        RateLimiter::clear($verifyIpKey);
        $loginToken->delete();
        $request->session()->forget(['admin_login_phone', 'admin_login_dev_code']);
        $request->session()->regenerate();
        Auth::login($user);
        Log::info('Admin OTP login succeeded', [
            'user_id' => $user->getKey(),
            'ip' => $request->ip(),
        ]);

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
            'dev_code' => $this->otpCodeEnabled() ? $request->session()->get('login_dev_code') : null,
        ]));
    }

    /**
     * Send a one-time SMS login code. User login never accepts passwords.
     */
    public function store(Request $request, SmsSender $sms): RedirectResponse
    {
        $phone = $request->string('phone')->toString();
        $isModal = $request->boolean('modal');

        // ── OTP-based login (phone only, send SMS code) ──
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
        ]);

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
            Log::error('Login OTP SMS failed', [
                'phone_hash' => hash('sha256', $phone),
                'error' => $exception->getMessage(),
            ]);

            // In debug/non-production environments an SMS provider is often not
            // available (or not configured). Surface the generated code instead of
            // deadlocking login, so development and preview keep working.
            if ($this->otpCodeEnabled()) {
                $request->session()->put('login_phone', $phone);
                $request->session()->flash('login_dev_code', $code);

                if ($isModal) {
                    $request->session()->flash('auth_modal', [
                        'mode' => 'login',
                        'step' => 'code',
                        'phone' => $phone,
                        'dev_code' => $code,
                        'status' => 'ارسال پیامک در دسترس نبود؛ کد ورود روی صفحه نمایش داده شد.',
                    ]);

                    return redirect()->to($this->modalReturnUrl($request))
                        ->with('status', 'ارسال پیامک در دسترس نبود؛ کد ورود روی صفحه نمایش داده شد.');
                }

                return redirect()->route('login', ['step' => 'code'])
                    ->with('status', 'ارسال پیامک در دسترس نبود؛ کد ورود روی صفحه نمایش داده شد.');
            }

            $message = 'ارسال کد ورود ناموفق بود. لطفاً کمی بعد دوباره تلاش کنید.';

            return $isModal
                ? redirect()->to($this->modalReturnUrl($request))->withErrors(['phone' => $message])->withInput()
                : back()->withErrors(['phone' => $message])->withInput();
        }

        $request->session()->put('login_phone', $phone);
        if ($this->otpCodeEnabled()) {
            $request->session()->flash('login_dev_code', $code);
        }

        if ($isModal) {
            $modalState = [
                'mode' => 'login',
                'step' => 'code',
                'phone' => $phone,
                'dev_code' => $this->otpCodeEnabled() ? $code : null,
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
        Auth::login($user);

        return $isModal
            ? redirect()->to(route('dashboard', absolute: false))
            : redirect()->intended(route('dashboard', absolute: false));
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
     * @param array<string, mixed> $extra
     * @return array<string, mixed>
     */
    private function loginProps(array $extra = []): array
    {
        return [
            'status' => session('status'),
            ...$extra,
        ];
    }

    /**
     * Whether the generated OTP code should be surfaced on screen instead of
     * relying on SMS delivery. Enabled in every non-production environment so
     * development and preview keep working even without a configured SMS panel.
     */
    private function otpCodeEnabled(): bool
    {
        return ! app()->environment('production');
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
            'dev_code' => $this->otpCodeEnabled()
                ? $request->session()->get('login_dev_code')
                : null,
        ]);

        return redirect()->to($returnUrl)->withErrors([$field => $message]);
    }
}
