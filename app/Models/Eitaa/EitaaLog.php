<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EitaaLog extends Model
{
    protected $table = 'eitaa_logs';

    protected $fillable = ['bot_id', 'admin_id', 'event', 'level', 'message', 'context', 'ip_address'];

    protected $casts = ['context' => 'array'];

    public function bot(): BelongsTo
    {
        return $this->belongsTo(EitaaBot::class, 'bot_id');
    }

    /** Records a module event; secrets are stripped from context defensively. */
    public static function record(?int $botId, string $event, string $message, array $context = [], string $level = 'info'): void
    {
        unset($context['token'], $context['access_token'], $context['api_key']);

        try {
            self::create([
                'bot_id' => $botId,
                'admin_id' => auth()->id(),
                'event' => $event,
                'level' => $level,
                'message' => mb_substr($message, 0, 1000),
                'context' => $context,
                'ip_address' => request()?->ip(),
            ]);
        } catch (\Throwable) {
            // Logging must never break the main flow.
        }
    }
}
