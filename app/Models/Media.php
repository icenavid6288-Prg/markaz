<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Media extends Model
{
    protected $fillable = [
        'parent_id',
        'name',
        'file_name',
        'mime_type',
        'disk',
        'size',
        'folder',
        'url_path',
        'alt',
        'type',
        'collection',
        'version',
        'is_current',
        'uploaded_by',
        'mediable_type',
        'mediable_id',
    ];

    protected function casts(): array
    {
        return [
            'is_current' => 'boolean',
            'version' => 'integer',
            'size' => 'integer',
        ];
    }

    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderByDesc('version');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function familyRootId(): int
    {
        return (int) ($this->parent_id ?: $this->id);
    }

    public static function typeFromMime(?string $mime): string
    {
        $mime = (string) $mime;
        if (str_starts_with($mime, 'image/')) {
            return 'image';
        }
        if (str_starts_with($mime, 'video/')) {
            return 'video';
        }
        if (str_starts_with($mime, 'audio/')) {
            return 'audio';
        }

        return 'document';
    }
}
