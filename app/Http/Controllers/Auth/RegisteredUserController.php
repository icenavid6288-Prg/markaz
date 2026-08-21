<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PhoneLoginToken;
use App\Models\User;
use App\Services\Crm\LeadService;
use App\Services\Marketing\MarketingCampaignDispatcher;
use App\Services\Referrals\ReferralService;
use App\Services\Sms\SmsSender;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view (form or SMS-code step).
     */
    public function create(Request $request): Response
    {
        if ($request->boolean('fresh')) {
            $request->session()->forget(['register_phone', 'register_data', 'register_dev_code']);
        }

        $phone = $request->session()->get('register_phone');
        $showCodeStep = $request->query('step') === 'code' && filled($phone);

        return Inertia::render('Auth/Register', [
            'status' => $request->session()->get('status'),
            'step' => $showCodeStep ? 'code' : 'form',
            'phone' => $showCodeStep ? $phone : '',
            'dev_code' => $showCodeStep && app()->environment(['local', 'testing'])
                ? $request->session()->get('register_dev_code')
                : null,
        ]);
    }

    /**
     * Validate the registration details, send a one-time code to the phone
     * number and queue the registration until the number is verified.
     *
     * @throws ValidationException
     */
    public function store(Request $request, SmsSender $sms): RedirectResponse
    {
        $pending = $request->session()->get('register_data');
        $resending = is_array($pending)
            && $request->string('phone')->toString() === (string) ($pending['phone'] ?? '');

        $rules = [
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
        ];

        if (! $resending) {
            $rules['name'] = 'required|string|max:255';
            $rules['phone'][] = 'unique:'.User::class;
            $rules['password'] = ['required', 'confirmed', Rules\Password::defaults()];
            $rules['referral_code'] = ['nullable', 'string', 'max:12'];
        }

        $request->validate($rules);

        $phone = $request->string('phone')->toString();
        $requestKey = 'register-code-request:'.$phone;
        $ipKey = 'register-code-request-ip:'.$request->ip();

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
            [
                'token' => Hash::make($code),
                'created_at' => now(),
            ]
        );

        try {
            $sms->sendOtp($phone, $code);
        } catch (Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'phone' => 'ارسال کد تأیید ناموفق بود. لطفاً کمی بعد دوباره تلاش کنید.',
            ]);
        }

        $request->session()->put('register_phone', $phone);

        if (! $resending) {
            $request->session()->put('register_data', [
                'name' => $request->string('name')->toString(),
                'phone' => $phone,
                'password' => Hash::make($request->string('password')->toString()),
                'referral_code' => $request->string('referral_code')->toString() ?: null,
            ]);
        }

        if (app()->environment(['local', 'testing'])) {
            $request->session()->flash('register_dev_code', $code);
        }

        $isModal = $request->boolean('modal');
        $status = 'کد تأیید به شماره شما پیامک شد؛ با وارد کردن آن، ثبت‌نام تکمیل می‌شود.';

        if ($isModal) {
            $request->session()->put('auth_modal_return_url', $this->modalReturnUrl($request));
            $request->session()->flash('auth_modal', [
                'mode' => 'register',
                'step' => 'code',
                'phone' => $phone,
                'dev_code' => app()->environment(['local', 'testing']) ? $code : null,
                'status' => $status,
            ]);

            return redirect()->to($this->modalReturnUrl($request))->with('status', $status);
        }

        return redirect()->route('register', ['step' => 'code'])
            ->with('status', $status);
    }

    /**
     * Verify the one-time code and complete the registration.
     *
     * @throws ValidationException
     */
    public function verify(Request $request, ReferralService $referrals, MarketingCampaignDispatcher $marketing, LeadService $leads): RedirectResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $phone = $request->string('phone')->toString();
        $isModal = $request->boolean('modal');
        $returnUrl = $isModal ? $this->modalReturnUrl($request) : null;
        $sessionPhone = $request->session()->get('register_phone');
        $pending = $request->session()->get('register_data');

        if (! $sessionPhone || ! hash_equals($sessionPhone, $phone) || ! is_array($pending) || blank($pending['name'] ?? null)) {
            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'phone', 'نشست ثبت‌نام منقضی شده است. دوباره فرم را تکمیل کنید.')
                : throw ValidationException::withMessages([
                    'phone' => 'نشست ثبت‌نام منقضی شده است. دوباره فرم را تکمیل کنید.',
                ]);
        }

        $verifyKey = 'register-code-verify:'.$phone;
        $verifyIpKey = 'register-code-verify-ip:'.$request->ip();

        if (RateLimiter::tooManyAttempts($verifyKey, 5) || RateLimiter::tooManyAttempts($verifyIpKey, 30)) {
            $seconds = max(RateLimiter::availableIn($verifyKey), RateLimiter::availableIn($verifyIpKey));
            $message = 'تعداد تلاش‌ها بیش از حد مجاز است. لطفاً '.ceil($seconds / 60).' دقیقه دیگر کد جدید بگیرید.';

            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'code', $message)
                : throw ValidationException::withMessages(['code' => $message]);
        }

        $token = PhoneLoginToken::where('phone', $phone)->first();

        if (! $token || $token->created_at->addMinutes(5)->isPast()) {
            $token?->delete();

            $message = 'کد تأیید منقضی شده است. دوباره درخواست دهید.';

            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'code', $message)
                : throw ValidationException::withMessages(['code' => $message]);
        }

        if (! Hash::check($request->string('code')->toString(), $token->token)) {
            RateLimiter::hit($verifyKey, 300);
            RateLimiter::hit($verifyIpKey, 300);
            $message = 'کد واردشده صحیح نیست.';

            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'code', $message)
                : throw ValidationException::withMessages(['code' => $message]);
        }

        // The number may have been registered elsewhere while the code was pending.
        if (User::where('phone', $phone)->exists()) {
            $message = 'شماره موبایل قبلاً ثبت شده است. وارد حساب خود شوید.';

            return $isModal
                ? $this->modalError($request, $returnUrl, $phone, 'phone', $message)
                : throw ValidationException::withMessages(['phone' => $message]);
        }

        RateLimiter::clear($verifyKey);
        RateLimiter::clear($verifyIpKey);
        $token->delete();

        $user = User::create([
            'name' => $pending['name'],
            'phone' => $pending['phone'],
            'password' => $pending['password'],
        ]);
        $user->assignDefaultCustomerRole();

        $referrals->redeem($pending['referral_code'] ?? null, $user);

        $this->syncLeadFromUser($user, $marketing, $leads);

        event(new Registered($user));

        $request->session()->forget(['register_phone', 'register_data', 'register_dev_code', 'auth_modal_return_url', 'auth_modal']);
        $request->session()->regenerate();
        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
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
            'mode' => 'register',
            'step' => 'code',
            'phone' => $phone,
            'dev_code' => app()->environment(['local', 'testing']) ? $request->session()->get('register_dev_code') : null,
        ]);

        return redirect()->to($returnUrl)->withErrors([$field => $message]);
    }

    private function syncLeadFromUser(User $user, MarketingCampaignDispatcher $marketing, LeadService $leads): void
    {
        $lead = $leads->findOrCreate((string) $user->phone, $user->name);

        $lead->fill(['name' => $user->name, 'email' => $user->email, 'source' => 'registration'])->save();
        $leads->linkToUser($lead, $user, 'لید از ثبت‌نام در سایت ('.now()->format('Y/m/d H:i').')');

        $marketing->dispatchForTrigger('lead_created', [
            'name' => $lead->name,
            'phone' => $lead->phone,
            'email' => $lead->email,
        ]);
    }
}
