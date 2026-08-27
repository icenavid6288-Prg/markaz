<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class Tag extends Model
{
    protected $fillable = ['name', 'slug'];

    public function blogPosts(): MorphToMany
    {
        return $this->morphedByMany(BlogPost::class, 'taggable');
    }

    public function courses(): MorphToMany
    {
        return $this->morphedByMany(Course::class, 'taggable');
    }
}
