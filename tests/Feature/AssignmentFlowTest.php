<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Submission;
use App\Models\User;
use Database\Seeders\ContentSeeder;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AssignmentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        (new RoleAndPermissionSeeder())->run();
    }

    /** @return array{user: User, course: Course, assignment: Assignment, lesson: Lesson} */
    private function makeAssignmentCourse(): array
    {
        $user = User::factory()->create();
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'mod', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'تمرین کشف استعداد', 'slug' => 'assignment-1', 'type' => 'assignment', 'sort_order' => 1]);
        $assignment = Assignment::create(['lesson_id' => $lesson->id, 'course_id' => $course->id, 'title' => 'تمرین کشف استعداد', 'description' => 'سه استعداد خود را بنویسید.', 'max_score' => 100, 'due_days' => 7]);
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'progress_percent' => 0, 'enrolled_at' => now()]);

        return ['user' => $user, 'course' => $course, 'assignment' => $assignment, 'lesson' => $lesson];
    }

    public function test_player_payload_includes_assignment_without_submission(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'assignment' => $assignment] = $this->makeAssignmentCourse();

        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $lesson->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Learning/Player')
                ->has('currentLesson.assignment', fn ($assignmentPayload) => $assignmentPayload
                    ->where('id', $assignment->id)
                    ->where('title', 'تمرین کشف استعداد')
                    ->where('max_score', 100)
                    ->where('due_days', 7)
                    ->where('submission', null)
                    ->etc()));
    }

    public function test_student_can_submit_assignment_and_completes_lesson(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'assignment' => $assignment] = $this->makeAssignmentCourse();

        $this->actingAs($user)->post(route('learning.assignment.submit', ['course' => $course->slug, 'lesson' => $lesson->id]), [
            'content' => 'استعداد من در نوشتن است؛ در انشاهای مدرسه همیشه برتر بودم.',
        ])->assertRedirect();

        $this->assertDatabaseHas('submissions', [
            'assignment_id' => $assignment->id,
            'user_id' => $user->id,
            'status' => 'submitted',
            'score' => null,
        ]);
        $this->assertDatabaseHas('lesson_progress', ['user_id' => $user->id, 'lesson_id' => $lesson->id, 'status' => 'completed', 'progress_percent' => 100]);
        $this->assertDatabaseHas('enrollments', ['user_id' => $user->id, 'course_id' => $course->id, 'progress_percent' => 100, 'status' => 'completed']);
    }

    public function test_student_can_attach_a_file(): void
    {
        Storage::fake('local');
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'assignment' => $assignment] = $this->makeAssignmentCourse();

        $this->actingAs($user)->post(route('learning.assignment.submit', ['course' => $course->slug, 'lesson' => $lesson->id]), [
            'content' => 'پاسخ در فایل پیوست است.',
            'attachment' => UploadedFile::fake()->create('map.pdf', 100, 'application/pdf'),
        ])->assertRedirect();

        $submission = Submission::where('assignment_id', $assignment->id)->where('user_id', $user->id)->firstOrFail();
        $this->assertNotNull($submission->attachment);
        Storage::disk('local')->assertExists($submission->attachment);

        $this->actingAs($user)->get(route('learning.assignment.download', $submission))->assertOk();
        $this->actingAs(User::factory()->create())->get(route('learning.assignment.download', $submission))->assertForbidden();
    }

    public function test_submission_requires_content_or_file(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'assignment' => $assignment] = $this->makeAssignmentCourse();

        $this->actingAs($user)->post(route('learning.assignment.submit', ['course' => $course->slug, 'lesson' => $lesson->id]), [])
            ->assertStatus(422);

        $this->assertDatabaseMissing('submissions', ['assignment_id' => $assignment->id, 'user_id' => $user->id]);
    }

    public function test_assignment_lesson_gates_following_lessons_until_submitted(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->makeAssignmentCourse();
        $module = $lesson->module;
        $next = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'ویدیو بعدی', 'slug' => 'v-next', 'type' => 'video', 'video_url' => 'https://example.com/x.mp4', 'sort_order' => 2]);

        // The video after the assignment lesson is locked until submitted.
        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $next->id]))->assertRedirect();

        $this->actingAs($user)->post(route('learning.assignment.submit', ['course' => $course->slug, 'lesson' => $lesson->id]), ['content' => 'پاسخ تمرین'])->assertRedirect();

        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $next->id]))->assertOk();
    }

    public function test_graded_submission_cannot_be_resubmitted(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'assignment' => $assignment] = $this->makeAssignmentCourse();
        $submission = Submission::create(['assignment_id' => $assignment->id, 'user_id' => $user->id, 'content' => 'پاسخ اول', 'status' => 'graded', 'score' => 90, 'feedback' => 'خوب بود', 'submitted_at' => now()]);

        $this->actingAs($user)->post(route('learning.assignment.submit', ['course' => $course->slug, 'lesson' => $lesson->id]), ['content' => 'پاسخ جدید'])
            ->assertStatus(422);

        $this->assertSame('پاسخ اول', $submission->fresh()->content);
    }

    public function test_grade_appears_in_student_payload(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'assignment' => $assignment] = $this->makeAssignmentCourse();
        $submission = Submission::create(['assignment_id' => $assignment->id, 'user_id' => $user->id, 'content' => 'پاسخ', 'status' => 'submitted', 'submitted_at' => now()]);

        $submission->update(['status' => 'graded', 'score' => 92, 'feedback' => 'ایده عالی بود!']);

        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $lesson->id]))
            ->assertInertia(fn ($page) => $page
                ->where('currentLesson.assignment.submission.status', 'graded')
                ->where('currentLesson.assignment.submission.score', 92)
                ->where('currentLesson.assignment.submission.feedback', 'ایده عالی بود!'));
    }

    public function test_admin_can_create_and_grade_assignment(): void
    {
        $admin = User::factory()->create()->assignRole('super-admin');
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'mod', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'تمرین', 'slug' => 'a', 'type' => 'assignment', 'sort_order' => 1]);

        $this->actingAs($admin)->get('/admin/assignments/create')->assertOk();

        $this->actingAs($admin)->post('/admin/assignments', [
            'title' => 'تمرین مدیریتی',
            'description' => 'توضیح تمرین',
            'lesson_id' => $lesson->id,
            'max_score' => 50,
            'due_days' => 5,
        ])->assertRedirect();

        $assignment = Assignment::where('title', 'تمرین مدیریتی')->first();
        $this->assertNotNull($assignment);
        $this->assertSame($course->id, $assignment->course_id);
        $this->assertSame(50, $assignment->max_score);

        $this->actingAs($admin)->get(route('admin.assignments.edit', $assignment))->assertOk();
        $this->actingAs($admin)->get(route('admin.assignments.submissions', $assignment))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Assignments/Submissions'));

        // Student submits, admin grades.
        $student = User::factory()->create();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'status' => 'active', 'progress_percent' => 0, 'enrolled_at' => now()]);
        $this->actingAs($student)->post(route('learning.assignment.submit', ['course' => $course->slug, 'lesson' => $lesson->id]), ['content' => 'پاسخ هنرجو'])->assertRedirect();

        $submission = Submission::where('assignment_id', $assignment->id)->firstOrFail();
        $this->actingAs($admin)->post(route('admin.assignments.grade', ['assignment' => $assignment, 'submission' => $submission]), [
            'score' => 45,
            'feedback' => 'عالی بود، فقط بخش دوم را کامل کن.',
        ])->assertRedirect();

        $this->assertDatabaseHas('submissions', ['id' => $submission->id, 'status' => 'graded', 'score' => 45, 'feedback' => 'عالی بود، فقط بخش دوم را کامل کن.']);

        // Editors without lesson permissions cannot reach the builder.
        $editor = User::factory()->create()->assignRole('editor');
        $this->actingAs($editor)->get('/admin/assignments/create')->assertForbidden();
    }

    public function test_content_seeder_creates_assignments(): void
    {
        User::factory()->create(['email' => 'dr.beidi@saradar.ir']);
        (new ContentSeeder())->run();

        $this->assertGreaterThanOrEqual(2, Assignment::count());
        foreach (Assignment::with('lesson')->get() as $assignment) {
            $this->assertSame($assignment->lesson->course_id, $assignment->course_id);
            $this->assertSame('assignment', $assignment->lesson->type);
        }
    }
}
