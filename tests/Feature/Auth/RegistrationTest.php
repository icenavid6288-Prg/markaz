<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        // Registration is two-step: submit the form, receive a one-time SMS code,
        // then verify the code to complete the account and enter the panel.
        $this->post('/register', [
            'name' => 'Test User',
            'phone' => '09121234567',
        ])->assertRedirect(route('register', ['step' => 'code'], absolute: false));

        $this->assertGuest();
        $code = session('register_dev_code');
        $this->assertNotNull($code);

        $response = $this->post('/register/verify', [
            'phone' => '09121234567',
            'code' => $code,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', ['phone' => '09121234567']);
    }

    public function test_account_is_not_created_until_the_sms_code_is_verified(): void
    {
        // Submitting the form must NOT create the account by itself — the
        // one-time code is mandatory before the user exists.
        $this->post('/register', [
            'name' => 'Test User',
            'phone' => '09129876543',
        ])->assertRedirect(route('register', ['step' => 'code'], absolute: false));

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['phone' => '09129876543']);
    }

    public function test_wrong_code_is_rejected_and_does_not_create_account(): void
    {
        $this->post('/register', [
            'name' => 'Test User',
            'phone' => '09129876544',
        ]);

        $this->post('/register/verify', [
            'phone' => '09129876544',
            'code' => '000000',
        ])->assertSessionHasErrors('code');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['phone' => '09129876544']);
    }

    public function test_registration_test_code_is_not_exposed_in_production(): void
    {
        // environment() reads the container binding in Laravel 11+.
        $this->app['env'] = 'production';
        Config::set('app.env', 'production');
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);

        $this->from('/')->post('/register', [
            'name' => 'Production User',
            'phone' => '09126667788',
            'modal' => true,
        ])->assertRedirect('/');

        $this->assertNull(session('register_dev_code'));
        $this->assertNull(session('auth_modal.dev_code'));

        $this->get(route('register', ['step' => 'code']))
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Register')
                ->where('step', 'code')
                ->where('dev_code', null));
    }

    public function test_modal_registration_keeps_the_code_step_in_the_popup(): void
    {
        // The popup flow: submit the form with modal=1, the backend flashes the
        // auth_modal state (step=code) and returns to the same page instead of
        // navigating to /register?step=code.
        $this->from('/')
            ->post('/register', [
                'name' => 'Modal User',
                'phone' => '09127778899',
                'modal' => true,
            ])
            ->assertRedirect('/')
            ->assertSessionHas('auth_modal', fn ($state) =>
                $state['mode'] === 'register'
                && $state['step'] === 'code'
                && $state['phone'] === '09127778899'
            );

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['phone' => '09127778899']);

        // Verifying with the modal flag completes the registration.
        $code = session('register_dev_code');
        $this->assertNotNull($code);

        $this->post('/register/verify', [
            'phone' => '09127778899',
            'code' => $code,
            'modal' => true,
        ])->assertRedirect('/dashboard')->assertSessionMissing('auth_modal');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['phone' => '09127778899']);
    }

    public function test_modal_registration_wrong_code_stays_in_popup_with_error(): void
    {
        $this->from('/')
            ->post('/register', [
                'name' => 'Modal User',
                'phone' => '09127778898',
                'password' => 'password',
                'password_confirmation' => 'password',
                'modal' => true,
            ])
            ->assertRedirect('/');

        $this->post('/register/verify', [
            'phone' => '09127778898',
            'code' => '000000',
            'modal' => true,
        ])
            ->assertRedirect('/')
            ->assertSessionHasErrors('code')
            ->assertSessionHas('auth_modal', fn ($state) =>
                $state['mode'] === 'register'
                && $state['step'] === 'code'
                && $state['phone'] === '09127778898'
            );

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['phone' => '09127778898']);
    }

    public function test_registration_requires_an_iranian_mobile_number(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'phone' => '02112345678',
        ]);

        $response->assertSessionHasErrors('phone');
        $this->assertGuest();
    }

    public function test_registration_rejects_duplicate_phone_number(): void
    {
        $user = \App\Models\User::factory()->create();

        $response = $this->post('/register', [
            'name' => 'Test User',
            'phone' => $user->phone,
        ]);

        $response->assertSessionHasErrors('phone');
        $this->assertGuest();
    }
}
