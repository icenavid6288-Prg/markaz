<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Service;
use App\Models\Testimonial;
use Database\Seeders\RoleAndPermissionSeeder;
use Database\Seeders\SiteSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomepageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleAndPermissionSeeder::class, SiteSettingSeeder::class]);
    }

    public function test_homepage_renders_with_courses(): void
    {
        Course::factory()->create(['is_published' => true, 'is_featured' => true]);

        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Home')
            ->has('courses', 1)
            ->has('site.name')
            ->where('site.popup.enabled', true)
            ->where('site.popup.cta_url', '/contact')
            ->where('seo.type', 'WebSite')
            ->has('seo.schema'));
    }

    public function test_homepage_shows_services_and_testimonials(): void
    {
        Service::factory()->create(['is_active' => true, 'is_featured' => true]);
        Testimonial::factory()->create(['is_approved' => true]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('services', 1)
                ->has('testimonials', 1));
    }

    public function test_contact_settings_come_from_database(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('site.contact.phone', '09330961312')
                ->where('site.contact.address', 'خیابان بیهق، بین بیهق ۹ و ۱۱، جنب قنادی درخشان'));
    }
}
