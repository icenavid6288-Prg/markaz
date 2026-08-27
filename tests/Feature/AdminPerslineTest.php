<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminPerslineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_admin_can_view_persline_index_with_types_and_forms(): void
    {
        $admin = User::factory()->create(['name' => 'مدیر پرسلاین']);
        $admin->assignRole('admin');
        $form = Survey::create([
            'title' => 'فرم تبلیغات تابستان',
            'persline_type' => 'ads',
            'status' => 'published',
            'settings' => ['registration_after' => 0],
        ]);

        $this->actingAs($admin)
            ->get('/admin/persline')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Persline/Index')
                ->has('forms.data', 1)
                ->has('types.ads')
                ->has('types.eitaa')
                ->has('types.warm_lead')
                ->where('forms.data.0.title', 'فرم تبلیغات تابستان')
                ->where('forms.data.0.persline_type', 'ads')
                ->where('forms.data.0.share_url', url('/survey/'.$form->share_token)));
    }

    public function test_admin_can_create_a_form_from_template(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->get('/admin/persline/create?type=warm_lead')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Persline/Form')
                ->where('selectedTemplate.key', 'warm_lead')
                ->has('templates')
                ->has('questionTypes'));

        $this->actingAs($admin)
            ->post('/admin/persline', [
                'persline_type' => 'warm_lead',
                'title' => 'نقشه اولیه آینده فرزند من',
                'description' => 'فرم لید گرم',
                'status' => 'published',
                'settings' => ['registration_after' => 2, 'show_progress' => true],
                'questions' => [
                    ['type' => 'single', 'title' => 'سن فرزند؟', 'options' => ['۱۳–۱۴', '۱۵–۱۶']],
                    ['type' => 'text', 'title' => 'نام و نام خانوادگی', 'options' => [], 'settings' => ['lead_key' => 'name']],
                ],
            ])
            ->assertRedirect();

        $survey = Survey::where('persline_type', 'warm_lead')->firstOrFail();
        $this->assertSame('نقشه اولیه آینده فرزند من', $survey->title);
        $this->assertSame('published', $survey->status);
        $this->assertSame(2, $survey->setting('registration_after'));
        $this->assertSame(2, $survey->questions()->count());
        $this->assertSame('name', $survey->questions()->where('title', 'نام و نام خانوادگی')->value('settings')['lead_key'] ?? null);
    }

    public function test_admin_update_preserves_question_ids_for_existing_answers(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $form = Survey::create([
            'title' => 'فرم پاسخ‌دار',
            'persline_type' => 'ads',
            'status' => 'published',
            'settings' => ['registration_after' => 0],
        ]);
        $question = $form->questions()->create(['type' => 'single', 'title' => 'سؤال اول', 'options' => ['بله'], 'sort_order' => 0]);
        $form->responses()->create([
            'session_token' => Str::random(32),
            'status' => 'completed',
            'answers' => [(string) $question->id => 'بله'],
            'answered_count' => 1,
            'completed_at' => now(),
        ]);

        $this->actingAs($admin)->put("/admin/persline/{$form->share_token}", [
            'persline_type' => 'ads',
            'title' => 'فرم پاسخ‌دار',
            'status' => 'published',
            'settings' => ['registration_after' => 0],
            'questions' => [
                ['id' => $question->id, 'type' => 'single', 'title' => 'سؤال ویرایش‌شده', 'options' => ['بله', 'خیر'], 'is_required' => true],
            ],
        ])->assertSessionHas('success');

        $this->assertSame($question->id, $form->questions()->firstOrFail()->id);
        $this->actingAs($admin)->get("/admin/persline/{$form->share_token}/responses")
            ->assertInertia(fn ($page) => $page->where('responses.data.0.answers.0.value', 'بله'));
    }

    public function test_admin_can_update_a_form_and_replace_its_questions(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $form = Survey::create([
            'title' => 'فرم اولیه',
            'persline_type' => 'ads',
            'status' => 'draft',
            'settings' => ['registration_after' => 0],
        ]);
        $form->questions()->create(['type' => 'single', 'title' => 'سؤال قدیمی', 'options' => ['بله'], 'sort_order' => 0]);

        $this->actingAs($admin)
            ->put("/admin/persline/{$form->share_token}", [
                'persline_type' => 'ads',
                'title' => 'فرم ویرایش‌شده',
                'status' => 'published',
                'settings' => ['registration_after' => 1, 'randomize_questions' => true],
                'questions' => [
                    ['type' => 'rating', 'title' => 'امتیاز شما', 'options' => []],
                    ['type' => 'textarea', 'title' => 'نظر شما', 'options' => []],
                ],
            ])
            ->assertSessionHas('success');

        $form->refresh();
        $this->assertSame('فرم ویرایش‌شده', $form->title);
        $this->assertSame('published', $form->status);
        $this->assertSame(1, $form->setting('registration_after'));
        $this->assertTrue($form->setting('randomize_questions'));
        $this->assertSame(['rating', 'textarea'], $form->questions()->orderBy('sort_order')->pluck('type')->all());
    }

    public function test_admin_can_update_a_form_with_multipart_body_like_the_client(): void
    {
        // The React studio submits updates as multipart/form-data with Laravel method
        // spoofing (_method=put) because PHP only populates $_POST for real POST
        // bodies — a genuine multipart PUT would arrive with an empty payload.
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $form = Survey::create([
            'title' => 'فرم اولیه',
            'persline_type' => 'eitaa',
            'status' => 'draft',
            'settings' => ['registration_after' => 0],
        ]);
        $form->questions()->create(['type' => 'single', 'title' => 'سؤال قدیمی', 'options' => ['بله'], 'sort_order' => 0]);

        $this->actingAs($admin)
            ->post("/admin/persline/{$form->share_token}", [
                '_method' => 'PUT',
                'persline_type' => 'eitaa',
                'title' => 'فرم ویرایش‌شده',
                'status' => 'closed',
                'settings' => ['registration_after' => 1, 'allow_multiple_responses' => true],
                'questions' => [
                    ['type' => 'single', 'title' => 'سؤال جدید', 'options' => ['۱۳–۱۴', '۱۵–۱۶'], 'is_required' => 1],
                ],
                'file' => UploadedFile::fake()->createWithContent('notes.txt', "۱. سؤال جایگزین؟\n- گزینه یک\n- گزینه دو\n"),
            ])
            ->assertSessionHas('success');

        $form->refresh();
        $this->assertSame('فرم ویرایش‌شده', $form->title);
        $this->assertSame('closed', $form->status);
        $this->assertSame(1, $form->setting('registration_after'));
        $this->assertTrue($form->setting('allow_multiple_responses'));
        $this->assertSame(['سؤال جایگزین؟'], $form->questions()->orderBy('sort_order')->pluck('title')->all());
        $this->assertSame(['گزینه یک', 'گزینه دو'], $form->questions()->first()->options);
    }

    public function test_admin_can_view_each_users_answers_and_export_csv(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $respondent = User::factory()->create(['name' => 'سارا محمدی', 'phone' => '09121112233']);
        $form = $this->makeForm(['status' => 'published']);
        $question = $form->questions()->first();
        $form->responses()->create([
            'user_id' => $respondent->id,
            'session_token' => Str::random(32),
            'status' => 'completed',
            'answers' => [(string) $question->id => '۱۵–۱۶'],
            'answered_count' => 1,
            'completed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get("/admin/persline/{$form->share_token}/responses")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Surveys/Responses')
                ->where('kind', 'persline')
                ->where('survey.title', $form->title)
                ->where('summary.completed', 1)
                ->where('responses.data.0.user.name', 'سارا محمدی')
                ->where('responses.data.0.user.phone', '09121112233')
                ->where('responses.data.0.answers.0.value', '۱۵–۱۶'));

        $csv = $this->actingAs($admin)
            ->get("/admin/persline/{$form->share_token}/responses.csv")
            ->assertOk()
            ->streamedContent();

        $this->assertStringContainsString('سارا محمدی', $csv);
        $this->assertStringContainsString('09121112233', $csv);
        $this->assertStringContainsString('۱۵–۱۶', $csv);
    }

    public function test_legacy_answer_ids_are_mapped_to_current_questions_in_results(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $form = $this->makeForm(['status' => 'published']);
        $oldQuestion = $form->questions()->firstOrFail();
        $response = $form->responses()->create([
            'session_token' => Str::random(32),
            'status' => 'completed',
            'answers' => [(string) $oldQuestion->id => '۱۵–۱۶'],
            'answered_count' => 1,
            'completed_at' => now(),
        ]);

        $oldQuestion->delete();
        $form->questions()->create(['type' => 'single', 'title' => 'سن فرزند؟', 'options' => ['۱۳–۱۴', '۱۵–۱۶'], 'sort_order' => 0]);

        $this->actingAs($admin)
            ->get("/admin/persline/{$form->share_token}/responses")
            ->assertInertia(fn ($page) => $page
                ->where('responses.data.0.id', $response->id)
                ->where('responses.data.0.answers.0.value', '۱۵–۱۶'));
    }


    public function test_admin_can_attach_a_poster_to_the_form(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $poster = UploadedFile::fake()->image('poster.jpg', 800, 450);

        $this->actingAs($admin)->post('/admin/persline', [
            'persline_type' => 'ads',
            'title' => 'فرم با پوستر',
            'status' => 'published',
            'settings' => ['registration_after' => 999],
            'questions' => [
                ['type' => 'single', 'title' => 'سن فرزند؟', 'options' => ['۱۳–۱۴', '۱۵–۱۶']],
            ],
            'poster_file' => $poster,
        ])->assertRedirect();

        $form = Survey::where('title', 'فرم با پوستر')->firstOrFail();
        $this->assertStringStartsWith('/images/surveys/survey-'.$form->id.'-poster.', $form->posterUrl());
        $this->assertFileExists(public_path(ltrim($form->posterUrl(), '/')));

        $this->get('/survey/'.$form->share_token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Survey/Show')
                ->where('survey.poster_url', $form->posterUrl()));
    }

    public function test_admin_can_delete_a_form(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $form = Survey::create([
            'title' => 'فرم حذف‌شدنی',
            'persline_type' => 'eitaa',
            'status' => 'closed',
            'settings' => ['registration_after' => 0],
        ]);
        $form->questions()->create(['type' => 'single', 'title' => 'سؤال', 'options' => ['بله'], 'sort_order' => 0]);

        $this->actingAs($admin)
            ->delete("/admin/persline/{$form->share_token}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('surveys', ['id' => $form->id]);
        $this->assertDatabaseCount('survey_questions', 0);
    }

    public function test_questions_can_be_imported_from_a_text_file(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $file = UploadedFile::fake()->createWithContent('questions.txt', "۱. سن فرزندتان؟\n- ۱۳–۱۴\n- ۱۵–۱۶\n۲. بزرگ‌ترین نگرانی شما چیست؟\n۳. شماره تماس\n");

        $this->actingAs($admin)
            ->post('/admin/persline', [
                'persline_type' => 'ads',
                'title' => 'فرم با فایل سؤال',
                'status' => 'draft',
                'settings' => ['registration_after' => 0],
                'file' => $file,
            ])
            ->assertRedirect();

        $survey = Survey::where('title', 'فرم با فایل سؤال')->firstOrFail();
        $questions = $survey->questions()->orderBy('sort_order')->get();
        $this->assertCount(3, $questions);
        $this->assertSame('single', $questions[0]->type);
        $this->assertSame(['۱۳–۱۴', '۱۵–۱۶'], $questions[0]->options);
        $this->assertSame('text', $questions[1]->type);
        $this->assertSame('text', $questions[2]->type);
    }

    public function test_form_requires_at_least_one_question(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->post('/admin/persline', [
                'persline_type' => 'ads',
                'title' => 'فرم بدون سؤال',
                'status' => 'draft',
                'settings' => ['registration_after' => 0],
                'questions' => [],
            ])
            ->assertSessionHasErrors('questions');

        $this->assertDatabaseCount('surveys', 0);
    }

    public function test_lead_key_validation_rejects_unknown_crm_keys(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->post('/admin/persline', [
                'persline_type' => 'warm_lead',
                'title' => 'فرم با کلید نامعتبر',
                'status' => 'draft',
                'settings' => ['registration_after' => 0],
                'questions' => [
                    ['type' => 'text', 'title' => 'نام', 'settings' => ['lead_key' => 'hacker']],
                ],
            ])
            ->assertSessionHasErrors('questions.0.settings.lead_key');
    }

    public function test_student_cannot_access_persline_and_editor_cannot_delete(): void
    {
        $student = User::factory()->create();
        $student->assignRole('student');
        $this->actingAs($student)->get('/admin/persline')->assertForbidden();

        $editor = User::factory()->create();
        $editor->assignRole('editor');
        $this->actingAs($editor)->get('/admin/persline')->assertOk();

        $form = Survey::create([
            'title' => 'فرم ایتا',
            'persline_type' => 'eitaa',
            'status' => 'draft',
            'settings' => ['registration_after' => 0],
        ]);
        $this->actingAs($editor)->delete("/admin/persline/{$form->share_token}")->assertForbidden();
        $this->assertDatabaseHas('surveys', ['id' => $form->id]);
    }

    public function test_admin_can_schedule_persline_form_for_eitaa_publish(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->post('/admin/persline', [
            'persline_type' => 'ads',
            'title' => 'فرم زمان‌بندی‌شده',
            'status' => 'published',
            'settings' => ['registration_after' => 0],
            'eitaa_scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
            'questions' => [
                ['type' => 'single', 'title' => 'سن فرزند؟', 'options' => ['۱۳–۱۴', '۱۵–۱۶']],
            ],
        ])->assertRedirect();

        $form = Survey::where('title', 'فرم زمان‌بندی‌شده')->firstOrFail();
        $this->assertNotNull($form->eitaa_scheduled_at);
        $this->assertNull($form->eitaa_published_at);
    }

    public function test_publish_to_eitaa_requires_configured_bot(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $form = $this->makeForm(['status' => 'published']);

        $this->actingAs($admin)
            ->post("/admin/persline/{$form->share_token}/publish-eitaa")
            ->assertSessionHas('error');

        Http::assertNothingSent();
    }

    public function test_publish_to_eitaa_sends_message_to_channel(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:persline-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $form = $this->makeForm(['status' => 'published']);

        $this->actingAs($admin)
            ->post("/admin/persline/{$form->share_token}/publish-eitaa")
            ->assertSessionHas('success');

        Http::assertSent(function ($request) use ($form) {
            return str_contains($request->url(), 'eitaayar.ir/api/bot209540:persline-token/sendMessage')
                && $request['chat_id'] === 'mychannel'
                && str_contains($request['text'], $form->title)
                && str_contains($request['text'], url('/survey/'.$form->share_token));
        });

        $form->refresh();
        $this->assertNotNull($form->eitaa_published_at);
        $this->assertNull($form->eitaa_scheduled_at);
    }

    public function test_send_summary_requires_closed_form(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $form = $this->makeForm(['status' => 'published']);

        $this->actingAs($admin)
            ->post("/admin/persline/{$form->share_token}/send-eitaa-summary")
            ->assertSessionHas('error');

        Http::assertNothingSent();
    }

    public function test_admin_can_send_summary_to_eitaa_manually(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:persline-summary-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');
        Setting::set('eitaa_summary_image', '0', 'eitaa');

        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $form = $this->makeForm(['status' => 'closed']);
        $this->addResponse($form, ['سن فرزند؟' => '۱۳–۱۴']);

        $this->actingAs($admin)
            ->post("/admin/persline/{$form->share_token}/send-eitaa-summary")
            ->assertSessionHas('success');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'eitaayar.ir/api/bot209540:persline-summary-token/sendMessage')
            && str_contains($request['text'], 'مجموع پاسخ‌ها: 1'));
        $this->assertNotNull($form->fresh()->eitaa_summary_sent_at);
    }

    public function test_scheduled_publish_command_publishes_due_persline_form(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:scheduled-persline-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');

        $form = $this->makeForm([
            'status' => 'published',
            'eitaa_scheduled_at' => now()->subMinute(),
        ]);

        $this->artisan('surveys:publish-eitaa-scheduled')->assertExitCode(0);

        Http::assertSent(function ($request) use ($form) {
            return str_contains($request->url(), 'eitaayar.ir/api/bot209540:scheduled-persline-token/sendMessage')
                && str_contains($request['text'], $form->title);
        });

        $form->refresh();
        $this->assertNotNull($form->eitaa_published_at);
        $this->assertNull($form->eitaa_scheduled_at);
    }

    public function test_summary_command_sends_results_for_closed_persline_form(): void
    {
        Http::fake(['eitaayar.ir/api/*/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]])]);
        Setting::setSecret('eitaa_bot_token', 'bot209540:summary-persline-token', 'eitaa');
        Setting::set('eitaa_channel_id', 'mychannel', 'eitaa');
        Setting::set('eitaa_summary_image', '0', 'eitaa');

        $form = $this->makeForm(['status' => 'closed', 'settings' => ['registration_after' => 0, 'summary_intro' => 'مقدمه {title}']]);
        $question = $form->questions()->first();
        $this->addResponse($form, [$question->title => '۱۳–۱۴']);

        $this->artisan('surveys:send-eitaa-summaries')->assertExitCode(0);

        Http::assertSent(function ($request) use ($form, $question) {
            return str_contains($request->url(), 'eitaayar.ir/api/bot209540:summary-persline-token/sendMessage')
                && str_contains($request['text'], 'مقدمه '.$form->title)
                && str_contains($request['text'], $question->title)
                && str_contains($request['text'], '۱۳–۱۴: 1 (100٪)');
        });

        $this->assertNotNull($form->fresh()->eitaa_summary_sent_at);
    }

    private function makeForm(array $attributes = []): Survey
    {
        $form = Survey::create(array_merge([
            'title' => 'فرم کانال ایتا',
            'persline_type' => 'ads',
            'status' => 'published',
            'settings' => ['registration_after' => 0],
        ], $attributes));
        $form->questions()->create(['type' => 'single', 'title' => 'سن فرزند؟', 'options' => ['۱۳–۱۴', '۱۵–۱۶'], 'is_required' => true, 'sort_order' => 0]);

        return $form;
    }

    /** @param array<string, string> $answers */
    private function addResponse(Survey $form, array $answers): void
    {
        SurveyResponse::create([
            'survey_id' => $form->id,
            'session_token' => Str::random(32),
            'status' => 'completed',
            'answers' => collect($form->questions()->get())->mapWithKeys(fn ($question) => [(string) $question->id => $answers[$question->title] ?? null])->filter()->all(),
            'answered_count' => count($answers),
            'completed_at' => now(),
        ]);
    }
}
