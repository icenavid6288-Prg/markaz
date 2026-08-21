<?php

namespace Tests\Feature;

use App\Models\Coach;
use App\Models\CoachAvailability;
use App\Models\CoachingSession;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\MarketingConsent;
use App\Models\NotificationSubscription;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\RoleAndPermissionSeeder;
use Database\Seeders\SiteSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductionFoundationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleAndPermissionSeeder::class, SiteSettingSeeder::class, AdminUserSeeder::class, ContentSeeder::class]);
    }

    public function test_enrolled_user_can_open_player_and_save_lesson_progress(): void
    {
        $user = User::factory()->create();
        $course = Course::published()->with('modules.lessons')->firstOrFail();
        $lesson = $course->modules->flatMap(fn ($module) => $module->lessons)->firstOrFail();
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);

        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Learning/Player')->where('currentLesson.id', $lesson->id));

        $this->actingAs($user)->post(route('learning.progress', ['course' => $course->slug, 'lesson' => $lesson->id]), ['progress_percent' => 100, 'status' => 'completed'])
            ->assertRedirect();

        $this->assertDatabaseHas('lesson_progress', ['user_id' => $user->id, 'lesson_id' => $lesson->id, 'status' => 'completed']);
        $expected = (int) round(100 / max(1, Lesson::where('course_id', $course->id)->count()));
        $this->assertSame($expected, (int) Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->value('progress_percent'));
    }

    public function test_unenrolled_user_cannot_open_player(): void
    {
        $user = User::factory()->create();
        $course = Course::published()->firstOrFail();
        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug]))->assertNotFound();
    }

    public function test_expired_product_reservation_is_released_by_command(): void
    {
        $user = User::factory()->create();
        $product = Product::active()->ofType('book')->firstOrFail();
        $this->actingAs($user)->withSession(['cart' => [$product->id => 1]])->get('/cart/checkout');
        $order = Order::where('user_id', $user->id)->latest()->firstOrFail();
        $this->assertSame(1, (int) $product->fresh()->reserved_stock);
        $order->update(['reservation_expires_at' => now()->subMinute()]);

        $this->artisan('commerce:release-expired-reservations')->assertExitCode(0);
        $this->assertSame(0, (int) $product->fresh()->reserved_stock);
        $this->assertSame('cancelled', $order->fresh()->status);
    }

    public function test_authenticated_user_can_manage_push_subscription_and_marketing_consent(): void
    {
        $user = User::factory()->create();
        $endpoint = 'https://push.example.test/subscription/'.fake()->uuid();

        $this->actingAs($user)->postJson('/notifications/subscriptions', ['endpoint' => $endpoint, 'keys' => ['p256dh' => 'public', 'auth' => 'secret']])->assertCreated();
        $this->assertDatabaseHas('notification_subscriptions', ['user_id' => $user->id, 'endpoint' => $endpoint]);
        $this->actingAs($user)->deleteJson('/notifications/subscriptions', ['endpoint' => $endpoint])->assertOk();
        $this->assertDatabaseMissing('notification_subscriptions', ['endpoint' => $endpoint]);

        $this->actingAs($user)->patch('/marketing/consent', ['sms' => false, 'email_marketing' => true, 'in_app' => true])->assertRedirect();
        $this->assertDatabaseHas('marketing_consents', ['user_id' => $user->id, 'sms' => false, 'email_marketing' => true]);
    }

    public function test_authenticated_user_can_reserve_an_available_coaching_slot_once(): void
    {
        $coachUser = User::factory()->create(['name' => 'کوچ تستی']);
        Coach::create(['user_id' => $coachUser->id, 'specialty' => 'رشد فردی', 'hourly_rate' => 900000, 'is_available' => true]);
        $slot = CoachAvailability::create(['coach_id' => $coachUser->id, 'available_date' => now()->addDay()->toDateString(), 'start_time' => '10:00', 'end_time' => '11:00', 'is_booked' => false]);
        $student = User::factory()->create();

        $this->actingAs($student)->post('/coaching/book', ['availability_id' => $slot->id])->assertRedirect(route('dashboard.sessions', [], false));
        $this->assertDatabaseHas('coaching_sessions', ['student_id' => $student->id, 'coach_id' => $coachUser->id, 'status' => 'pending']);
        $this->assertDatabaseHas('coach_availability', ['id' => $slot->id, 'is_booked' => 1]);

        $this->actingAs(User::factory()->create())->post('/coaching/book', ['availability_id' => $slot->id])->assertStatus(422);
        $this->assertSame(1, CoachingSession::where('coach_id', $coachUser->id)->count());
    }

    public function test_csp_can_be_enabled_without_changing_default_local_preview(): void
    {
        config(['security.csp_enabled' => true]);
        $this->get('/')->assertHeader('content-security-policy');
    }
}
