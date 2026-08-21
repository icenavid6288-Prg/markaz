<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CertificateFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        (new RoleAndPermissionSeeder())->run();
    }

    /** @return array{user: User, course: Course, lesson: Lesson} */
    private function courseWithOneLesson(string $type = 'video'): array
    {
        $user = User::factory()->create();
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'mod', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'درس', 'slug' => 'lesson-1', 'type' => $type, 'sort_order' => 1]);
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'progress_percent' => 0, 'enrolled_at' => now()]);

        return ['user' => $user, 'course' => $course, 'lesson' => $lesson];
    }

    public function test_certificate_issued_when_video_completes_course(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->courseWithOneLesson();

        $this->actingAs($user)->post(route('learning.progress', ['course' => $course->slug, 'lesson' => $lesson->id]), ['progress_percent' => 100, 'status' => 'completed'])->assertRedirect();

        $certificate = Certificate::where('user_id', $user->id)->where('course_id', $course->id)->first();
        $this->assertNotNull($certificate);
        $this->assertMatchesRegularExpression('/^SAR-\d{4}-[A-Z0-9]{6}$/', $certificate->certificate_number);
        $this->assertNotNull($certificate->issued_at);
    }

    public function test_certificate_issued_when_quiz_pass_completes_course(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->courseWithOneLesson('quiz');
        $quiz = Quiz::create(['lesson_id' => $lesson->id, 'course_id' => $course->id, 'title' => 'آزمون', 'passing_score' => 70]);
        Question::create(['quiz_id' => $quiz->id, 'type' => 'single', 'question' => 'سؤال؟', 'options' => ['الف', 'ب'], 'correct_answer' => ['0'], 'score' => 1, 'sort_order' => 0]);
        $attempt = QuizAttempt::create(['user_id' => $user->id, 'quiz_id' => $quiz->id, 'score' => 0, 'answers' => [], 'passed' => false, 'started_at' => now()]);

        $this->actingAs($user)->post(route('learning.quiz.submit', ['course' => $course->slug, 'lesson' => $lesson->id, 'attempt' => $attempt->id]), ['answers' => [$quiz->questions()->first()->id => ['0']]])->assertRedirect();

        $this->assertNotNull(Certificate::where('user_id', $user->id)->where('course_id', $course->id)->first());
    }

    public function test_certificate_issued_when_assignment_submit_completes_course(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->courseWithOneLesson('assignment');
        Assignment::create(['lesson_id' => $lesson->id, 'course_id' => $course->id, 'title' => 'تکلیف', 'max_score' => 100]);

        $this->actingAs($user)->post(route('learning.assignment.submit', ['course' => $course->slug, 'lesson' => $lesson->id]), ['content' => 'پاسخ'])->assertRedirect();

        $this->assertNotNull(Certificate::where('user_id', $user->id)->where('course_id', $course->id)->first());
    }

    public function test_no_certificate_when_course_disables_it(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->courseWithOneLesson();
        $course->update(['certificate_enabled' => false]);

        $this->actingAs($user)->post(route('learning.progress', ['course' => $course->slug, 'lesson' => $lesson->id]), ['progress_percent' => 100, 'status' => 'completed'])->assertRedirect();

        $this->assertDatabaseMissing('certificates', ['user_id' => $user->id, 'course_id' => $course->id]);
    }

    public function test_no_duplicate_certificates_on_repeated_completion(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->courseWithOneLesson();

        $this->actingAs($user)->post(route('learning.progress', ['course' => $course->slug, 'lesson' => $lesson->id]), ['progress_percent' => 100, 'status' => 'completed'])->assertRedirect();
        // Re-marking the same lesson after completion must not create a duplicate.
        $this->actingAs($user)->post(route('learning.progress', ['course' => $course->slug, 'lesson' => $lesson->id]), ['progress_percent' => 100, 'status' => 'completed'])->assertRedirect();

        $this->assertSame(1, Certificate::where('user_id', $user->id)->where('course_id', $course->id)->count());
    }

    public function test_player_payload_includes_certificate_when_completed(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->courseWithOneLesson();
        $this->actingAs($user)->post(route('learning.progress', ['course' => $course->slug, 'lesson' => $lesson->id]), ['progress_percent' => 100, 'status' => 'completed'])->assertRedirect();

        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $lesson->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Learning/Player')
                ->has('enrollment.certificate', fn ($certificate) => $certificate->where('number', Certificate::first()->certificate_number)->has('url')));
    }

    public function test_student_can_list_and_view_own_certificate(): void
    {
        ['user' => $user, 'course' => $course] = $this->courseWithOneLesson();
        $certificate = Certificate::create(['user_id' => $user->id, 'course_id' => $course->id, 'certificate_number' => 'SAR-2026-TEST01', 'issued_at' => now()]);

        $this->actingAs($user)->get(route('dashboard.certificates'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard/Certificates')->has('certificates', 1));

        $this->actingAs($user)->get(route('certificates.show', $certificate))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/CertificateShow')
                ->where('certificate.certificate_number', 'SAR-2026-TEST01')
                ->where('certificate.user.name', $user->name)
                ->where('certificate.course.title', $course->title));

        // Another student cannot view someone else's certificate.
        $other = User::factory()->create();
        $this->actingAs($other)->get(route('certificates.show', $certificate))->assertForbidden();
    }

    public function test_pdf_is_generated_and_stored_on_issuance(): void
    {
        Storage::fake('public');
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->courseWithOneLesson();

        $this->actingAs($user)->post(route('learning.progress', ['course' => $course->slug, 'lesson' => $lesson->id]), ['progress_percent' => 100, 'status' => 'completed'])->assertRedirect();

        $certificate = Certificate::where('user_id', $user->id)->where('course_id', $course->id)->firstOrFail();
        $this->assertNotNull($certificate->file_path);
        $this->assertStringEndsWith('.pdf', $certificate->file_path);
        Storage::disk('public')->assertExists($certificate->file_path);
    }

    public function test_download_returns_the_pdf_file(): void
    {
        Storage::fake('public');
        ['user' => $user, 'course' => $course] = $this->courseWithOneLesson();
        $certificate = Certificate::create(['user_id' => $user->id, 'course_id' => $course->id, 'certificate_number' => 'SAR-2026-DWNLD1', 'issued_at' => now()]);

        $this->actingAs($user)->get(route('certificates.download', $certificate))
            ->assertOk()
            ->assertDownload('Certificate-SAR-2026-DWNLD1.pdf')
            ->assertHeader('content-type', 'application/pdf');

        $this->assertNotNull($certificate->fresh()->file_path);
        Storage::disk('public')->assertExists($certificate->fresh()->file_path);

        // Others cannot download someone else's certificate.
        $other = User::factory()->create();
        $this->actingAs($other)->get(route('certificates.download', $certificate))->assertForbidden();
    }

    public function test_public_verification_by_number(): void
    {
        ['user' => $user, 'course' => $course] = $this->courseWithOneLesson();
        Certificate::create(['user_id' => $user->id, 'course_id' => $course->id, 'certificate_number' => 'SAR-2026-ABCDEF', 'issued_at' => now()]);

        $this->get(route('certificates.verify', 'SAR-2026-ABCDEF'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Verify')
                ->where('certificate.certificate_number', 'SAR-2026-ABCDEF')
                ->where('certificate.user.name', $user->name)
                ->where('certificate.course.title', $course->title));

        $this->get('/verify/SAR-2026-UNKNOWN')->assertNotFound();
    }

    public function test_admin_can_list_certificates_and_others_cannot(): void
    {
        ['user' => $user, 'course' => $course] = $this->courseWithOneLesson();
        Certificate::create(['user_id' => $user->id, 'course_id' => $course->id, 'certificate_number' => 'SAR-2026-ADMIN01', 'issued_at' => now()]);

        $admin = User::factory()->create()->assignRole('super-admin');
        $this->actingAs($admin)->get('/admin/certificates')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Certificates/Index')->has('certificates.data', 1));

        // Editors have no certificate permissions.
        $editor = User::factory()->create()->assignRole('editor');
        $this->actingAs($editor)->get('/admin/certificates')->assertForbidden();
    }
}
