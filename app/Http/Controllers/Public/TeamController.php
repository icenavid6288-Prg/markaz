<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\Instructor;
use App\Models\TeamMember;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        $avatarUrl = static function (?string $avatar): ?string {
            if (! $avatar) {
                return null;
            }

            return preg_match('/^https?:\\/\\//', $avatar) === 1
                ? $avatar
                : asset(ltrim($avatar, '/'));
        };

        $mapInstructor = static function (Instructor $instructor) use ($avatarUrl): array {
            return [
                'id' => $instructor->id,
                'name' => $instructor->user?->name ?? 'مدرس',
                'avatar' => $avatarUrl($instructor->user?->avatar),
                'specialty' => $instructor->specialty,
                'bio' => $instructor->user?->bio ?: $instructor->bio,
                'experience_years' => $instructor->experience_years,
                'is_featured' => $instructor->is_featured,
                'role' => 'مدرس و مربی',
                // Only account-holding instructors have a public profile page.
                'profile_id' => $instructor->id,
            ];
        };
        $mapCoach = static function (Coach $coach) use ($avatarUrl): array {
            return [
                'id' => $coach->id,
                'name' => $coach->user?->name ?? 'کوچ',
                'avatar' => $avatarUrl($coach->user?->avatar),
                'specialty' => $coach->specialty,
                'bio' => $coach->user?->bio ?: $coach->bio,
                'experience_years' => $coach->experience_years,
                'rating' => $coach->rating,
                'is_featured' => $coach->is_featured,
                'role' => 'کوچ رشد و مسیر آینده',
                // Account-holding coaches have a public profile page.
                'profile_id' => $coach->id,
            ];
        };
        $mapTeam = static fn (TeamMember $member): array => [
            'id' => $member->id,
            'name' => $member->name,
            'title' => $member->title,
            'avatar' => $avatarUrl($member->photo),
            'bio' => $member->bio,
            'specialties' => $member->specialties ?: [],
            'is_featured' => $member->is_featured,
            'role' => $member->title ?: 'همکار مجموعه',
        ];
        // Members tagged as instructor/coach in the admin join those sections,
        // without an account they simply have no public profile page (profile_id = null).
        $mapTeamInstructor = static fn (TeamMember $member): array => [
            'id' => $member->id,
            'name' => $member->name,
            'avatar' => $avatarUrl($member->photo),
            'specialty' => $member->title,
            'bio' => $member->bio,
            'experience_years' => null,
            'is_featured' => $member->is_featured,
            'role' => 'مدرس و مربی',
            'profile_id' => null,
        ];
        $mapTeamCoach = static fn (TeamMember $member): array => [
            'id' => $member->id,
            'name' => $member->name,
            'avatar' => $avatarUrl($member->photo),
            'specialty' => $member->title,
            'bio' => $member->bio,
            'experience_years' => null,
            'rating' => null,
            'is_featured' => $member->is_featured,
            'role' => 'کوچ رشد و مسیر آینده',
            // Without an account a team-member coach has no public profile page.
            'profile_id' => null,
        ];

        $instructorProfiles = Instructor::with('user')
            ->whereHas('user', fn ($query) => $query->where('is_active', true))
            ->orderByDesc('is_featured')
            ->orderBy('id')
            ->get()
            ->map($mapInstructor);
        $coachProfiles = Coach::with('user')
            ->whereHas('user', fn ($query) => $query->where('is_active', true))
            ->orderByDesc('is_featured')
            ->orderBy('id')
            ->get()
            ->map($mapCoach);
        $teamMembers = TeamMember::active()->ordered()->get();

        $instructors = $instructorProfiles
            ->concat($teamMembers->where('role', 'instructor')->map($mapTeamInstructor))
            ->sortByDesc('is_featured')
            ->values();
        $coaches = $coachProfiles
            ->concat($teamMembers->where('role', 'coach')->map($mapTeamCoach))
            ->sortByDesc('is_featured')
            ->values();
        $team = $teamMembers->where('role', 'team')->map($mapTeam)->values();

        $seo = Seo::page(
            $request,
            'مدرس‌ها، کوچ‌ها و تیم مرکز رشد و کارآفرینی دکتر بیدی',
            'با تیم تخصصی مرکز رشد و کارآفرینی دکتر بیدی آشنا شوید؛ مدرس‌ها، کوچ‌های مسیر آینده و همکاران مجموعه که کنار شما و فرزندتان هستند.',
            null,
            [
                '@type' => 'ProfilePage',
                'mainEntity' => [
                    '@type' => 'Organization',
                    'name' => 'مرکز رشد و کارآفرینی دکتر بیدی',
                    'url' => url('/team'),
                ],
            ],
        );

        return Inertia::render('Team/Index', [
            'seo' => $seo,
            'instructors' => $instructors,
            'coaches' => $coaches,
            'team' => $team,
        ]);
    }
}
