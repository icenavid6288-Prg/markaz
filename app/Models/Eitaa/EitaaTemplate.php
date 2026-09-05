<?php

namespace App\Models\Eitaa;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EitaaTemplate extends Model
{
    protected $table = 'eitaa_templates';

    protected $fillable = ['name', 'category', 'body', 'is_active', 'variables', 'usage_count'];

    protected $casts = ['is_active' => 'boolean', 'variables' => 'array', 'usage_count' => 'integer'];
}
