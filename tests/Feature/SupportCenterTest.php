<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SupportCenterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        (new RoleAndPermissionSeeder())->run();
    }

    public function test_user_can_create_ticket_and_staff_gets_notified(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($user)->post('/dashboard/support', [
            'subject' => 'دسترسی به دوره',
            'body' => 'دوره خریداری شده در پنل من نیست.',
            'priority' => 'high',
        ])->assertRedirect();

        $this->assertDatabaseHas('tickets', ['user_id' => $user->id, 'subject' => 'دسترسی به دوره', 'status' => 'open']);
        $this->assertDatabaseHas('ticket_messages', ['user_id' => $user->id, 'body' => 'دوره خریداری شده در پنل من نیست.']);
        $this->assertSame(1, $admin->unreadNotifications()->count());
        $this->assertSame(0, $user->unreadNotifications()->count());
    }

    public function test_user_can_see_own_tickets_and_reply(): void
    {
        $user = User::factory()->create();
        $ticket = Ticket::create([
            'user_id' => $user->id,
            'subject' => 'سؤال درباره سفارش',
            'body' => 'سفارشم کجاست؟',
            'status' => 'answered',
            'priority' => 'medium',
        ]);

        $this->actingAs($user)->get('/dashboard/support')->assertOk();
        $this->actingAs($user)->get("/dashboard/support/{$ticket->id}")->assertOk();

        $this->actingAs($user)->post("/dashboard/support/{$ticket->id}/reply", [
            'body' => 'لطفاً شماره سفارش را می‌فرستید؟',
        ])->assertRedirect();

        $this->assertDatabaseHas('ticket_messages', ['ticket_id' => $ticket->id, 'body' => 'لطفاً شماره سفارش را می‌فرستید؟']);
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'status' => 'open']);
    }

    public function test_user_cannot_access_other_users_ticket(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $ticket = Ticket::create([
            'user_id' => $owner->id,
            'subject' => 'خصوصی',
            'body' => 'محتوا',
            'status' => 'open',
            'priority' => 'low',
        ]);

        $this->actingAs($other)->get("/dashboard/support/{$ticket->id}")->assertForbidden();
        $this->actingAs($other)->post("/dashboard/support/{$ticket->id}/reply", ['body' => 'hi'])->assertForbidden();
    }

    public function test_notification_center_lists_and_marks_read(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $ticket = Ticket::create([
            'user_id' => $user->id,
            'subject' => 'موضوع',
            'body' => 'متن',
            'status' => 'open',
            'priority' => 'medium',
        ]);
        TicketMessage::create(['ticket_id' => $ticket->id, 'user_id' => $admin->id, 'body' => 'پاسخ پشتیبانی']);

        $user->notify(new \App\Notifications\NewTicketMessage($ticket, $admin, true));
        $notification = $user->unreadNotifications()->first();

        $this->actingAs($user)->get('/dashboard/notifications')->assertOk();
        $this->actingAs($user)->post("/dashboard/notifications/{$notification->id}/read")->assertRedirect();
        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());
    }

    public function test_admin_can_see_tickets_in_content_center(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $admin->givePermissionTo('view tickets');

        $this->actingAs($admin)->get('/admin/content/tickets')->assertOk();
    }

    public function test_admin_can_view_ticket_thread_and_reply(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $admin->givePermissionTo('view tickets');

        $user = User::factory()->create();
        $ticket = Ticket::create([
            'user_id' => $user->id,
            'subject' => 'دسترسی به دوره',
            'body' => 'دوره خریداری شده را نمی‌بینم.',
            'status' => 'open',
            'priority' => 'high',
        ]);

        $this->actingAs($admin)->get("/admin/content/tickets/{$ticket->id}")->assertOk();

        $this->actingAs($admin)->post("/admin/content/tickets/{$ticket->id}/reply", [
            'body' => 'لطفاً یک بار از حساب خارج و دوباره وارد شوید.',
        ])->assertRedirect();

        $this->assertDatabaseHas('ticket_messages', [
            'ticket_id' => $ticket->id,
            'user_id' => $admin->id,
            'body' => 'لطفاً یک بار از حساب خارج و دوباره وارد شوید.',
        ]);
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'status' => 'answered']);
        $this->assertSame(1, $user->fresh()->unreadNotifications()->count());
        $this->assertSame(0, $admin->fresh()->unreadNotifications()->count());
    }

    public function test_staff_without_ticket_permission_cannot_view_thread(): void
    {
        $staff = User::factory()->create();
        $staff->assignRole('editor');

        $user = User::factory()->create();
        $ticket = Ticket::create([
            'user_id' => $user->id,
            'subject' => 'خصوصی',
            'body' => 'متن',
            'status' => 'open',
            'priority' => 'medium',
        ]);

        $this->actingAs($staff)->get("/admin/content/tickets/{$ticket->id}")->assertForbidden();
        $this->actingAs($staff)->post("/admin/content/tickets/{$ticket->id}/reply", ['body' => 'hi'])->assertForbidden();
    }
}
