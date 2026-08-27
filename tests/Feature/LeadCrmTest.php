<?php

namespace Tests\Feature;

use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadCrmTest extends TestCase
{
    use RefreshDatabase;

    public function test_lead_form_creates_a_lead(): void
    {
        $response = $this->post('/leads', [
            'name' => 'مریم احمدی',
            'phone' => '09121234567',
            'child_age' => '۱۴',
            'grade' => 'متوسطه اول (۷-۹)',
            'need' => 'کشف استعداد',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('leads', [
            'name' => 'مریم احمدی',
            'phone' => '09121234567',
            'source' => 'website',
            'status' => 'new',
        ]);
        $this->assertDatabaseCount('lead_activities', 1);
    }

    public function test_lead_form_requires_name_and_phone(): void
    {
        $this->post('/leads', ['name' => ''])
            ->assertSessionHasErrors(['name', 'phone']);
    }
}
