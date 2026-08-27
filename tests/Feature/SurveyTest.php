<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\Eitaa\ArabicShaper;
use App\Services\Eitaa\EitaaCardGenerator;
use App\Services\Eitaa\EitaaPublisher;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class SurveyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_registration_required_before_survey_starts_when_registration_after_is_zero(): void
    {
        $survey = $this->makeSurvey(['status' => 'published', 'settings' => ['registration_after' => 0]]);

        // First visit — should redirect to register page.
        $this->get('/survey/'.$survey->share_token)
            ->assertRedirect('/survey/'.$survey->share_token.'/register');

        // Register page should render correctly.
        $this->get('/survey/'.$survey->share_token.'/register')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Survey/Register')
                ->where('registerBeforeStart', true)
                ->where('answeredCount', 0)
                ->where('remainingCount', 4));

        // After registration, survey should be accessible.
        $this->registerOnSurvey($survey, [
            'name' => 'کاربر تست',
            'phone' => '09120000002',
        ]);

        $this->assertAuthenticated();

        // Now the user should see all questions.
        $this->get('/survey/'.$survey->share_token)
            ->assertInertia(fn ($page) => $page
                ->has('questions', 4)
                ->where('questions.0.title', 'نقش شما چیست؟')
                ->where('registered', true)
                ->where('completed', false));
    }

    public function test_private_survey_shows_visible_questions_before_registration(): void
    {
        $survey = $this->makeSurvey(['status' => 'published', 'settings' => ['registration_after' => 2]]);

        $this->get('/survey/'.$survey->share_token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Survey/Show')
                ->has('questions', 2)
                ->where('registrationRequired', true)
                ->where('totalQuestions', 4)
                ->where('completed', false));
    }

    public function test_submitting_partial_answers_then_refresh_shows_all_questions(): void
    {
        // Use registration_after = 999 so registration is never required.
        $survey = $this->makeSurvey(['status' => 'published', 'settings' => ['registration_after' => 999]]);
        $questions = $survey->questions()->get();

        // First visit — all 4 questions visible.
        $this->get('/survey/'.$survey->share_token)
            ->assertInertia(fn ($page) => $page->has('questions', 4));

        // Submit all answers at once — survey completes.
        $this->post('/survey/'.$survey->share_token.'/answer', [
            'answers' => [
                (string) $questions[0]->id => 'والد',
                (string) $questions[1]->id => 'بله',
                (string) $questions[2]->id => 'توضیح',
                (string) $questions[3]->id => '5',
            ],
        ])->assertRedirect();

        $this->get('/survey/'.$survey->share_token)
            ->assertInertia(fn ($page) => $page->where('completed', true));
    }

    public function test_numeric_zero_answer_is_not_treated_as_unanswered(): void
    {
        $survey = $this->makeSurvey(['status' => 'published', 'settings' => ['registration_after' => 999]]);
        $questions = $survey->questions()->get();

        // Make Q1 optional and numeric.
        $questions[0]->update(['type' => 'number', 'options' => [], 'is_required' => false]);

        // Submit Q1 with 0 — should complete since registration_after=999.
        $this->get('/survey/'.$survey->share_token);
        $this->post('/survey/'.$survey->share_token.'/answer', [
            'answers' => [
                (string) $questions[0]->id => '0',
                (string) $questions[1]->id => 'بله',
                (string) $questions[2]->id => 'توضیح',
                (string) $questions[3]->id => '3',
            ],
        ])->assertRedirect();

        $response = SurveyResponse::firstOrFail();
        // The 0 value should be preserved, not treated as empty.
        $this->assertSame('0', $response->answers[(string) $questions[0]->id]);
        $this->assertSame('completed', $response->status);
    }

    public function test_optional_question_with_empty_answer_completes_without_error(): void
    {
        $survey = $this->makeSurvey(['status' => 'published', 'settings' => ['registration_after' => 999]]);
        $questions = $survey->questions()->get();

        // Make Q1 optional.
        $questions[0]->update(['is_required' => false]);

        // Submit all answers with Q1 empty — should complete successfully.
        $this->get('/survey/'.$survey->share_token);
        $this->post('/survey/'.$survey->share_token.'/answer', [
            'answers' => [
                (string) $questions[0]->id => '',
                (string) $questions[1]->id => 'بله',
                (string) $questions[2]->id => 'توضیح',
                (string) $questions[3]->id => '4',
            ],
        ])->assertRedirect();

        $response = SurveyResponse::firstOrFail();
        $this->assertSame('completed', $response->status);
        // Empty optional answer is stored as null (ConvertEmptyStringsToNull middleware).
        $this->assertNull($response->answers[(string) $questions[0]->id]);
    }

    public function test_legacy_single_answer_payload_is_persisted_and_shown_in_results(): void
    {
        $survey = $this->makeSurvey([
            'status' => 'published',
            'persline_type' => 'ads',
            'settings' => ['registration_after' => 999],
        ]);
        $question = $survey->questions()->first();
        $this->get('/survey/'.$survey->share_token);

        $this->post('/survey/'.$survey->share_token.'/answer', [
            'question_id' => $question->id,
            'answer' => 'والد',
        ])->assertRedirect();

        $response = SurveyResponse::firstOrFail();
        $this->assertSame('والد', $response->answers[(string) $question->id]);
        $this->assertSame('والد', app(\App\Support\SurveyResults::class)->presentResponse($response, $survey->questions)['answers'][0]['value']);
    }

    public function test_answers_survive_registration_and_user_can_complete_survey(): void
    {
        $survey = $this->makeSurvey(['status' => 'published', 'settings' => ['registration_after' => 2]]);
        $questions = $survey->questions()->get();

        $this->get('/survey/'.$survey->share_token);

        // Submit first 2 visible questions — should redirect to registration.
        $this->post('/survey/'.$survey->share_token.'/answer', [
            'answers' => [
                (string) $questions[0]->id => 'والد',
                (string) $questions[1]->id => 'بله',
            ],
        ])->assertRedirect('/survey/'.$survey->share_token.'/register');

        $response = SurveyResponse::firstOrFail();
        $this->assertSame([(string) $questions[0]->id => 'والد', (string) $questions[1]->id => 'بله'], $response->answers);
        $this->assertSame('in_progress', $response->status);

        $this->registerOnSurvey($survey, [
            'name' => 'کاربر نظرسنجی',
            'phone' => '09120000001',
        ]);

        $this->assertAuthenticated();
        $this->get('/survey/'.$survey->share_token)
            ->assertInertia(fn ($page) => $page
                ->has('questions', 4)
                ->where('registered', true)
                ->where('completed', false));

        // Submit remaining questions — completes the survey.
        $this->post('/survey/'.$survey->share_token.'/answer', [
            'answers' => [
                (string) $questions[0]->id => 'والد',
                (string) $questions[1]->id => 'بله',
                (string) $questions[2]->id => 'توضیح',
                (string) $questions[3]->id => '5',
            ],
        ])->assertRedirect('/survey/'.$survey->share_token);

        $this->assertDatabaseHas('survey_responses', [
            'survey_id' => $survey->id,
            'status' => 'completed',
            'answered_count' => 4,
        ]);
    }

    public function test_survey_registration_uses_otp_without_password(): void
    {
        $survey = $this->makeSurvey(['status' => 'published', 'settings' => ['registration_after' => 0]]);

        $this->post('/survey/'.$survey->share_token.'/register', [
            'name' => 'کاربر پیامکی',
            'phone' => '09120000003',
        ])->assertRedirect('/survey/'.$survey->share_token.'/register?step=code');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['phone' => '09120000003']);

        $code = session('survey_register_dev_code');
        $this->assertNotNull($code);

        $this->post('/survey/'.$survey->share_token.'/register/verify', [
            'phone' => '09120000003',
            'code' => $code,
        ])->assertRedirect('/survey/'.$survey->share_token);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['phone' => '09120000003', 'name' => 'کاربر پیامکی']);
    }

    public function test_existing_user_can_continue_survey_with_otp_login(): void
    {
        $user = User::factory()->create(['name' => 'عضو قبلی', 'phone' => '09120000004']);
        $survey = $this->makeSurvey(['status' => 'published', 'settings' => ['registration_after' => 0]]);

        $this->post('/survey/'.$survey->share_token.'/register', [
            'phone' => '09120000004',
        ])->assertRedirect('/survey/'.$survey->share_token.'/register?step=code');

        $code = session('survey_register_dev_code');
        $this->assertNotNull($code);

        $this->post('/survey/'.$survey->share_token.'/register/verify', [
            'phone' => '09120000004',
            'code' => $code,
        ])->assertRedirect('/survey/'.$survey->share_token);

        $this->assertAuthenticatedAs($user);
        $this->assertSame(1, User::query()->where('phone', '09120000004')->count());
        $this->assertDatabaseHas('survey_responses', [
            'survey_id' => $survey->id,
            'user_id' => $user->id,
            'status' => 'registered',
        ]);
    }

    public function test_guest_cannot_submit_answers_before_otp_when_registration_is_first(): void
    {
        $survey = $this->makeSurvey(['status' => 'published', 'settings' => ['registration_after' => 0]]);
        $questions = $survey->questions()->get();

        $this->post('/survey/'.$survey->share_token.'/answer', [
            'answers' => [(string) $questions[0]->id => 'والد'],
        ])->assertRedirect('/survey/'.$survey->share_token.'/register');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['phone' => '09120000003']);
        $this->assertSame('in_progress', SurveyResponse::first()?->status);
    }

    public function test_persline_always_shows_one_question_per_page(): void
    {
        $survey = $this->makeSurvey([
            'status' => 'published',
            'persline_type' => 'ads',
            'settings' => ['registration_after' => 999, 'display_mode' => 'all'],
        ]);

        $this->get('/survey/'.$survey->share_token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Survey/Show')
                ->has('questions', 1)
                ->where('survey.display_mode', 'paged')
                ->where('currentIndex', 0)
                ->where('visibleTotal', 4));
    }

    public function test_zero_registration_after_is_preserved_as_registration_before_questions(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->post('/admin/persline', [
            'persline_type' => 'ads',
            'title' => 'فرم ثبت‌نام ابتدایی',
            'status' => 'published',
            'settings' => ['registration_after' => 0],
            'questions' => [
                ['type' => 'text', 'title' => 'سؤال اول', 'options' => [], 'is_required' => true],
            ],
        ])->assertRedirect();

        $survey = Survey::where('title', 'فرم ثبت‌نام ابتدایی')->firstOrFail();
        $this->assertSame(0, $survey->registrationAfter());
        $this->get('/survey/'.$survey->share_token)
            ->assertRedirect('/survey/'.$survey->share_token.'/register');
    }


    public function test_paged_mode_shows_one_question_and_blocks_skipping(): void
    {
        $survey = $this->makeSurvey([
            'status' => 'published',
            'settings' => ['registration_after' => 999, 'display_mode' => 'paged', 'allow_back_navigation' => true],
        ]);
        $questions = $survey->questions()->get();

        $this->get('/survey/'.$survey->share_token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Survey/Show')
                ->has('questions', 1)
                ->where('questions.0.title', 'نقش شما چیست؟')
                ->where('survey.display_mode', 'paged')
                ->where('currentIndex', 0)
                ->where('visibleTotal', 4));

        $this->post('/survey/'.$survey->share_token.'/answer', [
            'question_id' => $questions[2]->id,
            'answers' => [(string) $questions[2]->id => 'توضیح'],
        ])->assertSessionHasErrors('answers.'.$questions[2]->id);

        $this->post('/survey/'.$survey->share_token.'/answer', [
            'question_id' => $questions[0]->id,
            'answers' => [(string) $questions[0]->id => 'والد'],
        ])->assertRedirect('/survey/'.$survey->share_token.'?q=1');

        $this->get('/survey/'.$survey->share_token)
            ->assertInertia(fn ($page) => $page
                ->has('questions', 1)
                ->where('questions.0.title', 'آیا ادامه می‌دهید؟')
                ->where('currentIndex', 1)
                ->where('completed', false));
    }

    public function test_draft_survey_is_not_publicly_discoverable(): void
    {
        $survey = $this->makeSurvey(['status' => 'draft']);

        $this->get('/survey/'.$survey->share_token)->assertNotFound();
    }

    public function test_admin_can_open_survey_results_page(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $user = User::factory()->create(['name' => 'نرگس احمدی', 'phone' => '09125556677']);
        $survey = $this->makeSurvey(['status' => 'published']);
        $questions = $survey->questions()->get();
        $survey->responses()->create([
            'user_id' => $user->id,
            'session_token' => Str::random(32),
            'status' => 'completed',
            'answers' => [(string) $questions[0]->id => 'والد'],
            'answered_count' => 1,
            'completed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get('/admin/surveys/'.$survey->share_token.'/responses')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Surveys/Responses')
                ->where('kind', 'survey')
                ->where('responses.data.0.user.name', 'نرگس احمدی')
                ->where('responses.data.0.answers.0.value', 'والد'));
    }

    public function test_admin_can_create_and_edit_private_survey(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->post('/admin/surveys', [
            'title' => 'نظرسنجی والدین',
            'status' => 'published',
            'settings' => ['registration_after' => 1],
            'questions' => [
                ['type' => 'single', 'title' => 'نقش شما چیست؟', 'options' => ['والد', 'نوجوان'], 'is_required' => true],
            ],
        ])->assertRedirect();

        $survey = Survey::firstOrFail();
        $this->assertSame(1, $survey->questions()->count());
        $this->assertSame(1, $survey->registrationAfter());

        $this->actingAs($admin)->get('/admin/surveys/'.$survey->share_token.'/edit')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Surveys/Form')->has('survey.questions', 1));
    }

    public function test_publish_to_eitaa_requires_configured_bot(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $survey = $this->makeSurvey(['status' => 'published']);

        $this->actingAs($admin)
            ->post('/admin/surveys/'.$survey->share_token.'/publish-eitaa')
            ->assertSessionHas('error');

        Http::assertNothingSent();
    }

    public function test_publish_to_eitaa_sends_message_to_channel(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:d53056d5-test-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $survey = $this->makeSurvey(['status' => 'published']);

        $this->actingAs($admin)
            ->post('/admin/surveys/'.$survey->share_token.'/publish-eitaa')
            ->assertSessionHas('success');

        Http::assertSent(function ($request) use ($survey) {
            return str_contains($request->url(), 'eitaayar.ir/api/bot209540:d53056d5-test-token/sendMessage')
                && $request['chat_id'] === 'mychannel'
                && str_contains($request['text'], $survey->title)
                && str_contains($request['text'], url('/survey/'.$survey->share_token));
        });
    }

    public function test_publish_to_eitaa_reports_api_failure(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => false, 'description' => 'chat not found'], 400)]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:test-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $survey = $this->makeSurvey(['status' => 'published']);

        $this->actingAs($admin)
            ->post('/admin/surveys/'.$survey->share_token.'/publish-eitaa')
            ->assertSessionHas('error');
    }

    public function test_admin_can_schedule_survey_for_eitaa_publish(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->post('/admin/surveys', [
            'title' => 'نظرسنجی زمان‌بندی‌شده',
            'status' => 'published',
            'settings' => ['registration_after' => 1],
            'eitaa_scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
            'questions' => [
                ['type' => 'single', 'title' => 'سؤال اول', 'options' => ['بله', 'خیر'], 'is_required' => true],
            ],
        ])->assertRedirect();

        $survey = Survey::where('title', 'نظرسنجی زمان‌بندی‌شده')->firstOrFail();
        $this->assertNotNull($survey->eitaa_scheduled_at);
        $this->assertNull($survey->eitaa_published_at);
    }

    public function test_scheduled_publish_command_publishes_due_survey(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:scheduled-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');

        $survey = $this->makeSurvey([
            'status' => 'published',
            'eitaa_scheduled_at' => now()->subMinute(),
        ]);

        $this->artisan('surveys:publish-eitaa-scheduled')->assertExitCode(0);

        Http::assertSent(function ($request) use ($survey) {
            return str_contains($request->url(), 'eitaayar.ir/api/bot209540:scheduled-token/sendMessage')
                && $request['chat_id'] === 'mychannel'
                && str_contains($request['text'], $survey->title);
        });

        $this->assertDatabaseHas('surveys', [
            'id' => $survey->id,
            'eitaa_scheduled_at' => null,
        ]);
        $this->assertNotNull($survey->fresh()->eitaa_published_at);
    }

    public function test_scheduled_publish_skips_future_and_already_published_surveys(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:scheduled-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');

        $future = $this->makeSurvey(['status' => 'published', 'share_token' => 'future-token', 'eitaa_scheduled_at' => now()->addDay()]);
        $already = $this->makeSurvey(['status' => 'published', 'share_token' => 'already-token', 'eitaa_scheduled_at' => now()->subMinute(), 'eitaa_published_at' => now()]);

        $this->artisan('surveys:publish-eitaa-scheduled')->assertExitCode(0);

        Http::assertNothingSent();
        $this->assertNull($future->fresh()->eitaa_published_at);
        $this->assertNotNull($already->fresh()->eitaa_published_at);
    }

    public function test_arabic_shaper_joins_letters_and_preserves_digit_order(): void
    {
        $this->assertSame([0xFEAA, 0xFEDF, 0xFE8D, 0xFEED], $this->codepoints(ArabicShaper::render('والد')));
        // «سلام» = س + ل + ا (ligature) + م
        $this->assertSame([0xFEE3, 0xFEFC, 0xFEB3], $this->codepoints(ArabicShaper::render('سلام')));
        $this->assertSame('۱۲۳', ArabicShaper::render('۱۲۳'));
        $this->assertSame('OK 2026', ArabicShaper::render('OK 2026'));
    }

    public function test_summary_card_generator_produces_png(): void
    {
        if (! extension_loaded('gd') || ! function_exists('imagettftext')) {
            $this->markTestSkipped('GD extension is not available.');
        }

        $survey = $this->makeSurvey(['status' => 'closed', 'share_token' => 'card-token']);
        $questions = $survey->questions()->get();
        $survey->responses()->create([
            'session_token' => Str::random(32),
            'status' => 'completed',
            'answers' => [
                (string) $questions[0]->id => 'والد',
                (string) $questions[1]->id => 'بله',
                (string) $questions[2]->id => 'نظر آزاد',
                (string) $questions[3]->id => '5',
            ],
            'answered_count' => 4,
            'completed_at' => now(),
        ]);

        $path = app(EitaaCardGenerator::class)->generate($survey);
        $this->assertNotNull($path);
        $this->assertFileExists($path);
        $this->assertSame("\x89PNG\r\n\x1a\n", file_get_contents($path, false, null, 0, 8));
        $size = getimagesize($path);
        $this->assertSame(1080, $size[0]);
        @unlink($path);
    }

    public function test_summary_image_publish_sends_photo(): void
    {
        if (! extension_loaded('gd') || ! function_exists('imagettftext')) {
            $this->markTestSkipped('GD extension is not available.');
        }

        Http::fake(['eitaayar.ir/api/*/sendPhoto' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:summary-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');
        Setting::set('eitaa_summary_image', '1', 'eitaa');

        $survey = $this->makeSurvey(['status' => 'closed', 'share_token' => 'image-summary-token']);
        $survey->responses()->create(['session_token' => Str::random(32), 'status' => 'completed', 'answers' => ['1' => 'والد'], 'answered_count' => 1, 'completed_at' => now()]);

        $this->artisan('surveys:send-eitaa-summaries')->assertExitCode(0);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'eitaayar.ir/api/bot209540:summary-token/sendPhoto')
                && str_contains($request->body(), 'name="chat_id"')
                && str_contains($request->body(), 'mychannel')
                && str_contains($request->body(), 'name="photo"');
        });

        $this->assertNotNull($survey->fresh()->eitaa_summary_sent_at);
        $this->assertSame([], glob(storage_path('app/eitaa-cards/*.png')) ?: []);
    }

    public function test_summary_command_sends_results_for_closed_survey(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:summary-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');
        Setting::set('eitaa_summary_image', '0', 'eitaa');

        $survey = $this->makeSurvey(['status' => 'closed', 'share_token' => 'summary-token']);
        $questions = $survey->questions()->get();
        $survey->responses()->create([
            'session_token' => Str::random(32),
            'status' => 'completed',
            'answers' => [
                (string) $questions[0]->id => 'والد',
                (string) $questions[1]->id => 'بله',
                (string) $questions[2]->id => 'نظر آزاد',
                (string) $questions[3]->id => '5',
            ],
            'answered_count' => 4,
            'completed_at' => now(),
        ]);

        $this->artisan('surveys:send-eitaa-summaries')->assertExitCode(0);

        Http::assertSent(function ($request) use ($survey, $questions) {
            return str_contains($request->url(), 'eitaayar.ir/api/bot209540:summary-token/sendMessage')
                && str_contains($request['text'], 'مجموع پاسخ‌ها: 1')
                && str_contains($request['text'], 'والد: 1 (100٪)')
                && str_contains($request['text'], 'میانگین: 5.0 از ۵');
        });

        $this->assertNotNull($survey->fresh()->eitaa_summary_sent_at);
    }

    public function test_summary_respects_question_selection_and_intro_outro(): void
    {
        $survey = $this->makeSurvey([
            'status' => 'closed',
            'share_token' => 'template-token',
            'settings' => [
                'registration_after' => 2,
                'summary_intro' => 'مقدمه {title}',
                'summary_outro' => 'پایان از {title}',
            ],
        ]);
        $survey->questions()->first()->update(['include_in_summary' => false]);
        $survey->responses()->create(['session_token' => Str::random(32), 'status' => 'completed', 'answers' => ['1' => 'والد'], 'answered_count' => 1, 'completed_at' => now()]);

        $summary = app(EitaaPublisher::class)->summaryFor($survey->fresh());

        $this->assertStringContainsString('مقدمه '.$survey->title, $summary);
        $this->assertStringContainsString('پایان از '.$survey->title, $summary);
        $this->assertStringNotContainsString('نقش شما چیست؟', $summary);
        $this->assertStringContainsString('آیا ادامه می‌دهید؟', $summary);
    }

    public function test_summary_command_skips_open_and_already_sent_surveys(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:summary-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');

        $open = $this->makeSurvey(['status' => 'published', 'share_token' => 'open-token']);
        $open->responses()->create(['session_token' => Str::random(32), 'status' => 'completed', 'answers' => ['1' => 'بله'], 'answered_count' => 1, 'completed_at' => now()]);

        $sent = $this->makeSurvey(['status' => 'closed', 'share_token' => 'sent-token', 'eitaa_summary_sent_at' => now()]);
        $sent->responses()->create(['session_token' => Str::random(32), 'status' => 'completed', 'answers' => ['1' => 'والد'], 'answered_count' => 1, 'completed_at' => now()]);

        $empty = $this->makeSurvey(['status' => 'closed', 'share_token' => 'empty-token']);

        $this->artisan('surveys:send-eitaa-summaries')->assertExitCode(0);

        Http::assertNothingSent();
        $this->assertNull($open->fresh()->eitaa_summary_sent_at);
        $this->assertNotNull($sent->fresh()->eitaa_summary_sent_at);
        $this->assertNull($empty->fresh()->eitaa_summary_sent_at);
    }

    public function test_admin_can_send_summary_to_eitaa_manually(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:summary-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');
        Setting::set('eitaa_summary_image', '0', 'eitaa');

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $survey = $this->makeSurvey(['status' => 'closed', 'share_token' => 'manual-summary-token']);
        $survey->responses()->create(['session_token' => Str::random(32), 'status' => 'completed', 'answers' => ['1' => 'والد'], 'answered_count' => 1, 'completed_at' => now()]);

        $this->actingAs($admin)
            ->post('/admin/surveys/'.$survey->share_token.'/send-eitaa-summary')
            ->assertSessionHas('success');

        $this->assertNotNull($survey->fresh()->eitaa_summary_sent_at);
    }

    /** @return int[] */
    private function codepoints(string $text): array
    {
        $codepoints = [];
        $length = strlen($text);
        for ($i = 0; $i < $length;) {
            $code = ord($text[$i]);
            if ($code < 0x80) {
                $codepoints[] = $code;
                $i++;
            } elseif (($code & 0xE0) === 0xC0) {
                $codepoints[] = (($code & 0x1F) << 6) | (ord($text[$i + 1]) & 0x3F);
                $i += 2;
            } elseif (($code & 0xF0) === 0xE0) {
                $codepoints[] = (($code & 0x0F) << 12) | ((ord($text[$i + 1]) & 0x3F) << 6) | (ord($text[$i + 2]) & 0x3F);
                $i += 3;
            } else {
                $codepoints[] = (($code & 0x07) << 18) | ((ord($text[$i + 1]) & 0x3F) << 12) | ((ord($text[$i + 2]) & 0x3F) << 6) | (ord($text[$i + 3]) & 0x3F);
                $i += 4;
            }
        }

        return $codepoints;
    }

    /** @param array{name: string, phone: string} $payload */
    private function registerOnSurvey(Survey $survey, array $payload): void
    {
        $this->post('/survey/'.$survey->share_token.'/register', $payload)
            ->assertRedirect('/survey/'.$survey->share_token.'/register?step=code');

        $code = session('survey_register_dev_code');
        $this->assertNotNull($code);

        $this->post('/survey/'.$survey->share_token.'/register/verify', [
            'phone' => $payload['phone'],
            'code' => $code,
        ])->assertRedirect('/survey/'.$survey->share_token);
    }

    private function makeSurvey(array $attributes = []): Survey
    {
        $survey = Survey::create(array_merge([
            'title' => 'شناخت مخاطب',
            'share_token' => 'private-survey-token',
            'description' => 'توضیح',
            'status' => 'published',
            'settings' => ['registration_after' => 2],
        ], $attributes));

        foreach ([
            ['type' => 'single', 'title' => 'نقش شما چیست؟', 'options' => ['والد', 'نوجوان']],
            ['type' => 'yes_no', 'title' => 'آیا ادامه می‌دهید؟', 'options' => []],
            ['type' => 'textarea', 'title' => 'نظر شما چیست؟', 'options' => []],
            ['type' => 'rating', 'title' => 'امتیاز شما؟', 'options' => []],
        ] as $index => $question) {
            SurveyQuestion::create([
                'survey_id' => $survey->id,
                ...$question,
                'is_required' => true,
                'sort_order' => $index,
            ]);
        }

        return $survey;
    }
}
