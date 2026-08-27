<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminLoginRequest extends FormRequest
{
    /** @var array<int, string> */
    private const ADMIN_ROLES = ['super-admin', 'admin', 'editor', 'instructor', 'coach'];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        $phone = $this->string('phone')->toString();
        $password = $this->string('password')->toString();
        $user = User::query()
            ->where('phone', $phone)
            ->where('is_active', true)
            ->first();

        if (! $user || ! $user->hasAnyRole(self::ADMIN_ROLES) || ! Hash::check($password, (string) $user->password)) {
            RateLimiter::hit($this->throttleKey(), 300);
            RateLimiter::hit($this->ipThrottleKey(), 300);
            Log::warning('Admin login failed', [
                'phone_hash' => hash('sha256', $phone),
                'ip' => $this->ip(),
            ]);

            throw ValidationException::withMessages([
                'phone' => 'شماره موبایل یا رمز عبور صحیح نیست.',
            ]);
        }

        // Admin accounts must not be accessible with the default/placeholder
        // password. Anyone still using it is forced to change it in their
        // profile before they can enter the admin panel.
        if (Hash::check($this->defaultPassword(), (string) $user->password)) {
            RateLimiter::hit($this->throttleKey(), 300);
            RateLimiter::hit($this->ipThrottleKey(), 300);

            throw ValidationException::withMessages([
                'password' => 'رمز عبور پیش‌فرض را قبل از ورود به پنل تغییر دهید.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
        RateLimiter::clear($this->ipThrottleKey());
        Auth::login($user, $this->boolean('remember'));
        Log::info('Admin login succeeded', [
            'user_id' => $user->getKey(),
            'ip' => $this->ip(),
        ]);
    }

    /**
     * @throws ValidationException
     */
    private function ensureIsNotRateLimited(): void
    {
        $phoneKey = $this->throttleKey();
        $ipKey = $this->ipThrottleKey();

        if (! RateLimiter::tooManyAttempts($phoneKey, 5) && ! RateLimiter::tooManyAttempts($ipKey, 30)) {
            return;
        }

        event(new Lockout($this));

        $seconds = max(RateLimiter::availableIn($phoneKey), RateLimiter::availableIn($ipKey));

        throw ValidationException::withMessages([
            'phone' => 'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً '.ceil($seconds / 60).' دقیقه دیگر تلاش کنید.',
        ]);
    }

    private function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('phone')->toString()).'|'.$this->ip());
    }

    private function ipThrottleKey(): string
    {
        return 'admin-login-ip:'.$this->ip();
    }

    /**
     * The default password an admin account ships with until it is changed.
     * Keep in sync with UserFactory and AdminUserSeeder so the guard only ever
     * blocks accounts that were never given a real password.
     */
    private function defaultPassword(): string
    {
        return 'password';
    }
}
