<?php

namespace Tests\Feature;

use App\Console\Commands\SendVisitorWinbacks;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\PageView;
use App\Models\Setting;
use App\Models\User;
use App\Models\VisitorWinback;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CourseGatingAndWinbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        (new RoleAndPermissionSeeder())->run();
    }

    public function test_next_media_lesson_is_locked_until_current_is_completed(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'mod', 'sort_order' => 1]);
        $first = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'ویدیو اول', 'slug' => 'v1', 'type' => 'video', 'video_url' => 'https://example.com/a.mp4', 'sort_order' => 1]);
        $second = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'ویدیو دوم', 'slug' => 'v2', 'type' => 'video', 'video_url' => 'https://example.com/b.mp4', 'sort_order' => 2]);
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'progress_percent' => 0, 'enrolled_at' => now()]);

        // Second lesson is unreachable before the first is completed → redirect to first.
        $this->actingAs($user)->get("/dashboard/courses/{$course->slug}/learn/{$second->id}")->assertRedirect();

        // Complete the first lesson, then the second becomes reachable.
        $this->actingAs($user)->post("/dashboard/courses/{$course->slug}/lessons/{$first->id}/progress", ['progress_percent' => 100, 'status' => 'completed'])->assertRedirect();
        $this->actingAs($user)->get("/dashboard/courses/{$course->slug}/learn/{$second->id}")->assertOk();
    }

    public function test_text_lesson_does_not_gate_following_lessons(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'mod', 'sort_order' => 1]);
        $article = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'جزوه', 'slug' => 'a1', 'type' => 'article', 'sort_order' => 1]);
        $next = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'ویدیو', 'slug' => 'v1', 'type' => 'video', 'video_url' => 'https://example.com/a.mp4', 'sort_order' => 2]);
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'progress_percent' => 0, 'enrolled_at' => now()]);

        $this->actingAs($user)->get("/dashboard/courses/{$course->slug}/learn/{$next->id}")->assertOk();
        $this->assertDatabaseMissing('lesson_progress', ['user_id' => $user->id]);
    }

    public function test_winback_command_sends_sms_and_notification_to_browsing_users(): void
    {
        Notification::fake();

        Setting::set('winback_enabled', '1');
        Setting::set('winback_days', '7');
        Setting::set('winback_min_pages', '2');
        Setting::set('winback_cooldown_days', '14');
        Setting::set('sms_driver', 'log');
        Setting::set('sms_enabled', '1');
        Setting::set('winback_sms_message', '{name} عزیز، دوباره سر بزنید!');
        Setting::set('winback_notification_message', '{name} عزیز، پیام داخل پنل.');

        $user = User::factory()->create(['phone' => '09120000001', 'name' => 'علی', 'is_active' => true]);

        foreach (['/courses', '/shop'] as $url) {
            PageView::create(['url' => $url, 'user_id' => $user->id, 'visited_at' => now()->subDay()]);
        }

        $this->artisan('marketing:winback-visitors')->assertSuccessful();

        Notification::assertSentTo($user, \App\Notifications\VisitorWinbackNotification::class);
        $this->assertDatabaseHas('visitor_winbacks', ['user_id' => $user->id, 'channel' => 'sms']);
        $this->assertDatabaseHas('visitor_winbacks', ['user_id' => $user->id, 'channel' => 'in_app']);
    }

    public function test_winback_command_skips_customers_and_already_sent_users(): void
    {
        Setting::set('winback_enabled', '1');
        Setting::set('winback_days', '7');
        Setting::set('winback_min_pages', '2');
        Setting::set('sms_driver', 'log');
        Setting::set('sms_enabled', '1');
        Setting::set('winback_sms_message', 'پیام تست');

        $customer = User::factory()->create(['phone' => '09120000002', 'is_active' => true]);
        $customer->orders()->create(['order_number' => 'X1', 'status' => 'paid', 'subtotal' => 1000, 'total' => 1000]);
        foreach (['/courses', '/shop'] as $url) {
            PageView::create(['url' => $url, 'user_id' => $customer->id, 'visited_at' => now()->subDay()]);
        }

        $already = User::factory()->create(['phone' => '09120000003', 'is_active' => true]);
        VisitorWinback::create(['user_id' => $already->id, 'phone' => $already->phone, 'channel' => 'sms', 'sent_at' => now()->subDay()]);
        foreach (['/courses', '/shop'] as $url) {
            PageView::create(['url' => $url, 'user_id' => $already->id, 'visited_at' => now()->subDay()]);
        }

        $this->artisan('marketing:winback-visitors')->assertSuccessful();

        $this->assertDatabaseCount('visitor_winbacks', 1);
    }
}
