<?php

namespace Tests\Feature;

use App\Models\Eitaa\EitaaBot;
use App\Models\Eitaa\EitaaTarget;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EitaaBotModuleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleAndPermissionSeeder::class);
    }

    public function test_admin_can_create_a_bot_and_the_bots_page_renders_afterwards(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->from('/admin/eitaa/bots')
            ->post('/admin/eitaa/bots', [
                'name' => 'ربات تست',
                'token' => 'tok-123456',
                'rate_limit_per_minute' => 20,
            ])
            ->assertRedirect('/admin/eitaa/bots')
            ->assertSessionHas('success');

        $bot = EitaaBot::firstOrFail();
        $this->assertSame('ربات تست', $bot->name);
        $this->assertSame('tok-123456', $bot->accessToken());

        // Regression: the bots page must render once a bot exists. It calls
        // $bot->targets()->count(), which used to query the wrong foreign key
        // (eitaa_targets.eitaa_bot_id instead of bot_id) and 500'd.
        $this->actingAs($admin)
            ->get('/admin/eitaa/bots')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Eitaa/Bots')
                ->has('bots', 1)
                ->where('bots.0.name', 'ربات تست')
                ->where('bots.0.targets_count', 0));
    }

    public function test_admin_can_send_to_a_manually_typed_chat_id_from_the_targets_page(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        $bot = EitaaBot::create([
            'name' => 'ربات اصلی', 'rate_limit_per_minute' => 20,
            'status' => 'connected', 'is_active' => true, 'test_mode' => true,
        ]);
        $bot->setAccessToken('tok-manual');

        $this->actingAs($admin)
            ->from('/admin/eitaa/targets')
            ->post('/admin/eitaa/targets/manual-send', [
                'bot_id' => $bot->id,
                'chat_id' => '-1001234567890',
                'body' => 'سلام، این یک پیام تست است.',
            ])
            ->assertRedirect('/admin/eitaa/targets')
            ->assertSessionHas('success');

        // The typed id is registered as a target and the message is recorded
        // (simulated because the bot is in Test Mode).
        $target = EitaaTarget::where('bot_id', $bot->id)->where('chat_id', '-1001234567890')->firstOrFail();
        $this->assertSame('active', $target->status);
        $this->assertDatabaseHas('eitaa_messages', [
            'bot_id' => $bot->id, 'target_id' => $target->id,
            'chat_id' => '-1001234567890', 'status' => 'sent',
        ]);
    }
}