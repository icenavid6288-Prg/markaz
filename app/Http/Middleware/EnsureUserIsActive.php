<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_active) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $token = $user->currentAccessToken();
                if ($token) {
                    $token->delete();
                }

                return response()->json(['message' => 'حساب کاربری شما غیرفعال است.'], 403);
            }

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            $redirectTo = $request->is('admin') || $request->is('admin/*')
                ? route('admin.login')
                : route('login');

            return redirect($redirectTo)->withErrors([
                'phone' => 'حساب کاربری شما غیرفعال شده است.',
            ]);
        }

        return $next($request);
    }
}
