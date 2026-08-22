<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Coach;
use App\Models\CoachingSession;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Student;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanelWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_instructor_can_grade_a_submission_from_their_panel(): void
    {
        $instructor = User::factory()->create()->assignRole('instructor');
        $course = Course::factory()->create(['instructor_id' => $instructor->id]);
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'm', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'تمرین', 'slug' => 'a', 'type' => 'assignment', 'sort_order' => 1]);
        $assignment = Assignment::create(['lesson_id' => $lesson->id, 'course_id' => $course->id, 'title' => 'تکلیف پنل', 'max_score' => 100]);
        $student = User::factory()->create();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'enrolled_at' => now()]);
        $submission = Submission::create(['assignment_id' => $assignment->id, 'user_id' => $student->id, 'content' => 'پاسخ', 'status' => 'submitted', 'submitted_at' => now()]);

        $this->actingAs($instructor)->get('/panel/instructor')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Instructor/Dashboard')->has('submissions', 1));

        $this->actingAs($instructor)->post(route('panel.instructor.submissions.grade', $submission), [
            'score' => 88,
            'feedback' => 'عالی بود',
        ])->assertRedirect();

        $this->assertDatabaseHas('submissions', ['id' => $submission->id, 'status' => 'graded', 'score' => 88]);
    }

    public function test_instructor_cannot_grade_another_instructors_submission(): void
    {
        $owner = User::factory()->create()->assignRole('instructor');
        $other = User::factory()->create()->assignRole('instructor');
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'm', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'تمرین', 'slug' => 'a', 'type' => 'assignment', 'sort_order' => 1]);
        $assignment = Assignment::create(['lesson_id' => $lesson->id, 'course_id' => $course->id, 'title' => 'تکلیف', 'max_score' => 100]);
        $submission = Submission::create(['assignment_id' => $assignment->id, 'user_id' => User::factory()->create()->id, 'content' => 'پاسخ', 'status' => 'submitted', 'submitted_at' => now()]);

        $this->actingAs($other)->post(route('panel.instructor.submissions.grade', $submission), [
            'score' => 10,
        ])->assertForbidden();
    }

    public function test_coach_can_add_availability_and_a_goal_for_their_student(): void
    {
        $coach = User::factory()->create()->assignRole('coach');
        Coach::create(['user_id' => $coach->id, 'specialty' => 'رشد', 'is_available' => true]);
        $student = User::factory()->create();
        CoachingSession::create([
            'coach_id' => $coach->id,
            'student_id' => $student->id,
            'scheduled_at' => now()->addDay(),
            'duration_minutes' => 45,
            'status' => 'pending',
        ]);

        $this->actingAs($coach)->post('/panel/coach/availability', [
            'available_date' => now()->addDays(2)->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
        ])->assertRedirect();
        $this->assertDatabaseHas('coach_availability', ['coach_id' => $coach->id, 'is_booked' => 0]);

        $this->actingAs($coach)->post('/panel/coach/goals', [
            'student_id' => $student->id,
            'title' => 'برنامه مطالعه روزانه',
        ])->assertRedirect();
        $this->assertDatabaseHas('coaching_goals', ['coach_id' => $coach->id, 'student_id' => $student->id, 'title' => 'برنامه مطالعه روزانه']);
    }

    public function test_parent_can_link_a_registered_child_by_phone(): void
    {
        $parent = User::factory()->create()->assignRole('parent');
        $child = User::factory()->create(['phone' => '09123334455']);

        $this->actingAs($parent)->post('/panel/parent/children', [
            'phone' => '09123334455',
            'grade' => 'هشتم',
        ])->assertRedirect();

        $this->assertDatabaseHas('students', ['user_id' => $child->id, 'parent_id' => $parent->id, 'grade' => 'هشتم']);
        $this->assertTrue($child->fresh()->hasRole('student'));
    }
}
