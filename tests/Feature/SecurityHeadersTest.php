<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_responses_include_baseline_security_headers_and_csp(): void
    {
        $this->get('/')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
            ->assertHeaderContains('Content-Security-Policy', "script-src 'self' 'nonce-");
    }

    public function test_authenticated_responses_are_private_and_not_cached(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/profile')
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_checkout_and_review_mutations_have_rate_limits(): void
    {
        foreach (['courses.checkout', 'events.checkout', 'checkout.pay'] as $routeName) {
            $route = app('router')->getRoutes()->getByName($routeName);

            $this->assertNotNull($route, "Route [{$routeName}] is missing.");
            $this->assertContains('throttle:10,1', $route->middleware(), "Route [{$routeName}] is missing its checkout throttle.");
        }

        foreach (['courses.reviews.store', 'products.reviews.store'] as $routeName) {
            $route = app('router')->getRoutes()->getByName($routeName);

            $this->assertContains('throttle:5,1', $route->middleware(), "Route [{$routeName}] is missing its review throttle.");
        }
    }
}
