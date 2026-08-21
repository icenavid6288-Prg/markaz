<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Product extends Model
{
    protected $fillable = [
        'type',
        'title',
        'slug',
        'description',
        'image',
        'category_id',
        'price',
        'discount_price',
        'download_price',
        'download_discount_price',
        'stock',
        'reserved_stock',
        'file_path',
        'preview_file_path',
        'author',
        'pages',
        'publisher',
        'isbn',
        'audio_duration_seconds',
        'preview_url',
        'is_active',
        'is_featured',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'discount_price' => 'integer',
            'download_price' => 'integer',
            'download_discount_price' => 'integer',
            'reserved_stock' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function episodes(): HasMany
    {
        return $this->hasMany(PodcastEpisode::class)->orderBy('sort_order');
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function finalPrice(): int
    {
        return $this->discount_price ?? $this->price;
    }

    public function availableStock(): int
    {
        return max(0, (int) $this->stock - (int) $this->reserved_stock);
    }

    public function downloadPrice(): int
    {
        return (int) ($this->download_discount_price ?? $this->download_price ?? $this->finalPrice());
    }

    public function hasDownloadEdition(): bool
    {
        return filled($this->file_path) || $this->download_price !== null;
    }

    public function hasPreviewEdition(): bool
    {
        return filled($this->preview_file_path);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }
}
