<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\Coach;
use App\Models\CoachAvailability;
use App\Models\CoachingSession;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Enrollment;
use App\Models\Review;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\RoleAndPermissionSeeder;
use Database\Seeders\SiteSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicPagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            RoleAndPermissionSeeder::class,
            SiteSettingSeeder::class,
            AdminUserSeeder::class,
            ContentSeeder::class,
        ]);
    }

    public function test_sitemap_and_robots_are_served_for_search_engines(): void
    {
        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
            ->assertSee('<urlset', false)
            ->assertSee('/courses', false)
            ->assertSee('/shop', false);

        $this->get('/robots.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('User-agent: *')
            ->assertSee('Sitemap: ');
    }

    public function test_team_page_lists_instructors_coaches_and_team_members(): void
    {
        $instructorUser = User::factory()->create(['name' => 'مدرس نمونه', 'is_active' => true]);
        $instructorUser->assignRole('instructor');
        Instructor::create(['user_id' => $instructorUser->id, 'specialty' => 'مهارت‌های آینده', 'bio' => 'معرفی مدرس', 'experience_years' => 8, 'is_featured' => true]);

        $coachUser = User::factory()->create(['name' => 'کوچ نمونه', 'is_active' => true]);
        $coachUser->assignRole('coach');
        Coach::create(['user_id' => $coachUser->id, 'specialty' => 'کوچینگ رشد نوجوان', 'bio' => 'معرفی کوچ', 'experience_years' => 5, 'rating' => 4.8]);

        $this->get('/team')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Team/Index')
                ->where('seo.type', 'ProfilePage')
                ->where('instructors', fn ($list) => collect($list)->contains('name', 'مدرس نمونه'))
                ->where('coaches', fn ($list) => collect($list)->contains('name', 'کوچ نمونه'))
                ->where('team', fn ($list) => collect($list)->contains('name', 'سرکار خانم مرادی'))
                ->where('pageContent.key', 'team'));

        // Inactive team members are hidden from the public page.
        $hidden = \App\Models\TeamMember::first();
        $hidden->update(['is_active' => false]);
        $this->get('/team')->assertInertia(fn (Assert $page) => $page
            ->where('team', fn ($list) => ! collect($list)->contains('id', $hidden->id)));
    }

    public function test_instructor_profile_page_shows_published_courses_and_their_quizzes(): void
    {
        $instructorUser = User::factory()->create([
            'name' => 'مدرس آزمون‌ها',
            'bio' => 'معرفی کامل مدرس از پروفایل کاربری',
            'is_active' => true,
        ]);
        $instructorUser->assignRole('instructor');
        $instructor = Instructor::create([
            'user_id' => $instructorUser->id,
            'specialty' => 'مهارت‌های آینده و ارزیابی',
            'bio' => 'بیوگرافی مدرس',
            'experience_years' => 9,
            'is_featured' => true,
        ]);

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
            'title' => 'دوره طراحی مسیر آینده',
            'slug' => 'instructor-path-course',
            'description' => 'توضیح دوره مدرس',
            'price' => 1500000,
            'is_published' => true,
            'is_featured' => true,
            'students_count' => 42,
            'rating_avg' => 4.7,
        ]);
        $lesson = $course->lessons()->create([
            'title' => 'درس پایانی',
            'slug' => 'final-lesson',
            'type' => 'quiz',
            'sort_order' => 1,
        ]);
        $quiz = $lesson->quiz()->create([
            'course_id' => $course->id,
            'title' => 'آزمون پایان دوره',
            'description' => 'ارزیابی نهایی مسیر',
            'passing_score' => 80,
            'time_limit_minutes' => 30,
        ]);
        foreach (['سؤال اول', 'سؤال دوم', 'سؤال سوم'] as $index => $question) {
            $quiz->questions()->create([
                'type' => 'single',
                'question' => $question,
                'options' => ['گزینه یک', 'گزینه دو'],
                'correct_answer' => [0],
                'score' => 1,
                'sort_order' => $index,
            ]);
        }

        // Courses/اختصاصی و پیش‌نویس‌ها نباید در صفحه عمومی نمایش داده شوند.
        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'title' => 'دوره پیش‌نویس مدرس',
            'slug' => 'instructor-draft-course',
            'is_published' => false,
        ]);

        $this->get("/instructors/{$instructor->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Instructors/Show')
                ->where('instructor.name', 'مدرس آزمون‌ها')
                ->where('instructor.specialty', 'مهارت‌های آینده و ارزیابی')
                ->where('instructor.bio', 'معرفی کامل مدرس از پروفایل کاربری')
                ->where('stats.courses', 1)
                ->where('stats.lessons', 1)
                ->where('stats.students', 42)
                ->where('stats.quizzes', 1)
                ->where('courses.0.title', 'دوره طراحی مسیر آینده')
                ->where('courses.0.slug', 'instructor-path-course')
                ->where('quizzes.0.title', 'آزمون پایان دوره')
                ->where('quizzes.0.questions_count', 3)
                ->where('quizzes.0.passing_score', 80)
                ->where('quizzes.0.course.slug', 'instructor-path-course')
                ->where('seo.type', 'ProfilePage'));

        // مدرس غیرفعال نباید صفحه عمومی داشته باشد.
        $instructorUser->update(['is_active' => false]);
        $this->get("/instructors/{$instructor->id}")->assertNotFound();
    }

    public function test_instructor_without_courses_renders_empty_state(): void
    {
        $instructorUser = User::factory()->create(['name' => 'مدرس تازه‌کار', 'is_active' => true]);
        $instructor = Instructor::create(['user_id' => $instructorUser->id, 'specialty' => 'آموزش نوجوانان']);

        $this->get("/instructors/{$instructor->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Instructors/Show')
                ->where('stats.courses', 0)
                ->where('stats.quizzes', 0)
                ->where('courses', [])
                ->where('quizzes', []));
    }

    public function test_coach_profile_page_shows_specialty_rating_and_availability(): void
    {
        $coachUser = User::factory()->create([
            'name' => 'کوچ نمونه',
            'bio' => 'معرفی کامل کوچ از پروفایل کاربری',
            'is_active' => true,
        ]);
        $coachUser->assignRole('coach');
        $coach = Coach::create([
            'user_id' => $coachUser->id,
            'specialty' => 'کوچینگ رشد نوجوان و والدین',
            'experience_years' => 6,
            'hourly_rate' => 1500000,
            'rating' => 4.9,
            'is_featured' => true,
            'is_available' => true,
        ]);

        CoachingSession::create([
            'coach_id' => $coachUser->id,
            'student_id' => User::factory()->create()->id,
            'scheduled_at' => now()->subDays(2),
            'duration_minutes' => 60,
            'status' => 'completed',
        ]);

        $slot = CoachAvailability::create([
            'coach_id' => $coachUser->id,
            'available_date' => now()->addDays(2)->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'is_booked' => false,
        ]);

        $this->get("/coaches/{$coach->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Coaches/Show')
                ->where('coach.name', 'کوچ نمونه')
                ->where('coach.specialty', 'کوچینگ رشد نوجوان و والدین')
                ->where('coach.bio', 'معرفی کامل کوچ از پروفایل کاربری')
                ->where('coach.rating', 4.9)
                ->where('coach.hourly_rate', 1500000)
                ->where('stats.sessions', 1)
                ->where('stats.students', 1)
                ->where('stats.completed', 1)
                ->where('availability.0.id', $slot->id)
                ->where('seo.type', 'ProfilePage'));

        // کوچ غیرفعال نباید صفحه عمومی داشته باشد.
        $coachUser->update(['is_active' => false]);
        $this->get("/coaches/{$coach->id}")->assertNotFound();
    }

    public function test_team_page_groups_members_by_role_from_the_admin(): void
    {
        $member = \App\Models\TeamMember::where('name', 'سرکار خانم مرادی')->firstOrFail();
        $member->update(['role' => 'instructor']);

        \App\Models\TeamMember::where('name', 'آقای کریمی')->firstOrFail()->update(['role' => 'coach']);

        $this->get('/team')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('instructors', fn ($list) => collect($list)->contains('name', 'سرکار خانم مرادی'))
                ->where('coaches', fn ($list) => collect($list)->contains('name', 'آقای کریمی'))
                // اعضای بدون نقشِ مشخص همچنان در بخش «بقیه تیم» می‌مانند.
                ->where('team', fn ($list) => ! collect($list)->contains('name', 'سرکار خانم مرادی')));
    }

    public function test_courses_index_lists_published_courses(): void
    {
        $this->get('/courses')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Courses/Index')
                ->where('courses.total', 3)
                ->has('courses.data', 3)
                ->has('categories')
                ->where('seo.type', 'CollectionPage')
                ->has('seo.schema')
                ->where('filters.level', '')
                ->where('filters.category', '')
                ->where('filters.sort', 'latest'));
    }

    public function test_courses_index_filters_are_read_from_shareable_query_parameters(): void
    {
        $this->get('/courses?q=استعداد&category=talent-discovery&sort=price_desc&level=beginner&page=1')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Courses/Index')
                ->where('filters.q', 'استعداد')
                ->where('filters.category', 'talent-discovery')
                ->where('filters.sort', 'price_desc')
                ->where('filters.level', 'beginner')
                ->where('courses.current_page', 1)
                ->where('courses.total', 1));
    }

    public function test_course_show_renders_curriculum(): void
    {
        $course = Course::published()->first();

        $this->get("/courses/{$course->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Courses/Show')
                ->where('course.slug', $course->slug)
                ->has('course.modules')
                ->has('reviews')
                ->where('enrollment.is_enrolled', false)
                ->where('enrollment.progress_percent', 0));
    }

    public function test_authenticated_course_detail_exposes_enrollment_progress_and_reviews(): void
    {
        $user = User::factory()->create(['name' => 'یادگیرنده نمونه']);
        $course = Course::published()->first();

        Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'status' => 'active',
            'progress_percent' => 42,
            'enrolled_at' => now(),
        ]);
        Review::create([
            'user_id' => $user->id,
            'reviewable_type' => Course::class,
            'reviewable_id' => $course->id,
            'rating' => 5,
            'title' => 'مسیر روشن و کاربردی',
            'body' => 'محتوای دوره خیلی منظم و قابل اجرا بود.',
            'is_approved' => true,
        ]);

        $this->actingAs($user)
            ->get("/courses/{$course->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('enrollment.is_enrolled', true)
                ->where('enrollment.progress_percent', 42)
                ->where('reviews.0.name', 'یادگیرنده نمونه')
                ->where('reviews.0.rating', 5));
    }

    public function test_enrolled_user_can_submit_a_course_review_for_moderation(): void
    {
        $user = User::factory()->create();
        $course = Course::published()->first();
        Enrollment::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->actingAs($user)
            ->post("/courses/{$course->slug}/reviews", [
                'rating' => 5,
                'title' => 'خیلی کاربردی',
                'body' => 'این دوره مسیر یادگیری را برای من روشن کرد.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'reviewable_type' => Course::class,
            'reviewable_id' => $course->id,
            'rating' => 5,
            'is_approved' => false,
        ]);
    }

    public function test_paid_product_customer_can_submit_a_product_review(): void
    {
        $user = User::factory()->create();
        $product = Product::query()->firstOrFail();
        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'user_id' => $user->id,
            'status' => 'paid',
            'subtotal' => 1000,
            'total' => 1000,
            'paid_at' => now(),
            'payment_method' => 'test',
        ]);
        $order->items()->create([
            'purchasable_type' => Product::class,
            'purchasable_id' => $product->id,
            'title' => $product->title,
            'unit_price' => 1000,
            'quantity' => 1,
            'total' => 1000,
        ]);

        $this->actingAs($user)
            ->post("/products/{$product->slug}/reviews", [
                'rating' => 4,
                'body' => 'محتوای مفید و قابل استفاده‌ای بود.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'reviewable_type' => Product::class,
            'reviewable_id' => $product->id,
            'rating' => 4,
            'is_approved' => false,
        ]);
    }

    public function test_authenticated_student_can_create_a_course_order_and_open_checkout(): void
    {
        $user = User::factory()->create();
        $course = Course::published()->first();

        $response = $this->actingAs($user)->post("/courses/{$course->slug}/checkout");
        $order = Order::where('user_id', $user->id)->firstOrFail();

        $response->assertRedirect(route('checkout.show', ['order' => $order->order_number], false));
        $this->assertSame('pending', $order->status);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'purchasable_type' => Course::class,
            'purchasable_id' => $course->id,
            'total' => $course->finalPrice(),
        ]);

        $this->actingAs($user)
            ->get("/checkout/{$order->order_number}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Checkout/Show')
                ->where('order.order_number', $order->order_number)
                ->where('order.total', $course->finalPrice())
                ->where('order.items.0.course_slug', $course->slug));
    }

    public function test_guest_is_redirected_to_login_before_creating_a_course_order(): void
    {
        $course = Course::published()->first();

        $this->post("/courses/{$course->slug}/checkout")
            ->assertRedirect('/login');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_configured_local_gateway_verifies_payment_and_enrolls_course(): void
    {
        Setting::set('payment_enabled', '1', 'payment');
        Setting::set('payment_gateway', 'local', 'payment');
        $user = User::factory()->create();
        $course = Course::published()->first();

        $this->actingAs($user)->post("/courses/{$course->slug}/checkout");
        $order = Order::where('user_id', $user->id)->firstOrFail();

        $paymentResponse = $this->actingAs($user)->post("/checkout/{$order->order_number}/pay");
        $paymentResponse->assertRedirect();
        $callbackUrl = $paymentResponse->headers->get('Location');
        $this->assertStringContainsString('/payments/'.$order->order_number.'/callback/local', $callbackUrl);

        $callbackPath = parse_url($callbackUrl, PHP_URL_PATH).'?'.parse_url($callbackUrl, PHP_URL_QUERY);
        $this->get($callbackPath)->assertRedirect('/dashboard');

        $this->assertSame('paid', $order->fresh()->status);
        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'gateway' => 'local', 'status' => 'success']);
        $this->assertDatabaseHas('enrollments', ['user_id' => $user->id, 'course_id' => $course->id]);
    }

    public function test_payment_callback_cannot_reuse_another_orders_authority(): void
    {
        Setting::set('payment_enabled', '1', 'payment');
        Setting::set('payment_gateway', 'local', 'payment');
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();
        $course = Course::published()->first();

        $this->actingAs($firstUser)->post("/courses/{$course->slug}/checkout");
        $firstOrder = Order::where('user_id', $firstUser->id)->firstOrFail();
        $firstPayment = $this->actingAs($firstUser)->post("/checkout/{$firstOrder->order_number}/pay");
        $firstCallback = $firstPayment->headers->get('Location');
        $firstQuery = parse_url($firstCallback, PHP_URL_QUERY);

        $this->actingAs($secondUser)->post("/courses/{$course->slug}/checkout");
        $secondOrder = Order::where('user_id', $secondUser->id)->firstOrFail();
        $this->actingAs($secondUser)->post("/checkout/{$secondOrder->order_number}/pay");

        $this->get('/payments/'.$secondOrder->order_number.'/callback/local?'.$firstQuery)
            ->assertRedirect(route('checkout.show', ['order' => $secondOrder->order_number], false));

        // Local verification rejects the foreign HMAC token and marks the attempt failed.
        $this->assertSame('failed', $secondOrder->fresh()->status);
        $this->assertDatabaseMissing('enrollments', [
            'user_id' => $secondUser->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_order_checkout_is_private_to_the_order_owner(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $course = Course::published()->first();

        $this->actingAs($owner)->post("/courses/{$course->slug}/checkout");
        $order = Order::where('user_id', $owner->id)->firstOrFail();

        $this->actingAs($otherUser)
            ->get("/checkout/{$order->order_number}")
            ->assertForbidden();
    }

    public function test_header_menu_falls_back_to_default_when_menus_table_is_empty(): void
    {
        \App\Models\Menu::query()->delete();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('menus.header', fn ($items) => count($items) === 9
                    && collect($items)->contains('title', 'دوره‌ها')
                    && collect($items)->contains('title', 'فروشگاه'))
                ->where('menus.footer', fn ($items) => collect($items)->contains('title', 'فروشگاه')));
    }

    public function test_services_index_lists_services(): void
    {
        $this->get('/services')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Services/Index')
                ->has('services'));
    }

    public function test_service_show_renders_faqs_and_uses_content_seo_settings(): void
    {
        $service = Service::active()->first();
        $service->update(['seo' => [
            'title' => 'عنوان اختصاصی خدمت',
            'description' => 'توضیحات اختصاصی برای موتورهای جستجو',
            'keywords' => 'خدمت، رشد، کوچینگ',
        ]]);

        $this->get("/services/{$service->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Services/Show')
                ->where('service.slug', $service->slug)
                ->where('seo.description', 'توضیحات اختصاصی برای موتورهای جستجو')
                ->where('seo.keywords', 'خدمت، رشد، کوچینگ')
                ->where('seo.type', 'Service'));
    }

    public function test_blog_index_lists_posts(): void
    {
        $this->get('/blog')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Blog/Index')
                ->where('posts.total', 3)
                ->has('posts.data', 2)
                ->has('categories')
                ->has('featured'));
    }

    public function test_blog_filters_are_read_from_shareable_query_parameters(): void
    {
        $this->get('/blog?q=استعداد&category=articles&sort=popular&page=1')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.q', 'استعداد')
                ->where('filters.category', 'articles')
                ->where('filters.sort', 'popular')
                ->where('posts.current_page', 1));
    }

    public function test_blog_show_renders_post_with_an_inline_video_url(): void
    {
        $post = BlogPost::published()->first();
        $post->update(['video_url' => 'https://www.aparat.com/v/abc123']);

        $this->get("/blog/{$post->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Blog/Show')
                ->where('post.slug', $post->slug)
                ->where('post.video_url', 'https://www.aparat.com/v/abc123')
                ->where('seo.type', 'Article')
                ->where('seo.schema.@type', 'Article'));
    }

    public function test_shop_index_lists_products_with_pagination_metadata(): void
    {
        $this->get('/shop')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Shop/Index')
                ->where('products.total', 4)
                ->has('products.data', 4)
                ->has('categories'));
    }

    public function test_shop_filters_are_read_from_shareable_query_parameters(): void
    {
        $this->get('/shop?type=book&category=books&sort=price_desc&q=والد')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.type', 'book')
                ->where('filters.category', 'books')
                ->where('filters.sort', 'price_desc')
                ->where('filters.q', 'والد')
                ->where('products.total', 2));
    }

    public function test_shop_show_renders_product(): void
    {
        $book = Product::active()->ofType('book')->first();

        $this->get("/shop/{$book->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Shop/Show')
                ->where('product.slug', $book->slug)
                ->missing('product.file_path')
                ->missing('product.meta'));

        $podcast = Product::active()->ofType('podcast')->first();
        $this->get("/shop/{$podcast->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Shop/Show')
                ->where('product.episodes.0.audio_url', 'storage/podcasts/episode-1.mp3'));
    }

    public function test_product_can_be_added_to_cart_and_cart_page_is_rendered(): void
    {
        $product = Product::active()->ofType('book')->first();

        $this->post("/cart/products/{$product->id}", ['quantity' => 2])
            ->assertRedirect('/cart')
            ->assertSessionHas('cart.'.$product->id, 2);

        $this->get('/cart')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Cart/Index')
                ->where('items.0.id', $product->id)
                ->where('items.0.quantity', 2)
                ->where('totals.total', $product->finalPrice() * 2));
    }

    public function test_authenticated_cart_creates_a_product_order_and_opens_checkout(): void
    {
        $user = User::factory()->create();
        $product = Product::active()->ofType('book')->first();

        $response = $this->actingAs($user)
            ->withSession(['cart' => [$product->id => 1]])
            ->get('/cart/checkout');
        $order = Order::where('user_id', $user->id)->firstOrFail();

        $response->assertRedirect(route('checkout.show', ['order' => $order->order_number], false));
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'purchasable_type' => Product::class,
            'purchasable_id' => $product->id,
            'total' => $product->finalPrice(),
        ]);
        $this->assertFalse(session()->has('cart'));

        $this->actingAs($user)
            ->get("/checkout/{$order->order_number}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Checkout/Show')
                ->where('order.items.0.product_slug', $product->slug));
    }

    public function test_purchased_digital_product_download_is_private(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $product = Product::active()->whereIn('type', ['book', 'digital'])->firstOrFail();
        $product->update(['file_path' => 'digital/private-guide.pdf']);
        Storage::disk('local')->put('digital/private-guide.pdf', 'private content');

        $this->actingAs($user)
            ->get(route('products.download', $product))
            ->assertForbidden();

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'user_id' => $user->id,
            'status' => 'paid',
            'subtotal' => $product->finalPrice(),
            'total' => $product->finalPrice(),
            'paid_at' => now(),
        ]);
        $order->items()->create([
            'purchasable_type' => Product::class,
            'purchasable_id' => $product->id,
            'title' => $product->title,
            'unit_price' => $product->finalPrice(),
            'quantity' => 1,
            'total' => $product->finalPrice(),
        ]);

        $this->actingAs($user)
            ->get(route('products.download', $product))
            ->assertOk()
            ->assertHeader('cache-control', 'no-store, private');
    }

    public function test_guest_must_login_before_checkouting_cart(): void
    {
        $this->get('/cart/checkout')->assertRedirect('/login');
    }

    public function test_coaching_about_contact_pages_render(): void
    {
        $this->get('/coaching')->assertOk();
        $this->get('/about')->assertOk();
        $this->get('/contact')->assertOk();
    }

    public function test_about_page_reads_founder_and_team_profiles_from_database(): void
    {
        $this->get('/about')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('About/Index')
                ->where('founder.name', 'دکتر بیدی')
                ->where('founder.role', 'بنیان‌گذار و مدیر مرکز')
                ->where('founder.specialty', 'طراحی مسیر رشد، کارآفرینی، مهارت‌های آینده')
                ->has('instructors', 1)
                ->where('instructors.0.name', 'مدرس نمونه')
                ->where('instructors.0.role', 'مدرس و مربی')
                ->has('coaches', 1)
                ->where('coaches.0.name', 'کوچ نمونه')
                ->where('coaches.0.role', 'کوچ رشد و مسیر آینده'));
    }
}
