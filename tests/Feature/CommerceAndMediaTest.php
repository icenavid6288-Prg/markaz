<?php

namespace Tests\Feature;

use App\Models\Coach;
use App\Models\CoachAvailability;
use App\Models\CoachingSession;
use App\Models\Enrollment;
use App\Models\Media;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CommerceAndMediaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_coach_can_create_weekly_recurring_availability(): void
    {
        $coach = User::factory()->create()->assignRole('coach');
        Coach::create(['user_id' => $coach->id, 'specialty' => 'رشد', 'is_available' => true]);

        $this->actingAs($coach)->post('/panel/coach/availability', [
            'available_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'repeat_weeks' => 3,
        ])->assertRedirect();

        $this->assertSame(3, CoachAvailability::where('coach_id', $coach->id)->count());
        $this->assertNotNull(CoachAvailability::where('coach_id', $coach->id)->value('series_id'));
    }

    public function test_cancelling_a_paid_session_refunds_the_order_and_frees_the_slot(): void
    {
        [$coach, $student, $slot, $session, $order] = $this->paidCoachingBooking();

        $this->actingAs($coach)->patch('/panel/coach/sessions/'.$session->id, [
            'status' => 'cancelled',
        ])->assertRedirect();

        $this->assertSame('cancelled', $session->fresh()->status);
        $this->assertSame('refunded', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->refunded_at);
        $this->assertSame('refunded', Payment::where('order_id', $order->id)->value('status'));
        $this->assertFalse((bool) $slot->fresh()->is_booked);
    }

    public function test_student_can_cancel_an_unpaid_upcoming_session(): void
    {
        $coach = User::factory()->create()->assignRole('coach');
        Coach::create(['user_id' => $coach->id, 'specialty' => 'رشد', 'hourly_rate' => 150000, 'is_available' => true]);
        $slot = CoachAvailability::create([
            'coach_id' => $coach->id,
            'available_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'is_booked' => false,
        ]);
        $student = User::factory()->create();

        $this->actingAs($student)->post('/coaching/book', ['availability_id' => $slot->id])->assertRedirect();
        $session = CoachingSession::where('student_id', $student->id)->firstOrFail();
        $order = Order::where('user_id', $student->id)->firstOrFail();
        $this->assertSame('pending', $order->status);

        $this->actingAs($student)->post('/dashboard/sessions/'.$session->id.'/cancel')->assertRedirect();

        $this->assertSame('cancelled', $session->fresh()->status);
        $this->assertSame('cancelled', $order->fresh()->status);
        $this->assertFalse((bool) $slot->fresh()->is_booked);
    }

    public function test_student_cannot_cancel_a_completed_session(): void
    {
        [$coach, $student, $slot, $session] = $this->paidCoachingBooking();
        $session->update(['status' => 'completed']);

        $this->actingAs($student)->post('/dashboard/sessions/'.$session->id.'/cancel')->assertStatus(422);
        $this->assertSame('completed', $session->fresh()->status);
        $this->assertTrue((bool) $slot->fresh()->is_booked);
    }

    public function test_expired_unpaid_coaching_reservation_releases_the_slot(): void
    {
        $coach = User::factory()->create()->assignRole('coach');
        Coach::create(['user_id' => $coach->id, 'specialty' => 'رشد', 'hourly_rate' => 200000, 'is_available' => true]);
        $slot = CoachAvailability::create([
            'coach_id' => $coach->id,
            'available_date' => now()->addDay()->toDateString(),
            'start_time' => '16:00',
            'end_time' => '17:00',
            'is_booked' => false,
        ]);
        $student = User::factory()->create();
        $this->actingAs($student)->post('/coaching/book', ['availability_id' => $slot->id]);
        $order = Order::where('user_id', $student->id)->firstOrFail();
        $order->update(['reservation_expires_at' => now()->subMinute()]);

        $this->artisan('commerce:release-expired-reservations')->assertExitCode(0);

        $this->assertSame('cancelled', $order->fresh()->status);
        $this->assertFalse((bool) $slot->fresh()->is_booked);
        $this->assertSame('cancelled', CoachingSession::where('student_id', $student->id)->value('status'));
    }

    public function test_admin_can_upload_and_version_media(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create()->assignRole('admin');

        $this->actingAs($admin)->get('/admin/media')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Media/Index'));

        $this->actingAs($admin)->post('/admin/media', [
            'file' => UploadedFile::fake()->create('cover.jpg', 40, 'image/jpeg'),
            'name' => 'کاور دوره',
            'alt' => 'کاور',
        ])->assertRedirect();

        $media = Media::where('name', 'کاور دوره')->firstOrFail();
        $this->assertSame(1, (int) $media->version);
        $this->assertTrue($media->is_current);
        Storage::disk('public')->assertExists(preg_replace('#^/storage/#', '', $media->url_path));

        $this->actingAs($admin)->post('/admin/media/'.$media->id.'/replace', [
            'file' => UploadedFile::fake()->create('cover-v2.png', 40, 'image/png'),
        ])->assertRedirect();

        $fresh = $media->fresh();
        $this->assertSame(2, (int) $fresh->version);
        $this->assertSame(1, $fresh->versions()->count());
        $this->assertSame($media->id, $fresh->id);
    }

    public function test_admin_can_open_reports_and_export_enrollments_csv(): void
    {
        $admin = User::factory()->create()->assignRole('admin');
        $user = User::factory()->create(['name' => 'دانش‌آموز گزارش']);
        Enrollment::create([
            'user_id' => $user->id,
            'course_id' => \App\Models\Course::factory()->create(['title' => 'دوره گزارش'])->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->actingAs($admin)->get('/admin/reports')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Reports/Index')->where('summary.enrollments', 1));

        $this->actingAs($admin)->get('/admin/reports/enrollments.csv')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8')
            ->assertSee('دوره گزارش', false)
            ->assertSee('دانش‌آموز گزارش', false);
    }

    /**
     * @return array{0: User, 1: User, 2: CoachAvailability, 3: CoachingSession, 4: Order}
     */
    private function paidCoachingBooking(): array
    {
        $coach = User::factory()->create()->assignRole('coach');
        Coach::create(['user_id' => $coach->id, 'specialty' => 'رشد', 'hourly_rate' => 250000, 'is_available' => true]);
        $slot = CoachAvailability::create([
            'coach_id' => $coach->id,
            'available_date' => now()->addDay()->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
            'is_booked' => false,
        ]);
        $student = User::factory()->create();
        $this->actingAs($student)->post('/coaching/book', ['availability_id' => $slot->id]);
        $session = CoachingSession::where('student_id', $student->id)->firstOrFail();
        $order = Order::where('user_id', $student->id)->firstOrFail();
        $order->update(['status' => 'paid', 'paid_at' => now(), 'reservation_expires_at' => null]);
        Payment::create([
            'order_id' => $order->id,
            'user_id' => $student->id,
            'gateway' => 'local',
            'transaction_id' => 'LOCAL-'.$order->order_number,
            'amount' => $order->total,
            'status' => 'success',
            'verified_at' => now(),
        ]);

        return [$coach, $student, $slot->fresh(), $session, $order->fresh()];
    }
}
