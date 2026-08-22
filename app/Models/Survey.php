<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Survey extends Model
{
    protected $fillable = [
        'created_by', 'title', 'persline_type', 'share_token', 'description', 'welcome_message',
        'completion_message', 'status', 'settings', 'starts_at', 'ends_at',
        'eitaa_scheduled_at', 'eitaa_published_at', 'eitaa_summary_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'eitaa_scheduled_at' => 'datetime',
            'eitaa_published_at' => 'datetime',
            'eitaa_summary_sent_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Survey $survey): void {
            $survey->share_token ??= Str::lower(Str::random(32));
        });
    }

    public function getRouteKeyName(): string
    {
        return 'share_token';
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('sort_order');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where(fn (Builder $nested) => $nested->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn (Builder $nested) => $nested->whereNull('ends_at')->orWhere('ends_at', '>=', now()));
    }

    public function registrationAfter(): int
    {
        return max(0, (int) ($this->settings['registration_after'] ?? 3));
    }

    public function displayMode(): string
    {
        if (filled($this->persline_type)) {
            return 'paged';
        }

        return $this->setting('display_mode') === 'paged' ? 'paged' : 'all';
    }

    public function isClosed(): bool
    {
        if ($this->status === 'closed') {
            return true;
        }

        return $this->status === 'published'
            && $this->ends_at !== null
            && $this->ends_at->isPast();
    }

    public function setting(string $key, mixed $default = null): mixed
    {
        return $this->settings[$key] ?? $default;
    }

    public function posterUrl(): string
    {
        $path = trim((string) $this->setting('poster', ''));

        return $path !== '' && str_starts_with($path, '/') && ! str_starts_with($path, '//')
            ? $path
            : '';
    }
}
