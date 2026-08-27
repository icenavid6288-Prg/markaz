<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveyQuestion extends Model
{
    protected $fillable = [
        'survey_id', 'type', 'title', 'description', 'options', 'settings', 'is_required', 'include_in_summary', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'settings' => 'array',
            'is_required' => 'boolean',
            'include_in_summary' => 'boolean',
        ];
    }

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }
}
