<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EitaaKeyword extends Model
{
    public const MATCH_TYPES = ['exact', 'contains', 'starts_with', 'regex'];

    protected $table = 'eitaa_keywords';

    protected $fillable = ['bot_id', 'keyword', 'match_type', 'response', 'priority', 'stop_processing', 'is_active', 'hit_count'];

    protected $casts = ['priority' => 'integer', 'stop_processing' => 'boolean', 'is_active' => 'boolean', 'hit_count' => 'integer'];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(EitaaBot::class, 'bot_id');
    }

    public function matches(string $text): bool
    {
        return match ($this->match_type) {
            'exact' => mb_strtolower(trim($text)) === mb_strtolower(trim($this->keyword)),
            'starts_with' => str_starts_with(mb_strtolower(trim($text)), mb_strtolower(trim($this->keyword))),
            'regex' => (bool) @preg_match($this->keyword, $text),
            default => str_contains(mb_strtolower($text), mb_strtolower($this->keyword)),
        };
    }
}
