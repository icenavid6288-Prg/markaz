<?php

namespace App\Http\Controllers;

use App\Models\Referral;
use App\Models\User;
use App\Services\Referrals\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReferralController extends Controller
{
    public function index(Request $request, ReferralService $service): Response
    {
        $user = $request->user();
        $code = $service->ensureCode($user);
        $referrals = Referral::query()
            ->with('referred:id,name,created_at')
            ->where('referrer_id', $user->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Referral $referral) => [
                'id' => $referral->id,
                'name' => $referral->referred?->name,
                'created_at' => $referral->referred?->created_at?->toISOString(),
                'coupon_code' => $referral->coupon_code,
                'rewarded' => $referral->rewarded_at !== null,
            ]);

        return Inertia::render('Dashboard/Referrals', [
            'code' => $code,
            'invite_url' => route('invite', $code),
            'count' => $referrals->count(),
            'reward_percent' => ReferralService::REFERRER_DISCOUNT_PERCENT,
            'referrals' => $referrals,
        ]);
    }

    public function invite(string $code, ReferralService $service): Response
    {
        $referrer = User::query()->where('referral_code', mb_strtoupper($code))->where('is_active', true)->first();

        if (! $referrer) {
            abort(404);
        }

        return Inertia::render('Invite', [
            'referrer_name' => $referrer->name,
            'code' => mb_strtoupper($code),
        ]);
    }

    public function lookup(Request $request): JsonResponse
    {
        $code = mb_strtoupper(trim((string) $request->string('code')));

        if ($code === '') {
            return response()->json(['valid' => false]);
        }

        $referrer = User::query()->where('referral_code', $code)->where('is_active', true)->first();

        return response()->json([
            'valid' => (bool) $referrer,
            'name' => $referrer?->name,
        ]);
    }
}
