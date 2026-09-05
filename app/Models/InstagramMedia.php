<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstagramMedia extends Model
{
    protected $fillable = ['external_id', 'media_type', 'media_product_type', 'caption', 'permalink', 'media_url', 'published_at', 'status', 'insights', 'metadata'];

    protected function casts(): array
    {
        return ['published_at' => 'datetime', 'insights' => 'array', 'metadata' => 'array'];
    }
}
