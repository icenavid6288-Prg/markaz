<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Service;
use App\Models\Testimonial;
use App\Models\Setting;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AboutController extends Controller
{
    public function index(Request $request): Response
    {
        $seo = Seo::page(
            $request,
            'درباره مرکز رشد و کارآفرینی دکتر بیدی',
            'با مرکز رشد و کارآفرینی دکتر بیدی، رویکرد ما به آموزش، کوچینگ و طراحی مسیر آینده نوجوانان را بشناسید.',
            null,
            [
                '@type' => 'AboutPage',
                'mainEntity' => [
                    '@type' => 'Organization',
                    'name' => (string) Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی'),
                    'url' => url('/about'),
                    'address' => [
                        '@type' => 'PostalAddress',
                        'streetAddress' => (string) Setting::get('address', ''),
                        'addressCountry' => 'IR',
                    ],
                ],
            ],
        );

        $avatarUrl = static function (?string $avatar): ?string {
            if (! $avatar) {
                return null;
            }

            return preg_match('/^https?:\\/\\//', $avatar) === 1
                ? $avatar
                : asset(ltrim($avatar, '/'));
        };

        $founderInstructor = Instructor::with('user')
            ->whereHas('user', fn ($query) => $query->where('name', 'like', '%دکتر بیدی%'))
            ->first();
        $founderCoach = Coach::with('user')
            ->whereHas('user', fn ($query) => $query->where('name', 'like', '%دکتر بیدی%'))
            ->first();
        $founder = $founderInstructor ?? $founderCoach;
        $founderUser = $founderInstructor?->user ?? $founderCoach?->user;
        $founderUserId = $founderUser?->id;

        $founderProfile = $founder ? [
            'name' => $founderUser?->name,
            'avatar' => $avatarUrl($founderUser?->avatar),
            'bio' => $founderUser?->bio ?: $founder->bio,
            'specialty' => $founderInstructor?->specialty ?: $founderCoach?->specialty,
            'experience_years' => $founderInstructor?->experience_years ?: $founderCoach?->experience_years,
            'rating' => $founderCoach?->rating,
            'role' => 'بنیان‌گذار و مدیر مرکز',
        ] : null;

        $mapInstructor = static function (Instructor $instructor) use ($avatarUrl): array {
            return [
                'id' => $instructor->id,
            'name' => $instructor->user?->name,
            'avatar' => $avatarUrl($instructor->user?->avatar),
            'specialty' => $instructor->specialty,
            'bio' => $instructor->user?->bio ?: $instructor->bio,
            'experience_years' => $instructor->experience_years,
            'is_featured' => $instructor->is_featured,
                'role' => 'مدرس و مربی',
            ];
        };
        $mapCoach = static function (Coach $coach) use ($avatarUrl): array {
            return [
                'id' => $coach->id,
            'name' => $coach->user?->name,
            'avatar' => $avatarUrl($coach->user?->avatar),
            'specialty' => $coach->specialty,
            'bio' => $coach->user?->bio ?: $coach->bio,
            'experience_years' => $coach->experience_years,
            'rating' => $coach->rating,
            'is_featured' => $coach->is_featured,
                'role' => 'کوچ رشد و مسیر آینده',
                'profile_id' => $coach->id,
            ];
        };

        $instructorsQuery = Instructor::with('user')
            ->whereHas('user', fn ($query) => $query->where('is_active', true))
            ->when($founderUserId, fn ($query) => $query->where('user_id', '!=', $founderUserId))
            ->orderByDesc('is_featured')
            ->orderBy('id');
        $coachesQuery = Coach::with('user')
            ->whereHas('user', fn ($query) => $query->where('is_active', true))
            ->when($founderUserId, fn ($query) => $query->where('user_id', '!=', $founderUserId))
            ->orderByDesc('is_featured')
            ->orderBy('id');

        return Inertia::render('About/Index', [
            'seo' => $seo,
            'stats' => [
                ['value' => (int) Setting::get('stat_students', 2500), 'suffix' => '+', 'label' => 'نوجوان همراه ما'],
                ['value' => (int) Setting::get('stat_courses', 120), 'suffix' => '+', 'label' => 'دوره آموزشی'],
                ['value' => (int) Setting::get('stat_team', 50), 'suffix' => '+', 'label' => 'مدرس و کوچ'],
                ['value' => (int) Setting::get('stat_experience', 8), 'suffix' => '+', 'label' => 'سال تجربه کاری'],
            ],
            'founder' => $founderProfile,
            'instructors' => $instructorsQuery->limit(6)->get()->map($mapInstructor)->values(),
            'coaches' => $coachesQuery->limit(6)->get()->map($mapCoach)->values(),
            'services' => Service::active()->limit(4)->get(),
            'testimonials' => Testimonial::approved()->limit(3)->get(),
            'course_count' => Course::published()->count(),
        ]);
    }
}
