<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Database\Seeders\SiteSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_guest_is_redirected_from_admin_to_the_admin_login(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
    }

    public function test_admin_login_screen_can_be_rendered(): void
    {
        $this->get('/admin/login')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Auth/AdminLogin'));
    }

    public function test_admin_login_sends_an_sms_code_and_rejects_passwords(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->post('/admin/login', [
            'phone' => $admin->phone,
            'password' => 'password',
            'remember' => true,
        ])
            ->assertRedirect(route('admin.login', ['step' => 'code'], absolute: false));

        $this->assertGuest();
        $this->assertDatabaseHas('phone_login_tokens', ['phone' => $admin->phone]);
        $this->assertNotNull(session('admin_login_dev_code'));
    }

    public function test_admin_can_verify_the_sms_code_and_enter_the_panel(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->post('/admin/login', ['phone' => $admin->phone]);
        $code = session('admin_login_dev_code');

        $this->post('/admin/login/verify', [
            'phone' => $admin->phone,
            'code' => $code,
            'remember' => true,
        ])->assertRedirect('/admin');

        $this->assertAuthenticatedAs($admin);
        $this->assertDatabaseMissing('phone_login_tokens', ['phone' => $admin->phone]);
    }

    public function test_non_admin_cannot_use_the_admin_login(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->from('/admin/login')
            ->post('/admin/login', [
                'phone' => $student->phone,
            ])
            ->assertSessionHasErrors('phone');

        $this->assertGuest();
        $this->assertDatabaseCount('phone_login_tokens', 0);
    }

    public function test_super_admin_can_access_dashboard(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('super-admin');

        $this->actingAs($admin)
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Dashboard')->has('stats'));
    }

    public function test_student_cannot_access_admin(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');

        $this->actingAs($student)->get('/admin')->assertForbidden();
    }

    public function test_instructor_panel_cannot_read_admin_analytics(): void
    {
        $instructor = User::factory()->create();
        $instructor->assignRole('instructor');

        $this->actingAs($instructor)->get('/admin')->assertForbidden();
        $this->actingAs($instructor)->get('/panel/instructor')->assertOk();
    }

    public function test_admin_can_browse_dynamic_user_directory(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        User::factory()->create(['name' => 'کاربر آزمایشی']);

        $this->actingAs($admin)
            ->get('/admin/users?status=active')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Users/Index')
                ->has('users.data')
                ->has('summary.total')
                ->where('filters.status', 'active'));
    }

    public function test_admin_can_view_a_full_user_profile(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $user = User::factory()->create(['name' => 'کاربر پروفایل']);
        $user->assignRole('student');

        $this->actingAs($admin)
            ->get("/admin/users/{$user->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Users/Show')
                ->where('user.id', $user->id)
                ->where('user.name', 'کاربر پروفایل')
                ->has('user.recent_enrollments')
                ->has('user.recent_orders'));
    }

    public function test_editor_cannot_manage_users_or_settings(): void
    {
        $editor = User::factory()->create();
        $editor->assignRole('editor');

        $this->actingAs($editor)->get('/admin/users')->assertForbidden();
        $this->actingAs($editor)->get('/admin/settings')->assertForbidden();
    }

    public function test_admin_can_toggle_another_users_active_state(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $user = User::factory()->create(['is_active' => true]);

        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}/toggle-active")
            ->assertSessionHas('success');

        $this->assertFalse($user->fresh()->is_active);
    }

    public function test_admin_can_update_user_details_and_assign_a_role(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $user = User::factory()->create(['name' => 'نام قدیمی']);
        $user->assignRole('student');

        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}", [
                'name' => 'نام جدید',
                'email' => $user->email,
                'phone' => '09120000000',
                'role' => 'coach',
            ])
            ->assertSessionHas('success');

        $this->assertSame('نام جدید', $user->fresh()->name);
        $this->assertSame('09120000000', $user->fresh()->phone);
        $this->assertTrue($user->fresh()->hasRole('coach'));
        $this->assertFalse($user->fresh()->hasRole('student'));
    }

    public function test_non_super_admin_cannot_assign_or_change_super_admin_role(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $user = User::factory()->create();
        $user->assignRole('student');

        $this->actingAs($admin)
            ->patch("/admin/users/{$user->id}/role", ['role' => 'super-admin'])
            ->assertForbidden();
    }

    public function test_admin_can_update_role_details_and_permissions(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $role = \Spatie\Permission\Models\Role::findByName('coach');

        $this->actingAs($admin)
            ->put("/admin/access/roles/{$role->id}", [
                'label' => 'کوچ اختصاصی',
                'description' => 'همراه رشد و مسیر نوجوان.',
                'permissions' => ['view coaching'],
            ])
            ->assertSessionHas('success');

        $this->assertSame('کوچ اختصاصی', $role->fresh()->label);
        $this->assertSame('همراه رشد و مسیر نوجوان.', $role->fresh()->description);
        $this->assertTrue($role->fresh()->hasPermissionTo('view coaching'));
    }

    public function test_admin_can_assign_a_system_role_to_an_active_user(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $user = User::factory()->create();
        $user->assignRole('student');
        $role = \Spatie\Permission\Models\Role::findByName('coach');

        $this->actingAs($admin)
            ->patch("/admin/access/roles/{$role->id}/users", ['user_id' => $user->id])
            ->assertSessionHas('success');

        $this->assertTrue($user->fresh()->hasRole('coach'));
        $this->assertFalse($user->fresh()->hasRole('student'));
    }

    public function test_admin_can_update_public_homepage_content(): void
    {
        $this->seed(SiteSettingSeeder::class);
        $admin = User::factory()->create();
        $admin->assignRole('super-admin');

        $this->actingAs($admin)
            ->put('/admin/settings', [
                'settings' => [
                    'homepage_cta_primary' => 'رزرو ارزیابی اولیه',
                ],
            ])
            ->assertSessionHas('success');

        $this->assertSame('رزرو ارزیابی اولیه', Setting::get('homepage_cta_primary'));
    }
}
