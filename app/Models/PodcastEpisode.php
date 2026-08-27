<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PodcastEpisode extends Model
{
    protected $fillable = [
        'product_id',
        'title',
        'description',
        'audio_url',
        'cover',
        'duration_seconds',
        'transcript',
        'is_free',
        'published_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_free' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
