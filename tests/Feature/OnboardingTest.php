<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Service;
use App\Models\User;
use App\Models\UserOnboardingProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnboardingTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create();
    }

    private function seedCatalog(): void
    {
        $instructor = Instructor::create([
            'user_id' => User::factory()->create()->id,
            'specialty' => 'استعدادشناسی',
            'bio' => 'مدرس',
            'experience_years' => 5,
        ]);
        $category = Category::create(['name' => 'استعدادشناسی', 'slug' => 'talent', 'type' => 'course']);
        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'category_id' => $category->id,
            'title' => 'شناخت استعداد نوجوان',
            'slug' => 'talent-course',
            'is_published' => true,
        ]);
        Service::create([
            'title' => 'کوچینگ استعداد', 'slug' => 'talent-coaching', 'summary' => 'کوچ اختصاصی',
            'is_active' => true, 'price' => 500000,
        ]);
    }

    public function test_unauthenticated_users_cannot_access_onboarding(): void
    {
        $this->get('/dashboard/onboarding')->assertRedirect('/login');
    }

    public function test_onboarding_redirects_when_already_completed(): void
    {
        $user = $this->user();
        UserOnboardingProfile::create(['user_id' => $user->id, 'completed_at' => now()]);

        $this->actingAs($user)->get('/dashboard/onboarding')->assertRedirect('/dashboard');
    }

    public function test_parent_wizard_persists_answers_and_recommendations(): void
    {
        $this->seedCatalog();
        $user = $this->user();

        $response = $this->actingAs($user)->post('/dashboard/onboarding', [
            'audience' => 'parent',
            'child_age' => 14,
            'grade' => 'پایه نهم',
            'primary_goal' => 'شناخت استعداد و علاقه‌مندی',
            'current_need' => 'نمی‌دانم از کجا شروع کنم',
            'interests' => ['استعدادشناسی', 'برنامه‌ریزی'],
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertDatabaseHas('user_onboarding_profiles', [
            'user_id' => $user->id,
            'audience' => 'parent',
            'child_age' => 14,
        ]);

        $profile = UserOnboardingProfile::where('user_id', $user->id)->first();
        $this->assertNotNull($profile->completed_at);
        $this->assertNotNull($profile->recommendation_snapshot);
        $titles = array_column($profile->recommendation_snapshot, 'title');
        $this->assertContains('شناخت استعداد نوجوان', $titles);
        $this->assertContains('کوچینگ استعداد', $titles);
    }

    public function test_validation_rejects_invalid_answers(): void
    {
        $user = $this->user();

        $this->actingAs($user)->post('/dashboard/onboarding', [
            'audience' => 'alien',
            'primary_goal' => '',
        ])->assertSessionHasErrors(['audience', 'primary_goal']);
    }

    public function test_dashboard_exposes_onboarding_flag(): void
    {
        $user = $this->user();

        $this->actingAs($user)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard')->where('onboarding_incomplete', true));
    }

    public function test_dashboard_recommendations_are_personalized_after_onboarding(): void
    {
        $this->seedCatalog();
        $user = $this->user();

        $this->actingAs($user)->post('/dashboard/onboarding', [
            'audience' => 'parent',
            'child_age' => 14,
            'grade' => 'پایه نهم',
            'primary_goal' => 'شناخت استعداد و علاقه‌مندی',
            'current_need' => 'نمی‌دانم از کجا شروع کنم',
            'interests' => ['استعدادشناسی'],
        ])->assertRedirect('/dashboard');

        $this->actingAs($user)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('onboarding_incomplete', false)
                ->where('recommendations', fn ($list) => collect($list)->contains('title', 'شناخت استعداد نوجوان')));
    }
}
