<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\CoachAvailability;
use App\Models\Service;
use App\Models\Testimonial;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CoachingController extends Controller
{
    public function index(Request $request): Response
    {
        $coaches = Coach::with('user')->where('is_available', true)->get()->map(fn ($coach) => [
            'id' => $coach->id,
            'user_id' => $coach->user_id,
            'name' => $coach->user?->name,
            'specialty' => $coach->specialty,
            'bio' => $coach->bio,
            'experience_years' => $coach->experience_years,
            'hourly_rate' => $coach->hourly_rate,
            'rating' => $coach->rating,
            'is_featured' => $coach->is_featured,
        ]);
        $availability = CoachAvailability::query()
            ->with('coach')
            ->where('is_booked', false)
            ->whereDate('available_date', '>=', now()->toDateString())
            ->orderBy('available_date')
            ->orderBy('start_time')
            ->limit(24)
            ->get()
            ->map(fn ($slot) => [
                'id' => $slot->id,
                'coach_id' => $slot->coach_id,
                'coach_name' => $slot->coach?->name,
                'date' => $slot->available_date?->toISOString(),
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
            ])->values();
        $services = Service::active()->where('is_featured', true)->limit(3)->get();
        $seo = Seo::page(
            $request,
            'کوچینگ نوجوان و رشد فردی',
            'کوچ اختصاصی برای شناخت استعداد، ساخت مهارت و طراحی مسیر آینده نوجوان با همراهی خانواده.',
            null,
            [
                '@type' => 'Service',
                'name' => 'خدمات کوچینگ مرکز رشد و کارآفرینی دکتر بیدی',
                'serviceType' => 'Teen and personal growth coaching',
                'provider' => [
                    '@type' => 'Organization',
                    'name' => 'مرکز رشد و کارآفرینی دکتر بیدی',
                ],
            ],
        );

        return Inertia::render('Coaching/Index', [
            'seo' => $seo,
            'coaches' => $coaches,
            'availability' => $availability,
            'services' => $services,
            'testimonials' => Testimonial::approved()->limit(3)->get(),
        ]);
    }
}
