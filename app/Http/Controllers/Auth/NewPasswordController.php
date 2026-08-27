<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PhonePasswordResetToken;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Display the password reset view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'phone' => session('reset_phone', ''),
            'dev_code' => app()->environment(['local', 'testing']) ? session('dev_code') : null,
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming new password request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'regex:/^09\d{9}$/'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $token = PhonePasswordResetToken::where('phone', $request->phone)->first();

        if (! $token || ! Hash::check($request->code, $token->token)) {
            throw ValidationException::withMessages([
                'code' => 'کد واردشده صحیح نیست.',
            ]);
        }

        if ($token->created_at->addMinutes(10)->isPast()) {
            $token->delete();

            throw ValidationException::withMessages([
                'code' => 'کد تأیید منقضی شده است. دوباره درخواست دهید.',
            ]);
        }

        $user = User::where('phone', $request->phone)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'phone' => 'کاربری با این شماره یافت نشد.',
            ]);
        }

        // The User model hashes the password via the 'hashed' cast.
        $user->forceFill([
            'password' => $request->password,
            'remember_token' => Str::random(60),
        ])->save();

        $token->delete();
        session()->forget(['reset_phone', 'dev_code']);

        event(new PasswordReset($user));

        return redirect()->route('login')->with('status', 'رمز عبور شما با موفقیت تغییر کرد. با شماره موبایل وارد شوید.');
    }
}
