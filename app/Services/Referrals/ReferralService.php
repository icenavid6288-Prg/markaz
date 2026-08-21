<?php

namespace App\Services\Referrals;

use App\Models\Coupon;
use App\Models\Referral;
use App\Models\User;
use Illuminate\Support\Str;

class ReferralService
{
    public const REFERRER_DISCOUNT_PERCENT = 10;

    public const REFERRED_DISCOUNT_PERCENT = 5;

    public function ensureCode(User $user): string
    {
        if ($user->referral_code) {
            return $user->referral_code;
        }

        $code = $this->uniqueCode();
        $user->forceFill(['referral_code' => $code])->save();

        return $code;
    }

    /** @return array{referrer: User, referred: User, coupon: Coupon}|null */
    public function redeem(?string $code, User $referred): ?array
    {
        if (! $code) {
            return null;
        }

        $code = mb_strtoupper(trim($code));
        $referrer = User::query()->where('referral_code', $code)->where('is_active', true)->first();

        if (! $referrer || $referrer->id === $referred->id) {
            return null;
        }

        $this->ensureCode($referrer);
        $this->ensureCode($referred);

        $referral = Referral::query()->firstOrCreate(
            ['referrer_id' => $referrer->id, 'referred_id' => $referred->id],
            ['rewarded_at' => null],
        );

        if ($referral->rewarded_at !== null) {
            return null;
        }

        $referrerCoupon = $this->createCoupon($referrer, self::REFERRER_DISCOUNT_PERCENT);
        $referredCoupon = $this->createCoupon($referred, self::REFERRED_DISCOUNT_PERCENT);

        $referral->update([
            'coupon_code' => $referrerCoupon->code,
            'rewarded_at' => now(),
        ]);

        return [
            'referrer' => $referrer,
            'referred' => $referred,
            'coupon' => $referrerCoupon,
        ];
    }

    private function uniqueCode(): string
    {
        do {
            $code = mb_strtoupper(Str::random(7));
        } while (User::query()->where('referral_code', $code)->exists());

        return $code;
    }

    private function createCoupon(User $user, int $percent): Coupon
    {
        do {
            $code = 'GIFT'.mb_strtoupper(Str::random(6));
        } while (Coupon::query()->where('code', $code)->exists());

        return Coupon::create([
            'code' => $code,
            'type' => 'percent',
            'value' => $percent,
            'max_uses' => 1,
            'used_count' => 0,
            'min_order' => 0,
            'expires_at' => now()->addMonths(3),
            'is_active' => true,
        ]);
    }
}
