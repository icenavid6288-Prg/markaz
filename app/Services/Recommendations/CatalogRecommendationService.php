<?php

namespace App\Services\Recommendations;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Models\UserOnboardingProfile;
use Illuminate\Support\Collection;

class CatalogRecommendationService
{
    /**
     * Personalized course suggestions for the dashboard. The user's onboarding
     * answers (goal + interests) are matched against course titles, subtitles
     * and category names; courses the user already enrolled in are excluded.
     *
     * @param Collection<int, int> $excludedCourseIds
     */
    public function coursesFor(User $user, Collection $excludedCourseIds): Collection
    {
        $profile = UserOnboardingProfile::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at')
            ->first();

        $interests = collect(array_merge(
            $profile?->interests ?? [],
            $profile?->primary_goal ? [$profile->primary_goal] : [],
            $profile?->current_need ? [$profile->current_need] : [],
        ))
            ->map(fn ($value) => mb_strtolower((string) $value))
            ->filter()
            ->values()
            ->all();

        $preferredCategories = Course::query()
            ->whereIn('id', Enrollment::query()->where('user_id', $user->id)->pluck('course_id'))
            ->whereNotNull('category_id')
            ->pluck('category_id')
            ->unique()
            ->values();

        $courses = Course::published()
            ->with(['category', 'instructor.user'])
            ->when($excludedCourseIds->isNotEmpty(), fn ($query) => $query->whereNotIn('id', $excludedCourseIds))
            ->get();

        return $courses
            ->sortByDesc(function (Course $course) use ($interests, $preferredCategories) {
                $score = (int) $course->is_featured * 2;
                if ($preferredCategories->contains($course->category_id)) {
                    $score += 4;
                }
                $subject = mb_strtolower(trim(
                    implode(' ', array_filter([
                        $course->category?->name,
                        $course->title,
                        $course->subtitle,
                    ]))
                ));
                foreach ($interests as $interest) {
                    if ($interest !== '' && mb_strpos($subject, $interest) !== false) {
                        $score += 3;
                    }
                }

                return $score;
            })
            ->take(3)
            ->values();
    }
}
