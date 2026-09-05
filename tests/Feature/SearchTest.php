<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\Course;
use App\Models\Product;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_global_search_returns_grouped_public_results(): void
    {
        Course::factory()->create([
            'title' => 'مدیریت زمان برای نوجوانان',
            'subtitle' => 'دوره کاربردی',
            'is_published' => true,
        ]);
        Course::factory()->create([
            'title' => 'دوره پیش‌نویس مدیریت زمان',
            'is_published' => false,
        ]);
        Product::create([
            'type' => 'book',
            'title' => 'کتاب مدیریت زمان',
            'slug' => 'time-management-book',
            'description' => 'راهنمای کاربردی',
            'is_active' => true,
        ]);
        Product::create([
            'type' => 'book',
            'title' => 'محصول غیرفعال مدیریت زمان',
            'slug' => 'inactive-time-management-book',
            'is_active' => false,
        ]);
        BlogPost::create([
            'title' => 'مدیریت زمان در مسیر رشد',
            'slug' => 'time-management-growth',
            'excerpt' => 'چند نکته کاربردی',
            'body' => 'متن مقاله',
            'status' => 'published',
            'published_at' => now(),
        ]);
        Service::factory()->create([
            'title' => 'مشاوره مدیریت زمان',
            'slug' => 'time-management-consulting',
            'summary' => 'همراهی تخصصی',
            'is_active' => true,
        ]);

        $this->get('/search?q=مدیریت زمان')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Search/Index')
                ->where('query', 'مدیریت زمان')
                ->has('results.courses', 1)
                ->has('results.products', 1)
                ->has('results.posts', 1)
                ->has('results.services', 1)
                ->where('results.courses.0.url', '/courses/'.Course::query()->where('is_published', true)->value('slug'))
                ->where('results.products.0.url', '/shop/time-management-book')
                ->where('results.posts.0.url', '/blog/time-management-growth')
                ->where('results.services.0.url', '/services/time-management-consulting'));
    }

    public function test_global_search_limits_empty_and_long_queries(): void
    {
        $this->get('/search')->assertInertia(fn (Assert $page) => $page
            ->component('Search/Index')
            ->where('query', '')
            ->has('results.courses', 0)
            ->has('results.products', 0)
            ->has('results.posts', 0)
            ->has('results.services', 0));

        $longQuery = str_repeat('جستجو ', 30);

        $this->get('/search?q='.urlencode($longQuery))
            ->assertInertia(fn (Assert $page) => $page
                ->where('query', mb_substr(trim($longQuery), 0, 80)));
    }

    public function test_global_search_route_is_throttled(): void
    {
        $route = app('router')->getRoutes()->getByName('search');

        $this->assertNotNull($route);
        $this->assertContains('throttle:30,1', $route->middleware());
    }
}
