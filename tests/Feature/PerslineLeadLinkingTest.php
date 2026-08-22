<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Survey;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PerslineLeadLinkingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_guest_completing_warm_lead_form_creates_crm_lead(): void
    {
        $survey = $this->makeWarmLeadForm();

        $this->submitAnswers($survey, [
            'نام و نام خانوادگی' => 'علی رضایی',
            'شماره تماس' => '09123456789',
            'نام فرزند' => 'رضا',
        ]);

        $lead = Lead::where('phone', '09123456789')->first();
        $this->assertNotNull($lead);
        $this->assertSame('علی رضایی', $lead->name);
        $this->assertSame('website', $lead->source);
        $this->assertSame('new', $lead->status);
        $this->assertNull($lead->user_id);
        $this->assertStringContainsString('نام فرزند: رضا', (string) $lead->notes);
        $this->assertDatabaseHas('lead_activities', [
            'lead_id' => $lead->id,
            'type' => 'survey',
        ]);
    }

    public function test_completed_response_links_lead_to_registered_user(): void
    {
        $user = User::factory()->create(['phone' => '09123456788']);
        $survey = $this->makeWarmLeadForm();
        $questions = $survey->questions()->get();

        $this->actingAs($user)->post("/survey/{$survey->share_token}/answer", [
            'question_id' => $questions[0]->id,
            'answer' => 'کاربر واردشده',
        ])->assertRedirect();
        $this->actingAs($user)->post("/survey/{$survey->share_token}/answer", [
            'question_id' => $questions[1]->id,
            'answer' => '09123456788',
        ])->assertRedirect();
        // The optional question is presented as well; skipping it completes the form.
        $this->actingAs($user)->post("/survey/{$survey->share_token}/answer", [
            'question_id' => $questions[2]->id,
            'answer' => '',
        ])->assertRedirect();

        $lead = Lead::where('phone', '09123456788')->firstOrFail();
        $this->assertSame($user->id, $lead->user_id);
        $this->assertSame('registered', $lead->status);
        $this->assertDatabaseHas('lead_activities', ['lead_id' => $lead->id, 'type' => 'registration']);
        $this->assertDatabaseHas('lead_activities', ['lead_id' => $lead->id, 'type' => 'survey']);
    }

    public function test_registering_inside_the_form_links_lead_to_new_user(): void
    {
        $survey = $this->makeWarmLeadForm(['settings' => ['registration_after' => 1]]);

        // Guest answers the first (free) question, then hits the registration wall.
        $this->post("/survey/{$survey->share_token}/answer", [
            'question_id' => $survey->questions()->first()->id,
            'answer' => 'ثبت‌نامی',
        ])->assertRedirect(route('survey.register', $survey));

        $this->post("/survey/{$survey->share_token}/register", [
            'name' => 'ثبت‌نامی',
            'phone' => '09123456787',
        ])->assertRedirect(route('survey.register', ['survey' => $survey, 'step' => 'code']));

        $code = session('survey_register_dev_code');
        $this->assertNotNull($code);
        $this->post("/survey/{$survey->share_token}/register/verify", [
            'phone' => '09123456787',
            'code' => $code,
        ])->assertRedirect();

        $user = User::where('phone', '09123456787')->firstOrFail();
        $lead = Lead::where('phone', '09123456787')->firstOrFail();
        $this->assertSame('ثبت‌نامی', $lead->name);
        $this->assertSame('registration', $lead->source);
        $this->assertSame($user->id, $lead->user_id);
        $this->assertSame('registered', $lead->status);
        $this->assertDatabaseHas('lead_activities', [
            'lead_id' => $lead->id,
            'type' => 'registration',
            'description' => 'ثبت‌نام از داخل فرم «'.$survey->title.'»',
        ]);
    }

    public function test_form_without_phone_field_does_not_create_lead(): void
    {
        $survey = Survey::create([
            'title' => 'فرم بدون شماره تماس',
            'persline_type' => 'ads',
            'status' => 'published',
            'settings' => ['registration_after' => 0],
        ]);
        $survey->questions()->create(['type' => 'single', 'title' => 'سن فرزند؟', 'options' => ['۱۳–۱۴'], 'is_required' => true, 'sort_order' => 0]);

        $this->post("/survey/{$survey->share_token}/answer", [
            'question_id' => $survey->questions()->first()->id,
            'answer' => '۱۳–۱۴',
        ])->assertRedirect();

        $this->assertDatabaseCount('leads', 0);
    }

    public function test_same_phone_in_two_responses_updates_single_lead_with_both_activities(): void
    {
        $survey = $this->makeWarmLeadForm();

        $this->submitAnswers($survey, ['نام و نام خانوادگی' => 'علی', 'شماره تماس' => '09123456786']);
        $this->flushSession();

        $this->submitAnswers($survey, ['نام و نام خانوادگی' => 'علی محمدی', 'شماره تماس' => '09123456786']);

        $this->assertSame(1, Lead::where('phone', '09123456786')->count());
        $lead = Lead::where('phone', '09123456786')->firstOrFail();
        $this->assertSame('علی محمدی', $lead->name);
        $this->assertSame(2, $lead->activities()->where('type', 'survey')->count());
    }

    private function makeWarmLeadForm(array $attributes = []): Survey
    {
        $survey = Survey::create(array_merge([
            'title' => 'فرم لید گرم',
            'persline_type' => 'warm_lead',
            'status' => 'published',
            'settings' => ['registration_after' => 0],
        ], $attributes));
        $survey->questions()->create(['type' => 'text', 'title' => 'نام و نام خانوادگی', 'settings' => ['lead_key' => 'name'], 'is_required' => true, 'sort_order' => 0]);
        $survey->questions()->create(['type' => 'text', 'title' => 'شماره تماس', 'settings' => ['lead_key' => 'phone'], 'is_required' => true, 'sort_order' => 1]);
        $survey->questions()->create(['type' => 'text', 'title' => 'نام فرزند', 'settings' => ['lead_key' => 'child_name'], 'is_required' => false, 'sort_order' => 2]);

        return $survey;
    }

    /** @param array<string, string> $byTitle */
    private function submitAnswers(Survey $survey, array $byTitle): void
    {
        foreach ($survey->questions()->get() as $question) {
            // Every question is presented one per page; optional questions are
            // submitted with an empty value when skipped.
            $this->post("/survey/{$survey->share_token}/answer", [
                'question_id' => $question->id,
                'answer' => $byTitle[$question->title] ?? '',
            ])->assertRedirect();
        }
    }
}
