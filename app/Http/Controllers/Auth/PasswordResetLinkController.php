<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PhonePasswordResetToken;
use App\Models\User;
use App\Services\Sms\SmsSender;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Send a six-digit verification code to the user's phone.
     */
    public function store(Request $request, SmsSender $sms): RedirectResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
        ]);

        $phone = $request->phone;

        $key = 'password-reset:'.$phone;
        $ipKey = 'password-reset-ip:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 3) || RateLimiter::tooManyAttempts($ipKey, 30)) {
            $seconds = max(RateLimiter::availableIn($key), RateLimiter::availableIn($ipKey));

            return back()->withErrors([
                'phone' => 'درخواست‌های زیادی ثبت کرده‌اید. لطفاً '.ceil($seconds / 60).' دقیقه دیگر تلاش کنید.',
            ])->withInput();
        }
        RateLimiter::hit($key, 300);
        RateLimiter::hit($ipKey, 300);

        // Never reveal whether a phone is registered.
        if (! User::where('phone', $phone)->exists()) {
            return back()->with('status', 'اگر این شماره در سیستم ثبت شده باشد، کد تأیید برای شما پیامک می‌شود.');
        }

        $code = (string) random_int(100000, 999999);

        PhonePasswordResetToken::updateOrCreate(
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

            return back()->withErrors([
                'phone' => 'ارسال کد تأیید ناموفق بود. لطفاً کمی بعد دوباره تلاش کنید.',
            ])->withInput();
        }

        session()->flash('reset_phone', $phone);

        // Development aid: expose the code on the reset screen only outside production.
        if (app()->environment(['local', 'testing'])) {
            session()->flash('dev_code', $code);
        }

        return redirect()->route('password.reset')->with('status', 'کد تأیید به شماره شما پیامک شد.');
    }
}
