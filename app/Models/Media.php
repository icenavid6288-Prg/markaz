<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Media extends Model
{
    protected $fillable = [
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
        'mediable_type',
        'mediable_id',
    ];

    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }
}
