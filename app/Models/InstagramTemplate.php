<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstagramTemplate extends Model
{
    protected $fillable = ['name', 'type', 'body', 'variables', 'enabled'];

    protected function casts(): array
    {
        return ['variables' => 'array', 'enabled' => 'boolean'];
    }
}
