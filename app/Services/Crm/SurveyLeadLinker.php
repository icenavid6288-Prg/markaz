<?php

namespace App\Services\Crm;

use App\Models\Lead;
use App\Models\SurveyResponse;

/**
 * Connects survey / persline responses to CRM leads.
 *
 * A question can declare a `settings.lead_key` (name, phone, email, child_age,
 * grade, need, child_name) and its submitted answer then populates the matching
 * lead field. This is what makes the «لید گرم» template feed the CRM: its name,
 * phone and child-name questions carry those keys.
 */
class SurveyLeadLinker
{
    private const COLUMN_KEYS = ['name', 'phone', 'email', 'child_age', 'grade', 'need'];

    public function __construct(private readonly LeadService $leads)
    {
    }

    /**
     * Read the answers whose questions declare a lead_key.
     *
     * @return array<string, string>
     */
    public function extractFields(SurveyResponse $response): array
    {
        $answers = $response->answers ?? [];
        $fields = [];

        foreach ($response->survey->questions as $question) {
            $key = $question->settings['lead_key'] ?? null;
            if (! is_string($key) || $key === '') {
                continue;
            }

            $value = $answers[(string) $question->id] ?? null;
            if ($value === null || $value === '') {
                continue;
            }

            $fields[$key] = is_array($value)
                ? implode('، ', array_filter($value, fn ($item) => (string) $item !== ''))
                : (string) $value;
        }

        return $fields;
    }

    /**
     * Create or update the CRM lead for a completed response.
     *
     * Returns null when the form carries no phone answer, so plain surveys never
     * create stray leads. The lead is linked to the responding user when present
     * and every completed response is logged on the lead's activity timeline.
     */
    public function link(SurveyResponse $response): ?Lead
    {
        $fields = $this->extractFields($response);
        $phone = $fields['phone'] ?? null;

        if (! is_string($phone) || preg_match('/^09\d{9}$/', $phone) !== 1) {
            return null;
        }

        $lead = $this->leads->findOrCreate($phone, (string) ($fields['name'] ?? ''));

        $fill = ['source' => $this->sourceFor($response->survey->persline_type)];
        foreach (self::COLUMN_KEYS as $key) {
            if (($fields[$key] ?? '') !== '') {
                $fill[$key] = $fields[$key];
            }
        }

        $extras = collect($fields)
            ->except(self::COLUMN_KEYS)
            ->filter(fn ($value) => (string) $value !== '')
            ->map(fn ($value, $key) => $this->labelFor((string) $key).': '.$value);

        $notes = trim(($lead->notes ?? '').($extras->isEmpty() ? '' : "\n".$extras->implode("\n")));
        if ($notes !== '') {
            $fill['notes'] = $notes;
        }

        $lead->fill($fill)->save();

        if ($response->user_id !== null && $response->user !== null) {
            $this->leads->linkToUser($lead, $response->user, 'اتصال خودکار به حساب کاربر از پاسخ فرم «'.$response->survey->title.'»');
        }

        $this->leads->record(
            $lead,
            'survey',
            'پاسخ به فرم «'.$response->survey->title.'» ('.now()->format('Y/m/d H:i').')',
            $response->user,
        );

        return $lead;
    }

    private function sourceFor(?string $perslineType): string
    {
        return $perslineType === 'eitaa' ? 'eitaa' : 'website';
    }

    private function labelFor(string $key): string
    {
        return match ($key) {
            'child_name' => 'نام فرزند',
            default => $key,
        };
    }
}
