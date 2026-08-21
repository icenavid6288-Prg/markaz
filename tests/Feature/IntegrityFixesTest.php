<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class IntegrityFixesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_registration_stores_a_hashed_password_in_the_session(): void
    {
        $this->post('/register', [
            'name' => 'کاربر امن',
            'phone' => '09123334455',
            'password' => 'secret-pass',
            'password_confirmation' => 'secret-pass',
        ])->assertRedirect();

        $pending = session('register_data');
        $this->assertIsArray($pending);
        $this->assertNotSame('secret-pass', $pending['password']);
        $this->assertTrue(Hash::isHashed($pending['password']));
    }

    public function test_new_users_receive_the_customer_role(): void
    {
        $this->post('/register', [
            'name' => 'مشتری جدید',
            'phone' => '09123334456',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);
        $code = session('register_dev_code');
        $this->post('/register/verify', ['phone' => '09123334456', 'code' => $code])->assertRedirect();

        $user = User::where('phone', '09123334456')->firstOrFail();
        $this->assertTrue($user->hasRole('customer'));
    }

    public function test_inactive_user_is_logged_out_on_the_next_request(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $this->actingAs($user)->get('/dashboard')->assertOk();

        $user->update(['is_active' => false]);

        $this->actingAs($user)->get('/dashboard')->assertRedirect(route('login', absolute: false));
        $this->assertGuest();
    }

    public function test_quiz_and_assignment_lessons_cannot_be_completed_via_progress(): void
    {
        $user = User::factory()->create();
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'm', 'sort_order' => 1]);
        $quizLesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'آزمون', 'slug' => 'q', 'type' => 'quiz', 'sort_order' => 1]);
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);

        $this->actingAs($user)->post(route('learning.progress', ['course' => $course->slug, 'lesson' => $quizLesson->id]), [
            'progress_percent' => 100,
            'status' => 'completed',
        ])->assertStatus(422);
    }

    public function test_enrollment_increments_course_students_count(): void
    {
        $course = Course::factory()->create(['students_count' => 0]);
        $user = User::factory()->create();

        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);

        $this->assertSame(1, (int) $course->fresh()->students_count);
    }

    public function test_cart_coupon_is_applied_at_checkout(): void
    {
        $user = User::factory()->create();
        $product = Product::query()->create([
            'type' => 'book',
            'title' => 'کتاب تخفیف',
            'slug' => 'coupon-book',
            'price' => 100000,
            'stock' => 5,
            'is_active' => true,
        ]);
        Coupon::create([
            'code' => 'GIFT10',
            'type' => 'percent',
            'value' => 10,
            'max_uses' => 1,
            'used_count' => 0,
            'min_order' => 0,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->withSession(['cart' => [$product->id => 1]])
            ->post('/cart/coupon', ['code' => 'GIFT10'])
            ->assertSessionHas('success');

        $this->actingAs($user)
            ->withSession(['cart' => [$product->id => 1], 'cart_coupon' => 'GIFT10'])
            ->get('/cart/checkout')
            ->assertRedirect();

        $order = Order::where('user_id', $user->id)->firstOrFail();
        $this->assertSame(90000, (int) $order->total);
        $this->assertSame(10000, (int) $order->discount);
        $this->assertSame(1, (int) Coupon::where('code', 'GIFT10')->value('used_count'));
    }

    public function test_admin_marking_an_order_paid_enrolls_the_course(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $user = User::factory()->create();
        $course = Course::factory()->create(['is_published' => true, 'students_count' => 0]);
        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'user_id' => $user->id,
            'status' => 'pending',
            'subtotal' => 1000,
            'total' => 1000,
        ]);
        $order->items()->create([
            'purchasable_type' => Course::class,
            'purchasable_id' => $course->id,
            'title' => $course->title,
            'unit_price' => 1000,
            'quantity' => 1,
            'total' => 1000,
        ]);

        $this->actingAs($admin)->put('/admin/content/orders/'.$order->id, [
            'order_number' => $order->order_number,
            'status' => 'paid',
            'subtotal' => 1000,
            'discount' => 0,
            'total' => 1000,
        ])->assertRedirect();

        $this->assertDatabaseHas('enrollments', ['user_id' => $user->id, 'course_id' => $course->id]);
        $this->assertSame('paid', $order->fresh()->status);
    }

    public function test_local_gateway_is_blocked_in_production(): void
    {
        $this->app['env'] = 'production';
        config(['app.env' => 'production']);
        \App\Models\Setting::set('payment_enabled', '1', 'payment');
        \App\Models\Setting::set('payment_gateway', 'local', 'payment');

        $user = User::factory()->create();
        $course = Course::factory()->create(['is_published' => true, 'price' => 100000]);
        $this->actingAs($user)->post('/courses/'.$course->slug.'/checkout');
        $order = Order::where('user_id', $user->id)->firstOrFail();

        $this->actingAs($user)->post('/checkout/'.$order->order_number.'/pay')->assertStatus(422);
    }

    public function test_api_register_requires_phone_and_accepts_phone_login(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'موبایل',
            'email' => 'mobile@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertStatus(422);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'موبایل',
            'phone' => '09125556677',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertCreated();

        $this->postJson('/api/v1/auth/login', [
            'phone' => '09125556677',
            'password' => 'password',
        ])->assertOk()->assertJsonPath('data.user.phone', '09125556677');
    }
}
