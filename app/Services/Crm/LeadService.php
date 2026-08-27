<?php

namespace App\Services\Crm;

use App\Models\Lead;
use App\Models\LeadActivity;
use App\Models\User;

class LeadService
{
    /**
     * Find the lead for a phone number, falling back to creating one so every
     * touchpoint (form, registration, onboarding, purchase) has a lead to work with.
     */
    public function findOrCreate(string $phone, string $name = ''): Lead
    {
        return Lead::query()->firstOrCreate(
            ['phone' => $phone],
            ['name' => $name ?: 'کاربر بدون نام', 'source' => 'website', 'status' => 'new'],
        );
    }

    public function record(Lead $lead, string $type, string $description, ?User $actor = null): void
    {
        LeadActivity::create([
            'lead_id' => $lead->id,
            'user_id' => $actor?->id,
            'type' => $type,
            'description' => $description,
        ]);

        $lead->update(['last_activity_at' => now()]);
    }

    /**
     * Link an existing lead to its registered user and log the touchpoint.
     * Once linked, the funnel moves forward and the two never split again.
     */
    public function linkToUser(Lead $lead, User $user, string $description, ?string $status = null): void
    {
        $changed = $lead->user_id !== $user->id;

        $lead->update([
            'user_id' => $user->id,
            'status' => $status ?? ($lead->status === 'customer' ? 'customer' : 'registered'),
            'last_activity_at' => now(),
        ]);

        if ($changed) {
            $this->record($lead, 'registration', $description, $user);
        }
    }

    /**
     * Mark a lead as a customer after a successful purchase and log what they bought.
     */
    public function markCustomer(User $user, string $detail): void
    {
        $lead = $this->findOrCreate((string) $user->phone, $user->name);

        $lead->update([
            'user_id' => $user->id,
            'status' => 'customer',
            'last_activity_at' => now(),
        ]);

        $this->record($lead, 'purchase', $detail, $user);
    }
}
