<?php

namespace Tests\Feature\Auth;

use App\Models\PhoneLoginToken;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_user_can_login_with_phone_and_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret-password')]);

        $response = $this->post('/login', [
            'phone' => $user->phone,
            'password' => 'secret-password',
            'remember' => true,
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseCount('phone_login_tokens', 0);
    }

    public function test_login_with_wrong_password_is_rejected(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret-password')]);

        $response = $this->post('/login', [
            'phone' => $user->phone,
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('phone');
        $this->assertGuest();
        $this->assertDatabaseCount('phone_login_tokens', 0);
    }

    public function test_inactive_user_cannot_login_with_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('secret-password'),
            'is_active' => false,
        ]);

        $this->post('/login', [
            'phone' => $user->phone,
            'password' => 'secret-password',
        ])->assertSessionHasErrors('phone');

        $this->assertGuest();
    }

    public function test_password_login_attempts_are_rate_limited(): void
    {
        $user = User::factory()->create(['password' => Hash::make('secret-password')]);

        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'phone' => $user->phone,
                'password' => 'wrong-password',
            ]);
        }

        $response = $this->post('/login', [
            'phone' => $user->phone,
            'password' => 'secret-password',
        ]);

        $response->assertSessionHasErrors('phone');
        $this->assertGuest();
    }

    public function test_login_with_empty_password_still_sends_an_sms_code(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'phone' => $user->phone,
            'password' => '',
        ]);

        $response->assertRedirect(route('login', ['step' => 'code'], absolute: false));
        $this->assertGuest();
        $this->assertDatabaseHas('phone_login_tokens', ['phone' => $user->phone]);
    }

    public function test_login_request_sends_a_code_and_opens_the_verification_step(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'phone' => $user->phone,
        ]);

        $response->assertRedirect(route('login', ['step' => 'code'], absolute: false));
        $this->assertGuest();
        $this->assertDatabaseHas('phone_login_tokens', ['phone' => $user->phone]);
        $this->assertSame($user->phone, session('login_phone'));
        $this->assertNotNull(session('login_dev_code'));

        $this->get(route('login', ['step' => 'code']))
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Login')
                ->where('step', 'code')
                ->where('phone', $user->phone));
    }

    public function test_unknown_phone_is_sent_to_registration_with_the_phone_prefilled(): void
    {
        $phone = '09121234567';
        $message = 'اگر حساب کاربری ندارید، ابتدا ثبت‌نام کنید.';

        $response = $this->post('/login', [
            'phone' => $phone,
        ]);

        $response->assertRedirect(route('register', ['phone' => $phone], absolute: false));
        $response->assertSessionHas('status', $message);
        $this->assertGuest();
        $this->assertDatabaseCount('phone_login_tokens', 0);

        $this->get(route('register', ['phone' => $phone]))
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Register')
                ->where('status', $message));
    }

    public function test_unknown_modal_phone_opens_registration_in_the_modal(): void
    {
        $phone = '09121234567';
        $message = 'اگر حساب کاربری ندارید، ابتدا ثبت‌نام کنید.';

        $response = $this
            ->from('/courses')
            ->post('/login', [
                'phone' => $phone,
                'modal' => true,
            ]);

        $response->assertRedirect('/courses');
        $response->assertSessionHas('auth_modal.mode', 'register');
        $response->assertSessionHas('auth_modal.step', 'phone');
        $response->assertSessionHas('auth_modal.phone', $phone);
        $response->assertSessionHas('auth_modal.status', $message);
        $this->assertGuest();
    }

    public function test_modal_login_request_returns_to_the_public_page_with_modal_state(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->from('/courses')
            ->post('/login', [
                'phone' => $user->phone,
                'modal' => true,
            ]);

        $response->assertRedirect('/courses');
        $response->assertSessionHas('auth_modal.mode', 'login');
        $response->assertSessionHas('auth_modal.step', 'code');
        $response->assertSessionHas('auth_modal.phone', $user->phone);
    }

    public function test_modal_login_can_verify_the_code_and_open_the_dashboard(): void
    {
        $user = User::factory()->create();

        $this->from('/courses')->post('/login', [
            'phone' => $user->phone,
            'modal' => true,
        ]);
        $code = session('login_dev_code');

        $response = $this
            ->from('/courses')
            ->post('/login/verify', [
                'phone' => $user->phone,
                'code' => $code,
                'modal' => true,
            ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_modal_login_wrong_code_stays_in_the_popup_with_the_dev_code(): void
    {
        $user = User::factory()->create();

        $this->from('/courses')->post('/login', [
            'phone' => $user->phone,
            'modal' => true,
        ]);
        $code = session('login_dev_code');

        $this->post('/login/verify', [
            'phone' => $user->phone,
            'code' => '000000',
            'modal' => true,
        ])
            ->assertRedirect('/courses')
            ->assertSessionHasErrors('code')
            ->assertSessionHas('auth_modal', fn ($state) =>
                $state['mode'] === 'login'
                && $state['step'] === 'code'
                && $state['phone'] === $user->phone
                && $state['dev_code'] === $code
            );

        $this->assertGuest();
    }

    public function test_valid_code_authenticates_the_user(): void
    {
        $user = User::factory()->create();

        $this->post('/login', ['phone' => $user->phone]);
        $code = session('login_dev_code');

        $response = $this->post('/login/verify', [
            'phone' => $user->phone,
            'code' => $code,
            'remember' => true,
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseMissing('phone_login_tokens', ['phone' => $user->phone]);
    }

    public function test_login_test_code_is_not_exposed_in_production(): void
    {
        Config::set('app.env', 'production');
        $user = User::factory()->create();

        $this->from('/courses')->post('/login', [
            'phone' => $user->phone,
            'modal' => true,
        ])->assertRedirect('/courses');

        $this->assertNull(session('login_dev_code'));
        $this->assertNull(session('auth_modal.dev_code'));

        $this->get(route('login', ['step' => 'code']))
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Login')
                ->where('step', 'code')
                ->where('dev_code', null));
    }

    public function test_invalid_code_does_not_authenticate_the_user(): void
    {
        $user = User::factory()->create();

        $this->post('/login', ['phone' => $user->phone]);

        $response = $this->post('/login/verify', [
            'phone' => $user->phone,
            'code' => '000000',
        ]);

        $response->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_expired_code_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->post('/login', ['phone' => $user->phone]);
        $code = session('login_dev_code');
        PhoneLoginToken::where('phone', $user->phone)->update([
            'created_at' => now()->subMinutes(6),
        ]);

        $response = $this->post('/login/verify', [
            'phone' => $user->phone,
            'code' => $code,
        ]);

        $response->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_login_shows_a_friendly_error_when_sms_sending_fails(): void
    {
        $user = User::factory()->create();

        Setting::set('sms_driver', 'melipayamak', 'sms');
        Setting::set('sms_enabled', '1', 'sms');
        Setting::setSecret('sms_melipayamak_username', 'panel-user', 'sms');
        Setting::setSecret('sms_melipayamak_password', 'panel-pass', 'sms');
        Setting::set('sms_melipayamak_sender', '10002040', 'sms');
        Http::fake([
            'rest.payamak-panel.com/*' => Http::response('{"Value":-110,"RetStatus":-110,"StrRetStatus":"Not Ok"}'),
        ]);

        $response = $this->from('/login')->post('/login', [
            'phone' => $user->phone,
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors('phone');
        $this->assertGuest();
        $this->assertDatabaseHas('phone_login_tokens', ['phone' => $user->phone]);
    }

    public function test_login_code_requests_are_rate_limited(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 3; $i++) {
            $this->post('/login', ['phone' => $user->phone]);
        }

        $response = $this->post('/login', ['phone' => $user->phone]);

        $response->assertSessionHasErrors('phone');
        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
