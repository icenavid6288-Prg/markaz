<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Service;
use App\Models\User;
use App\Models\UserOnboardingProfile;
use App\Services\Crm\LeadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $profile = UserOnboardingProfile::query()->firstOrCreate(['user_id' => $user->id]);

        if ($profile->isCompleted()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Onboarding/Index', [
            'initial' => $profile->only(['audience', 'child_age', 'grade', 'primary_goal', 'current_need', 'interests']),
        ]);
    }

    public function store(Request $request, LeadService $leads): RedirectResponse
    {
        $validated = $request->validate([
            'audience' => ['required', 'in:student,parent,instructor,other'],
            'child_age' => ['nullable', 'integer', 'between:5,25'],
            'grade' => ['nullable', 'string', 'max:60'],
            'primary_goal' => ['required', 'string', 'max:120'],
            'current_need' => ['nullable', 'string', 'max:120'],
            'interests' => ['nullable', 'array', 'max:6'],
            'interests.*' => ['string', 'max:60'],
        ]);

        $user = $request->user();
        $profile = UserOnboardingProfile::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                ...$validated,
                'recommendation_snapshot' => $this->recommendations($validated),
                'completed_at' => now(),
            ],
        );

        session()->flash('onboarding.completed', true);

        $this->enrichLead($user, $validated, $leads);

        return redirect()->route('dashboard')->with('success', 'پروفایل مسیر شما ساخته شد؛ پیشنهادهای اختصاصی آماده است.');
    }

    /** @param array<string, mixed> $answers */
    private function enrichLead(User $user, array $answers, LeadService $leads): void
    {
        $lead = $leads->findOrCreate((string) $user->phone, $user->name);

        $lead->fill([
            'name' => $user->name,
            'email' => $user->email,
            'child_age' => $answers['child_age'] ?? $lead->child_age,
            'grade' => $answers['grade'] ?? $lead->grade,
            'need' => $answers['primary_goal'] ?? $lead->need,
            'service_type' => $answers['audience'] ?? $lead->service_type,
            'source' => 'registration',
        ])->save();

        $leads->linkToUser($lead, $user, 'تکمیل پروفایل مسیر رشد — هدف: '.$answers['primary_goal']);
    }

    /** @param array<string, mixed> $answers */
    private function recommendations(array $answers): array
    {
        $interests = $answers['interests'] ?? [];
        $courses = Course::published()
            ->with(['category', 'instructor.user'])
            ->get();

        // Keep recommendation generation safe when lazy loading is disabled. The
        // explicit load also protects this flow if a global scope or a future
        // query refactor removes part of the nested eager-load declaration.
        $courses->loadMissing(['category', 'instructor.user']);

        $courses = $courses
            ->sortByDesc(fn (Course $course) => $this->score($course->category?->name, $interests) + (int) $course->is_featured * 2)
            ->take(3)
            ->map(fn (Course $course) => [
                'type' => 'course',
                'title' => $course->title,
                'slug' => $course->slug,
                'url' => route('courses.show', $course->slug),
                'thumbnail' => $course->thumbnail,
                'price' => $course->discount_price ?? $course->price,
                'level' => $course->level,
                'instructor' => $this->loadedInstructorName($course),
            ])->values()->all();

        $services = Service::active()
            ->get()
            ->sortByDesc(fn (Service $service) => $this->score($service->title, $interests) + (int) $service->is_featured * 2)
            ->take(2)
            ->map(fn (Service $service) => [
                'type' => 'service',
                'title' => $service->title,
                'slug' => $service->slug,
                'url' => route('services.show', $service->slug),
                'thumbnail' => $service->image,
                'price' => $service->price,
                'summary' => $service->summary,
            ])->values()->all();

        return array_merge($courses, $services);
    }

    private function loadedInstructorName(Course $course): ?string
    {
        if (! $course->relationLoaded('instructor')) {
            return null;
        }

        $instructor = $course->getRelation('instructor');
        if ($instructor === null || ! $instructor->relationLoaded('user')) {
            return null;
        }

        return $instructor->getRelation('user')?->name;
    }

    /** @param array<int, string> $interests */
    private function score(?string $subject, array $interests): int
    {
        if (! $subject) {
            return 0;
        }
        $subject = mb_strtolower($subject);
        $score = 0;
        foreach ($interests as $interest) {
            if (mb_strpos($subject, mb_strtolower($interest)) !== false) {
                $score += 3;
            }
        }
        if (mb_strpos($subject, 'نوجوان') !== false || mb_strpos($subject, 'رشد') !== false) {
            $score += 1;
        }

        return $score;
    }
}
