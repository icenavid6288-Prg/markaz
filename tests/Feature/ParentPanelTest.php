<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Certificate;
use App\Models\CoachingGoal;
use App\Models\CoachingSession;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\Student;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParentPanelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        (new RoleAndPermissionSeeder())->run();
    }

    /** @return array{parent: User, student: User, studentProfile: Student} */
    private function makeLinkedPair(): array
    {
        $parent = User::factory()->create()->assignRole('parent');
        $student = User::factory()->create()->assignRole('student');
        $studentProfile = Student::create([
            'user_id' => $student->id,
            'parent_id' => $parent->id,
            'grade' => 'نهم',
            'school' => 'مدرسه نمونه',
            'talents' => ['نوشتن', 'موسیقی'],
        ]);

        return ['parent' => $parent, 'student' => $student, 'studentProfile' => $studentProfile];
    }

    /** @return array{parent: User, student: User, course: Course} */
    private function makeChildWithProgress(): array
    {
        ['parent' => $parent, 'student' => $student] = $this->makeLinkedPair();
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'mod', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'درس', 'slug' => 'l1', 'type' => 'video', 'video_url' => 'https://example.com/v.mp4', 'sort_order' => 1]);
        $course->update(['is_in_person' => true, 'location' => 'مرکز رشد', 'schedule' => ['شنبه ۱۰ تا ۱۲']]);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'progress_percent' => 50, 'enrolled_at' => now()]);
        LessonProgress::create(['user_id' => $student->id, 'lesson_id' => $lesson->id, 'status' => 'completed', 'progress_percent' => 100, 'completed_at' => now()]);

        $assignment = Assignment::create(['lesson_id' => $lesson->id, 'course_id' => $course->id, 'title' => 'تمرین', 'max_score' => 100]);
        Submission::create(['assignment_id' => $assignment->id, 'user_id' => $student->id, 'content' => 'پاسخ', 'status' => 'submitted', 'submitted_at' => now()]);

        $quiz = Quiz::create(['lesson_id' => $lesson->id, 'course_id' => $course->id, 'title' => 'آزمون', 'passing_score' => 70]);
        QuizAttempt::create(['user_id' => $student->id, 'quiz_id' => $quiz->id, 'score' => 90, 'answers' => [], 'passed' => true, 'started_at' => now(), 'submitted_at' => now()]);

        $coach = User::factory()->create(['name' => 'آقای کوچ']);
        CoachingSession::create(['coach_id' => $coach->id, 'student_id' => $student->id, 'scheduled_at' => now()->addDays(2), 'duration_minutes' => 45, 'status' => 'confirmed']);
        CoachingGoal::create(['student_id' => $student->id, 'title' => 'بهبود برنامه مطالعه', 'status' => 'in_progress']);

        $certificate = Certificate::create(['user_id' => $student->id, 'course_id' => $course->id, 'certificate_number' => 'SAR-2026-PARENT1', 'issued_at' => now()]);
        $course->update(['certificate_enabled' => true]);

        return ['parent' => $parent, 'student' => $student, 'course' => $course, 'certificate' => $certificate];
    }

    public function test_parent_sees_children_overview(): void
    {
        ['parent' => $parent, 'student' => $student] = $this->makeChildWithProgress();

        $this->actingAs($parent)->get('/panel/parent')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Parent/Dashboard')
                ->has('children', 1)
                ->where('children.0.name', $student->name)
                ->where('children.0.grade', 'نهم')
                ->where('children.0.stats.courses', 1)
                ->where('children.0.stats.pending_assignments', 1)
                ->where('children.0.stats.certificates', 1)
                ->where('stats.children_count', 1));
    }

    public function test_parent_sees_full_child_report(): void
    {
        ['parent' => $parent, 'student' => $student, 'course' => $course] = $this->makeChildWithProgress();
        $studentProfile = Student::where('user_id', $student->id)->firstOrFail();

        $this->actingAs($parent)->get(route('panel.parent.children.show', $studentProfile))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Parent/ChildReport')
                ->where('child.name', $student->name)
                ->where('child.school', 'مدرسه نمونه')
                ->has('child.courses', 1)
                ->where('child.courses.0.progress_percent', 50)
                ->where('child.courses.0.certificate.number', 'SAR-2026-PARENT1')
                ->has('child.assignments', 1)
                ->where('child.assignments.0.status', 'submitted')
                ->has('child.quizzes', 1)
                ->where('child.quizzes.0.passed', true)
                ->where('child.quizzes.0.score', 90)
                ->has('child.sessions', 1)
                ->has('child.goals', 1)
                ->has('child.certificates', 1)
                ->where('child.stats.pending_assignments', 1)
                ->has('child.activity', 3)
                ->where('child.activity.0.type', 'lesson')
                ->has('child.in_person_courses', 1)
                ->where('child.in_person_courses.0.location', 'مرکز رشد'));
    }

    public function test_parent_cannot_view_another_parents_child(): void
    {
        ['student' => $student] = $this->makeChildWithProgress();
        $studentProfile = Student::where('user_id', $student->id)->firstOrFail();
        $otherParent = User::factory()->create()->assignRole('parent');

        $this->actingAs($otherParent)->get(route('panel.parent.children.show', $studentProfile))->assertForbidden();
    }

    public function test_non_parent_cannot_access_parent_panel(): void
    {
        $student = User::factory()->create()->assignRole('student');
        $coach = User::factory()->create()->assignRole('coach');

        $this->actingAs($student)->get('/panel/parent')->assertForbidden();
        $this->actingAs($coach)->get('/panel/parent')->assertForbidden();
    }

    public function test_dashboard_redirects_parent_to_parent_panel(): void
    {
        ['parent' => $parent] = $this->makeLinkedPair();

        $this->actingAs($parent)->get('/dashboard')->assertRedirect(route('panel.parent.dashboard'));
    }

    public function test_admin_can_link_child_to_parent(): void
    {
        $admin = User::factory()->create()->assignRole('super-admin');
        $parent = User::factory()->create()->assignRole('parent');
        $student = User::factory()->create()->assignRole('student');

        $this->actingAs($admin)->post('/admin/content/students', [
            'user_id' => $student->id,
            'parent_id' => $parent->id,
            'grade' => 'دهم',
            'school' => 'دبیرستان علامه',
            'talents' => "نوشتن\nموسیقی",
        ])->assertRedirect();

        $this->assertDatabaseHas('students', ['user_id' => $student->id, 'parent_id' => $parent->id, 'grade' => 'دهم']);
        $linked = Student::where('user_id', $student->id)->firstOrFail();
        $this->assertSame(['نوشتن', 'موسیقی'], $linked->talents);
    }
}
