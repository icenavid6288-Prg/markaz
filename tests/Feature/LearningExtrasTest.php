<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\Coach;
use App\Models\CoachAvailability;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Order;
use App\Models\Page;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningExtrasTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_unenrolled_user_can_open_a_free_lesson_but_not_a_paid_one(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->create(['is_published' => true]);
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'm', 'sort_order' => 1]);
        $free = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'رایگان', 'slug' => 'free', 'type' => 'article', 'is_free' => true, 'sort_order' => 1, 'content' => 'متن رایگان']);
        $paid = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'پولی', 'slug' => 'paid', 'type' => 'article', 'is_free' => false, 'sort_order' => 2]);

        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $free->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('enrollment.preview', true)->where('currentLesson.id', $free->id));

        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $paid->id]))
            ->assertRedirect();
    }

    public function test_student_can_save_a_note_and_bookmark(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'm', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'درس', 'slug' => 'l', 'type' => 'article', 'sort_order' => 1]);
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);

        $this->actingAs($user)->post(route('learning.notes.store', ['course' => $course->slug, 'lesson' => $lesson->id]), [
            'content' => 'نکته مهم درس',
        ])->assertRedirect();
        $this->assertDatabaseHas('notes', ['user_id' => $user->id, 'lesson_id' => $lesson->id, 'content' => 'نکته مهم درس']);

        $this->actingAs($user)->post(route('learning.bookmark.toggle', ['course' => $course->slug, 'lesson' => $lesson->id]))->assertRedirect();
        $this->assertDatabaseHas('bookmarks', ['user_id' => $user->id, 'lesson_id' => $lesson->id]);
    }

    public function test_paid_coaching_booking_creates_a_checkout_order(): void
    {
        $coachUser = User::factory()->create();
        Coach::create(['user_id' => $coachUser->id, 'specialty' => 'رشد', 'hourly_rate' => 250000, 'is_available' => true]);
        $slot = CoachAvailability::create([
            'coach_id' => $coachUser->id,
            'available_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'is_booked' => false,
        ]);
        $student = User::factory()->create();

        $this->actingAs($student)->post('/coaching/book', ['availability_id' => $slot->id])
            ->assertRedirect();

        $order = Order::where('user_id', $student->id)->latest()->firstOrFail();
        $this->assertSame('pending', $order->status);
        $this->assertSame(250000, (int) $order->total);
        $this->assertDatabaseHas('coaching_sessions', ['student_id' => $student->id, 'status' => 'pending']);
    }

    public function test_blog_comment_is_held_for_moderation(): void
    {
        $author = User::factory()->create();
        $post = BlogPost::create([
            'author_id' => $author->id,
            'title' => 'مقاله نظر',
            'slug' => 'comment-post',
            'body' => 'متن مقاله',
            'status' => 'published',
            'published_at' => now(),
        ]);
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('blog.comments.store', $post), ['body' => 'نظر مفید و کوتاه'])->assertRedirect();
        $this->assertDatabaseHas('comments', ['commentable_id' => $post->id, 'is_approved' => false, 'body' => 'نظر مفید و کوتاه']);
    }

    public function test_user_can_toggle_course_wishlist_and_view_it(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->create(['is_published' => true]);

        $this->actingAs($user)->post(route('wishlist.toggle'), ['type' => 'course', 'id' => $course->id])->assertRedirect();
        $this->assertDatabaseHas('wishlists', ['user_id' => $user->id, 'wishlistable_id' => $course->id]);

        $this->actingAs($user)->get(route('dashboard.wishlist'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard/Wishlist')->has('items', 1));
    }

    public function test_published_cms_page_is_public(): void
    {
        Page::create([
            'title' => 'حریم خصوصی',
            'slug' => 'privacy',
            'status' => 'published',
            'template' => 'default',
            'sections' => [['type' => 'text', 'title' => 'متن', 'body' => 'توضیح سیاست حریم خصوصی']],
        ]);

        $this->get('/p/privacy')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Pages/Show')->where('page.title', 'حریم خصوصی'));
    }
}
