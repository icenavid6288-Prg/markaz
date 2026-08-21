<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'summary',
        'description',
        'icon',
        'image',
        'price',
        'is_active',
        'is_featured',
        'features',
        'process',
        'target_audience',
        'outcomes',
        'faqs',
        'cta_text',
        'cta_url',
        'sort_order',
        'seo',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'features' => 'array',
            'process' => 'array',
            'target_audience' => 'array',
            'outcomes' => 'array',
            'faqs' => 'array',
            'seo' => 'array',
        ];
    }

    public function testimonials(): MorphMany
    {
        return $this->morphMany(Testimonial::class, 'faqable');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('sort_order');
    }
}
