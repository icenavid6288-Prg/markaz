<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Database\Seeders\ContentSeeder;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        (new RoleAndPermissionSeeder())->run();
    }

    /** @return array{user: User, course: Course, quiz: Quiz, lesson: Lesson} */
    private function makeQuizCourse(): array
    {
        $user = User::factory()->create();
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'mod', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'آزمون', 'slug' => 'quiz-1', 'type' => 'quiz', 'sort_order' => 1]);
        $quiz = Quiz::create(['lesson_id' => $lesson->id, 'course_id' => $course->id, 'title' => 'آزمون خودشناسی', 'passing_score' => 70]);
        Question::create(['quiz_id' => $quiz->id, 'type' => 'single', 'question' => 'سؤال اول؟', 'options' => ['گزینه الف', 'گزینه ب', 'گزینه ج'], 'correct_answer' => ['1'], 'score' => 1, 'sort_order' => 0]);
        Question::create(['quiz_id' => $quiz->id, 'type' => 'true_false', 'question' => 'عبارت درست است؟', 'options' => ['درست', 'نادرست'], 'correct_answer' => ['0'], 'score' => 1, 'sort_order' => 1]);
        Question::create(['quiz_id' => $quiz->id, 'type' => 'multiple', 'question' => 'کدام‌ها؟', 'options' => ['اول', 'دوم', 'سوم'], 'correct_answer' => ['0', '2'], 'score' => 1, 'sort_order' => 2]);
        Enrollment::create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active', 'progress_percent' => 0, 'enrolled_at' => now()]);

        return ['user' => $user, 'course' => $course, 'quiz' => $quiz, 'lesson' => $lesson];
    }

    public function test_player_payload_includes_quiz_questions_without_answers(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->makeQuizCourse();

        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $lesson->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Learning/Player')
                ->has('currentLesson.quiz', fn ($quiz) => $quiz
                    ->where('id', $lesson->quiz->id)
                    ->where('passing_score', 70)
                    ->where('questions_count', 3)
                    ->where('in_progress', false)
                    ->has('questions', 3)
                    ->where('questions.0.question', 'سؤال اول؟')
                    ->missing('questions.0.correct_answer')
                    ->etc()));
    }

    public function test_start_opens_an_attempt(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson] = $this->makeQuizCourse();

        $this->actingAs($user)->post(route('learning.quiz.start', ['course' => $course->slug, 'lesson' => $lesson->id]))
            ->assertRedirect();

        $this->assertDatabaseHas('quiz_attempts', [
            'user_id' => $user->id,
            'quiz_id' => $lesson->quiz->id,
            'submitted_at' => null,
            'passed' => false,
        ]);
    }

    public function test_submit_grades_all_question_types_and_passes_lesson(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'quiz' => $quiz] = $this->makeQuizCourse();
        $attempt = QuizAttempt::create(['user_id' => $user->id, 'quiz_id' => $quiz->id, 'score' => 0, 'answers' => [], 'passed' => false, 'started_at' => now()]);

        $answers = [
            $quiz->questions[0]->id => ['1'],
            $quiz->questions[1]->id => ['0'],
            $quiz->questions[2]->id => ['0', '2'],
        ];

        $this->actingAs($user)->post(route('learning.quiz.submit', ['course' => $course->slug, 'lesson' => $lesson->id, 'attempt' => $attempt->id]), ['answers' => $answers])
            ->assertRedirect();

        $this->assertDatabaseHas('quiz_attempts', ['id' => $attempt->id, 'score' => 100, 'passed' => true]);
        $this->assertNotNull($attempt->fresh()->submitted_at);
        $this->assertDatabaseHas('lesson_progress', ['user_id' => $user->id, 'lesson_id' => $lesson->id, 'status' => 'completed', 'progress_percent' => 100]);
        $this->assertDatabaseHas('enrollments', ['user_id' => $user->id, 'course_id' => $course->id, 'progress_percent' => 100, 'status' => 'completed']);
    }

    public function test_failing_attempt_does_not_complete_lesson(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'quiz' => $quiz] = $this->makeQuizCourse();
        $attempt = QuizAttempt::create(['user_id' => $user->id, 'quiz_id' => $quiz->id, 'score' => 0, 'answers' => [], 'passed' => false, 'started_at' => now()]);

        $answers = [
            $quiz->questions[0]->id => ['0'],
            $quiz->questions[1]->id => ['1'],
            $quiz->questions[2]->id => ['1'],
        ];

        $this->actingAs($user)->post(route('learning.quiz.submit', ['course' => $course->slug, 'lesson' => $lesson->id, 'attempt' => $attempt->id]), ['answers' => $answers])
            ->assertRedirect();

        $this->assertDatabaseHas('quiz_attempts', ['id' => $attempt->id, 'score' => 0, 'passed' => false]);
        $this->assertDatabaseMissing('lesson_progress', ['user_id' => $user->id, 'lesson_id' => $lesson->id]);
    }

    public function test_quiz_lesson_gates_following_lessons_until_passed(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'quiz' => $quiz] = $this->makeQuizCourse();
        $module = $lesson->module;
        $next = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'ویدیو بعدی', 'slug' => 'v-next', 'type' => 'video', 'video_url' => 'https://example.com/x.mp4', 'sort_order' => 2]);

        // The video after the quiz is locked until the quiz is passed.
        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $next->id]))->assertRedirect();

        $attempt = QuizAttempt::create(['user_id' => $user->id, 'quiz_id' => $quiz->id, 'score' => 0, 'answers' => [], 'passed' => false, 'started_at' => now()]);
        $answers = [
            $quiz->questions[0]->id => ['1'],
            $quiz->questions[1]->id => ['0'],
            $quiz->questions[2]->id => ['0', '2'],
        ];
        $this->actingAs($user)->post(route('learning.quiz.submit', ['course' => $course->slug, 'lesson' => $lesson->id, 'attempt' => $attempt->id]), ['answers' => $answers])->assertRedirect();

        $this->actingAs($user)->get(route('learning.player', ['course' => $course->slug, 'lesson' => $next->id]))->assertOk();
    }

    public function test_retake_creates_a_fresh_attempt_and_can_pass_after_failure(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'quiz' => $quiz] = $this->makeQuizCourse();

        $first = QuizAttempt::create(['user_id' => $user->id, 'quiz_id' => $quiz->id, 'score' => 0, 'answers' => [], 'passed' => false, 'started_at' => now()]);
        $this->actingAs($user)->post(route('learning.quiz.submit', ['course' => $course->slug, 'lesson' => $lesson->id, 'attempt' => $first->id]), ['answers' => [$quiz->questions[0]->id => ['0']]])->assertRedirect();

        $this->actingAs($user)->post(route('learning.quiz.start', ['course' => $course->slug, 'lesson' => $lesson->id]))->assertRedirect();
        $second = QuizAttempt::where('user_id', $user->id)->latest('id')->first();
        $this->assertNotSame($first->id, $second->id);
        $this->assertNull($second->submitted_at);

        $this->actingAs($user)->post(route('learning.quiz.submit', ['course' => $course->slug, 'lesson' => $lesson->id, 'attempt' => $second->id]), ['answers' => [
            $quiz->questions[0]->id => ['1'],
            $quiz->questions[1]->id => ['0'],
            $quiz->questions[2]->id => ['0', '2'],
        ]])->assertRedirect();

        $this->assertDatabaseHas('quiz_attempts', ['id' => $second->id, 'passed' => true]);
        $this->assertDatabaseHas('lesson_progress', ['user_id' => $user->id, 'lesson_id' => $lesson->id, 'status' => 'completed']);
    }

    public function test_attempts_are_isolated_between_users_and_quizzes(): void
    {
        ['user' => $user, 'course' => $course, 'lesson' => $lesson, 'quiz' => $quiz] = $this->makeQuizCourse();
        $attempt = QuizAttempt::create(['user_id' => $user->id, 'quiz_id' => $quiz->id, 'score' => 0, 'answers' => [], 'passed' => false, 'started_at' => now()]);

        $other = User::factory()->create();
        Enrollment::create(['user_id' => $other->id, 'course_id' => $course->id, 'status' => 'active', 'progress_percent' => 0, 'enrolled_at' => now()]);

        // A different user cannot submit someone else's attempt.
        $this->actingAs($other)->post(route('learning.quiz.submit', ['course' => $course->slug, 'lesson' => $lesson->id, 'attempt' => $attempt->id]), ['answers' => []])->assertForbidden();
        $this->assertDatabaseHas('quiz_attempts', ['id' => $attempt->id, 'submitted_at' => null]);
    }

    public function test_content_seeder_creates_quizzes_with_questions(): void
    {
        User::factory()->create(['email' => 'dr.beidi@saradar.ir']);
        (new ContentSeeder())->run();

        $this->assertGreaterThanOrEqual(2, Quiz::count());
        foreach (Quiz::with('lesson')->get() as $quiz) {
            $this->assertSame($quiz->lesson->course_id, $quiz->course_id);
            $this->assertTrue($quiz->questions()->count() >= 3);
            // True/false questions always carry the two standard options.
            foreach ($quiz->questions()->where('type', 'true_false')->get() as $question) {
                $this->assertSame(['درست', 'نادرست'], $question->options);
            }
        }
    }

    public function test_admin_can_build_a_quiz_with_questions(): void
    {
        $admin = User::factory()->create()->assignRole('super-admin');
        $course = Course::factory()->create();
        $module = CourseModule::create(['course_id' => $course->id, 'title' => 'ماژول', 'slug' => 'mod', 'sort_order' => 1]);
        $lesson = Lesson::create(['course_id' => $course->id, 'module_id' => $module->id, 'title' => 'آزمون', 'slug' => 'q', 'type' => 'quiz', 'sort_order' => 1]);

        $this->actingAs($admin)->get('/admin/quizzes/create')->assertOk();

        $this->actingAs($admin)->post('/admin/quizzes', [
            'title' => 'آزمون مدیریتی',
            'description' => 'توضیح',
            'lesson_id' => $lesson->id,
            'passing_score' => 80,
            'time_limit_minutes' => 10,
            'questions' => [
                ['type' => 'single', 'question' => 'یک گزینه؟', 'options' => ['الف', 'ب'], 'correct_answer' => ['0'], 'score' => 2],
                ['type' => 'true_false', 'question' => 'درست است؟', 'options' => ['درست', 'نادرست'], 'correct_answer' => ['1'], 'score' => 1],
            ],
        ])->assertRedirect();

        $quiz = Quiz::where('title', 'آزمون مدیریتی')->first();
        $this->assertNotNull($quiz);
        $this->assertSame(80, $quiz->passing_score);
        $this->assertSame($course->id, $quiz->course_id);
        $this->assertSame(2, $quiz->questions()->count());
        $this->assertSame(['درست', 'نادرست'], $quiz->questions()->where('type', 'true_false')->first()->options);

        $this->actingAs($admin)->get(route('admin.quizzes.edit', $quiz))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Quizzes/Form')->has('quiz.questions', 2));

        // Editors without lesson permissions cannot reach the builder.
        $editor = User::factory()->create()->assignRole('editor');
        $this->actingAs($editor)->get('/admin/quizzes/create')->assertForbidden();
    }
}
