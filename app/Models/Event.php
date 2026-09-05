<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'title', 'slug', 'type', 'summary', 'description', 'poster', 'video_url',
        'video_path', 'live_url', 'price', 'discount_price', 'event_date', 'duration_minutes', 'location', 'speaker',
        'status', 'is_featured', 'seo',
    ];

    protected function casts(): array
    {
        return ['event_date' => 'datetime', 'price' => 'integer', 'discount_price' => 'integer', 'is_featured' => 'boolean', 'seo' => 'array'];
    }

    public function finalPrice(): int { return (int) ($this->discount_price ?? $this->price); }

    public function scopePublished(Builder $query): Builder
    {
        // event_date is optional for on-demand webinars. A missing date must
        // not hide an otherwise published event or make /events appear empty.
        return $query->where('status', 'published');
    }
}
