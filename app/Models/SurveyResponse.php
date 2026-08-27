<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SurveyResponse extends Model
{
    protected $fillable = [
        'survey_id', 'user_id', 'session_token', 'status', 'answers', 'answered_count',
        'registered_at', 'completed_at', 'ip_hash', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'registered_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (SurveyResponse $response): void {
            $response->session_token ??= Str::random(64);
        });
    }

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Return answers keyed by the current question IDs.
     *
     * Older form updates recreated questions and left responses keyed by the
     * previous IDs. Keep those responses readable by falling back to their
     * stored order when no current question ID is present.
     *
     * @param  Collection<int, SurveyQuestion>|null  $questions
     * @return array<string, mixed>
     */
    public function answersForQuestions(?Collection $questions = null): array
    {
        $answers = is_array($this->answers) ? $this->answers : [];
        $questions ??= $this->survey?->questions;

        if (! $questions || $questions->isEmpty()) {
            return $answers;
        }

        $currentIds = $questions->map(fn (SurveyQuestion $question) => (string) $question->id)->all();
        $normalized = [];
        $legacyValues = [];

        foreach ($answers as $key => $value) {
            $key = (string) $key;
            if (in_array($key, $currentIds, true)) {
                $normalized[$key] = $value;
            } else {
                $legacyValues[] = $value;
            }
        }

        if ($legacyValues !== []) {
            $legacyIndex = 0;
            foreach ($questions as $question) {
                $key = (string) $question->id;
                if (array_key_exists($key, $normalized)) {
                    continue;
                }
                if (array_key_exists($legacyIndex, $legacyValues)) {
                    $normalized[$key] = $legacyValues[$legacyIndex];
                    $legacyIndex++;
                }
            }
        }

        return $normalized;
    }
}
