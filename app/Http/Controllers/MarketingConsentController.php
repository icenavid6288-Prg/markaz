<?php

namespace App\Http\Controllers;

use App\Models\MarketingConsent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MarketingConsentController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'sms' => ['sometimes', 'boolean'],
            'email_marketing' => ['sometimes', 'boolean'],
            'in_app' => ['sometimes', 'boolean'],
        ]);
        $user = $request->user();
        $consent = MarketingConsent::updateOrCreate(
            ['user_id' => $user->id],
            ['phone' => $user->phone, 'email' => $user->email, ...$data, 'consented_at' => now(), 'revoked_at' => collect($data)->contains(false) ? now() : null],
        );
        $consent->touch();

        return back()->with('success', 'تنظیمات دریافت پیام‌های شما ذخیره شد.');
    }
}
