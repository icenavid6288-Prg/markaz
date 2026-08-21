<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
}
