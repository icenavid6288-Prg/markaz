<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstagramAutomation extends Model
{
    protected $fillable = ['name', 'trigger_type', 'conditions', 'actions', 'enabled', 'priority', 'cooldown_seconds', 'last_run_at'];

    protected function casts(): array
    {
        return ['conditions' => 'array', 'actions' => 'array', 'enabled' => 'boolean', 'last_run_at' => 'datetime'];
    }

    public function runs(): HasMany
    {
        return $this->hasMany(InstagramAutomationRun::class, 'automation_id');
    }
}
