<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardAssignmentsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        (new RoleAndPermissionSeeder())->run();
    }

    /** @return array{user: User, course: Course, assignment: Assignment} */
    private function makeStudentWithSubmissions(): array
    {
        $user = User::factory()->create()->assignRole('student');
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'mod', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'تمرین', 'slug' => 'a1', 'type' => 'assignment', 'sort_order' => 1]);
        $assignment = Assignment::create(['lesson_id' => $lesson->id, 'course_id' => $course->id, 'title' => 'تمرین کشف استعداد', 'description' => 'توضیح', 'max_score' => 100]);
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'progress_percent' => 40, 'enrolled_at' => now()]);

        Submission::create(['assignment_id' => $assignment->id, 'user_id' => $user->id, 'content' => 'پاسخ جدید', 'status' => 'submitted', 'submitted_at' => now()]);
        Submission::create(['assignment_id' => $assignment->id, 'user_id' => $user->id, 'content' => 'پاسخ قبلی', 'status' => 'graded', 'score' => 90, 'feedback' => 'ایده عالی بود!', 'submitted_at' => now()->subDays(2)]);

        return ['user' => $user, 'course' => $course, 'assignment' => $assignment];
    }

    public function test_dashboard_payload_includes_assignments_and_stats(): void
    {
        ['user' => $user, 'course' => $course] = $this->makeStudentWithSubmissions();

        $this->actingAs($user)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->has('assignments', 2)
                ->where('assignment_stats.pending', 1)
                ->where('assignment_stats.graded', 1)
                ->where('assignment_stats.average_score', 90)
                ->has('assignments.0', fn ($submission) => $submission
                    ->where('status', 'submitted')
                    ->where('title', 'تمرین کشف استعداد')
                    ->where('course', $course->title)
                    ->where('url', route('learning.player', ['course' => $course->slug, 'lesson' => $course->lessons()->first()->id]))
                    ->etc()));
    }

    public function test_assignments_page_lists_all_submissions_with_feedback(): void
    {
        ['user' => $user] = $this->makeStudentWithSubmissions();

        $this->actingAs($user)->get('/dashboard/assignments')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Assignments')
                ->has('assignments', 2)
                ->where('assignments.1.status', 'graded')
                ->where('assignments.1.score', 90)
                ->where('assignments.1.max_score', 100)
                ->where('assignments.1.feedback', 'ایده عالی بود!')
                ->where('stats.graded', 1)
                ->where('stats.pending', 1));
    }

    public function test_empty_state_when_student_has_no_submissions(): void
    {
        $user = User::factory()->create()->assignRole('student');

        $this->actingAs($user)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->has('assignments', 0)
                ->where('assignment_stats.pending', 0)
                ->where('assignment_stats.graded', 0)
                ->where('assignment_stats.average_score', 0));

        $this->actingAs($user)->get('/dashboard/assignments')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard/Assignments')->has('assignments', 0));
    }
}
