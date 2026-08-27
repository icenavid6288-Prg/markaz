<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\CoachAvailability;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CoachController extends Controller
{
    public function show(Request $request, Coach $coach): Response
    {
        abort_unless($coach->user?->is_active, 404);

        $avatarUrl = static function (?string $avatar): ?string {
            if (! $avatar) {
                return null;
            }

            return preg_match('/^https?:\\/\\//', $avatar) === 1
                ? $avatar
                : asset(ltrim($avatar, '/'));
        };

        // Sessions and availability are keyed by the coach's user id.
        $sessions = $coach->sessions()->get();

        $availability = CoachAvailability::query()
            ->where('coach_id', $coach->user_id)
            ->where('is_booked', false)
            ->whereDate('available_date', '>=', now()->toDateString())
            ->orderBy('available_date')
            ->orderBy('start_time')
            ->limit(12)
            ->get();

        $name = $coach->user?->name ?? 'کوچ';
        $bio = $coach->user?->bio ?: $coach->bio;
        $avatar = $avatarUrl($coach->user?->avatar);

        $seo = Seo::page(
            $request,
            "{$name} | کوچ مرکز رشد و کارآفرینی دکتر بیدی",
            $bio
                ?: "جلسات کوچینگ {$name} برای شناخت استعداد، ساخت مهارت و طراحی مسیر آینده نوجوان؛ همراهی اختصاصی برای نوجوان و خانواده.",
            null,
            [
                '@type' => 'ProfilePage',
                'mainEntity' => [
                    '@type' => 'Person',
                    'name' => $name,
                    'url' => url('/coaches/'.$coach->id),
                    'jobTitle' => $coach->specialty,
                ],
            ],
            $avatar,
        );

        return Inertia::render('Coaches/Show', [
            'seo' => $seo,
            'coach' => [
                'id' => $coach->id,
                'name' => $name,
                'avatar' => $avatar,
                'specialty' => $coach->specialty,
                'bio' => $bio,
                'experience_years' => $coach->experience_years,
                'hourly_rate' => $coach->hourly_rate,
                'rating' => $coach->rating,
                'is_featured' => $coach->is_featured,
                'is_available' => $coach->is_available,
            ],
            'stats' => [
                'sessions' => $sessions->count(),
                'students' => $sessions->pluck('student_id')->unique()->count(),
                'completed' => $sessions->where('status', 'completed')->count(),
            ],
            'availability' => $availability->map(fn ($slot) => [
                'id' => $slot->id,
                'coach_id' => $slot->coach_id,
                'date' => $slot->available_date?->toISOString(),
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
            ])->values(),
        ]);
    }
}
