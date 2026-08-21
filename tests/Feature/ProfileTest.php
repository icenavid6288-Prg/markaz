<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\PodcastEpisode;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Database\Seeders\SiteSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleAndPermissionSeeder::class, SiteSettingSeeder::class]);
    }

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_dashboard_renders_for_authenticated_user(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/dashboard');

        $response->assertOk();
    }

    public function test_dashboard_sections_have_separate_pages(): void
    {
        $user = User::factory()->create();

        foreach ([
            ['/dashboard/courses', 'Dashboard/Courses'],
            ['/dashboard/goals', 'Dashboard/Goals'],
            ['/dashboard/sessions', 'Dashboard/Sessions'],
            ['/dashboard/orders', 'Dashboard/Orders'],
            ['/dashboard/library', 'Dashboard/Library'],
        ] as [$uri, $component]) {
            $this->actingAs($user)
                ->get($uri)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component($component));
        }
    }

    public function test_purchased_podcast_is_available_in_the_user_library(): void
    {
        $user = User::factory()->create();
        $product = Product::create([
            'type' => 'podcast',
            'title' => 'پادکست مسیر رشد',
            'slug' => 'growth-path-podcast',
            'price' => 0,
            'stock' => 10,
            'is_active' => true,
        ]);
        PodcastEpisode::create([
            'product_id' => $product->id,
            'title' => 'قسمت اول',
            'audio_url' => 'https://cdn.example.test/episode-1.mp3',
            'duration_seconds' => 180,
            'is_free' => false,
        ]);
        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'user_id' => $user->id,
            'status' => 'paid',
            'subtotal' => 0,
            'discount' => 0,
            'total' => 0,
            'payment_method' => 'free',
            'paid_at' => now(),
        ]);
        $order->items()->create([
            'purchasable_type' => Product::class,
            'purchasable_id' => $product->id,
            'title' => $product->title,
            'unit_price' => 0,
            'quantity' => 1,
            'total' => 0,
        ]);

        $this->actingAs($user)
            ->get('/dashboard/library')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard/Library')
                ->where('podcasts.0.title', 'پادکست مسیر رشد')
                ->where('podcasts.0.episodes.0.audio_url', 'https://cdn.example.test/episode-1.mp3'));
    }

    public function test_dashboard_renders_coaching_goals_with_task_counts(): void
    {
        $user = User::factory()->create();

        \App\Models\CoachingGoal::create([
            'student_id' => $user->id,
            'title' => 'هدف تستی',
            'status' => 'in_progress',
        ]);
        \App\Models\CoachingTask::create([
            'goal_id' => \App\Models\CoachingGoal::first()->id,
            'student_id' => $user->id,
            'title' => 'وظیفه تستی',
            'status' => 'done',
        ]);

        $response = $this
            ->actingAs($user)
            ->get('/dashboard');

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->where('goals.0.title', 'هدف تستی')
                ->where('goals.0.total_tasks', 1)
                ->where('goals.0.completed_tasks', 1));
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'phone' => '09121234567',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('09121234567', $user->phone);
    }

    public function test_profile_update_rejects_duplicate_phone_number(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'phone' => $other->phone,
            ]);

        $response->assertSessionHasErrors('phone');
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
