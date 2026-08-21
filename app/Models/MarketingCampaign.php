<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MarketingCampaign extends Model
{
    protected $fillable = [
        'name', 'channel', 'trigger', 'audience', 'subject', 'message', 'status',
        'scheduled_at', 'last_run_at', 'total_recipients', 'sent_count', 'failed_count', 'settings',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'last_run_at' => 'datetime',
            'settings' => 'array',
        ];
    }

    public function runs(): HasMany
    {
        return $this->hasMany(MarketingCampaignRun::class, 'campaign_id')->latest();
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(MarketingCampaignRecipient::class, 'campaign_id');
    }

    public function latestRun(): HasOne
    {
        return $this->hasOne(MarketingCampaignRun::class, 'campaign_id')->latestOfMany();
    }
}
