<?php

namespace Tests\Feature\Auth;

use App\Models\PhonePasswordResetToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_password_link_screen_can_be_rendered(): void
    {
        $response = $this->get('/forgot-password');

        $response->assertStatus(200);
    }

    public function test_reset_code_is_stored_and_redirects_to_the_code_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/forgot-password', ['phone' => $user->phone]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('password.reset'));

        $this->assertDatabaseHas('phone_password_reset_tokens', [
            'phone' => $user->phone,
        ]);

        $this->assertNotNull(session('dev_code'));
        $this->assertSame($user->phone, session('reset_phone'));
    }

    public function test_reset_code_is_not_revealed_for_unknown_phone(): void
    {
        $this->post('/forgot-password', ['phone' => '09121234567'])
            ->assertRedirect();

        $this->assertDatabaseCount('phone_password_reset_tokens', 0);
        $this->assertNull(session('dev_code'));
    }

    public function test_reset_test_code_is_not_exposed_in_production(): void
    {
        // environment() reads the container binding in Laravel 11+.
        $this->app['env'] = 'production';
        Config::set('app.env', 'production');
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        $user = User::factory()->create();

        $this->post('/forgot-password', ['phone' => $user->phone])
            ->assertRedirect(route('password.reset'));

        $this->assertNull(session('dev_code'));
        $this->get('/reset-password')
            ->assertInertia(fn ($page) => $page
                ->component('Auth/ResetPassword')
                ->where('dev_code', null));
    }

    public function test_reset_password_screen_can_be_rendered(): void
    {
        $user = User::factory()->create();

        $this->post('/forgot-password', ['phone' => $user->phone]);
        $response = $this->get('/reset-password');

        $response->assertStatus(200);
    }

    public function test_password_can_be_reset_with_valid_code(): void
    {
        $user = User::factory()->create();

        $this->post('/forgot-password', ['phone' => $user->phone]);
        $code = session('dev_code');

        $response = $this->post('/reset-password', [
            'phone' => $user->phone,
            'code' => $code,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('login'));

        $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
        $this->assertDatabaseMissing('phone_password_reset_tokens', [
            'phone' => $user->phone,
        ]);
    }

    public function test_password_can_not_be_reset_with_invalid_code(): void
    {
        $user = User::factory()->create();

        $this->post('/forgot-password', ['phone' => $user->phone]);

        $response = $this->post('/reset-password', [
            'phone' => $user->phone,
            'code' => '000000',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertSessionHasErrors('code');

        $this->assertFalse(Hash::check('new-password', $user->refresh()->password));
    }

    public function test_reset_code_requests_are_rate_limited(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 3; $i++) {
            $this->post('/forgot-password', ['phone' => $user->phone]);
        }

        $response = $this->post('/forgot-password', ['phone' => $user->phone]);

        $response->assertSessionHasErrors('phone');
    }
}
