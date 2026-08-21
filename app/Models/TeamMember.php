<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class TeamMember extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'title',
        'role',
        'photo',
        'bio',
        'specialties',
        'sort_order',
        'is_featured',
        'is_active',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public const ROLES = ['instructor' => 'مدرس', 'coach' => 'کوچ', 'team' => 'بقیه تیم'];

    public function scopeRole(Builder $query, string $role): Builder
    {
        return $query->where('role', $role);
    }

    protected function casts(): array
    {
        return [
            'specialties' => 'array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderByDesc('is_featured')->orderBy('sort_order')->orderBy('id');
    }
}
