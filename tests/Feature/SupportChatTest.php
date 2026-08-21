<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\SupportConversation;
use App\Models\User;
use Database\Seeders\RoleAndPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SupportChatTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        (new RoleAndPermissionSeeder())->run();
    }

    public function test_guest_can_open_conversation_and_send_message_without_ai(): void
    {
        $response = $this->postJson(route('support-chat.conversations.store'), ['token' => 'guest-token-1'])
            ->assertOk();

        $id = $response->json('conversation.id');
        $this->assertSame('guest-token-1', $response->json('conversation.token'));
        $this->assertSame('open', $response->json('conversation.status'));

        $this->withHeaders(['X-Chat-Token' => 'guest-token-1'])
            ->postJson(route('support-chat.send', $id), ['body' => 'سلام، درباره دوره‌ها سؤال دارم.'])
            ->assertOk()
            ->assertJsonCount(1, 'messages')
            ->assertJsonPath('messages.0.sender', 'user');

        $this->assertDatabaseHas('support_messages', [
            'conversation_id' => $id,
            'sender' => 'user',
            'body' => 'سلام، درباره دوره‌ها سؤال دارم.',
        ]);
        $this->assertSame('open', SupportConversation::find($id)->status);
    }

    public function test_ai_answers_when_configured(): void
    {
        Setting::set('chat_ai_enabled', '1', 'chat', false);
        Setting::setSecret('chat_ai_api_key', 'sk-test', 'chat');

        Http::fake([
            '*/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => 'سلام! در خدمتیم. درباره کدام دوره سؤال دارید؟']]],
            ]),
        ]);

        $this->postJson(route('support-chat.conversations.store'), ['token' => 'ai-token'])
            ->assertOk();
        $id = SupportConversation::where('token', 'ai-token')->value('id');

        $this->withHeaders(['X-Chat-Token' => 'ai-token'])
            ->postJson(route('support-chat.send', $id), ['body' => 'چه دوره‌هایی دارید؟'])
            ->assertOk()
            ->assertJsonCount(2, 'messages')
            ->assertJsonPath('messages.1.sender', 'ai');

        $this->assertDatabaseHas('support_messages', [
            'conversation_id' => $id,
            'sender' => 'ai',
        ]);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/chat/completions'));
    }

    public function test_wrong_token_cannot_access_conversation(): void
    {
        $conversation = SupportConversation::create([
            'token' => 'real-token',
            'status' => 'open',
        ]);

        $this->postJson(route('support-chat.send', $conversation->id), ['body' => 'بدون توکن'])->assertNotFound();
        $this->getJson(route('support-chat.messages', $conversation->id))->assertNotFound();
        $this->withHeaders(['X-Chat-Token' => 'wrong-token'])
            ->postJson(route('support-chat.send', $conversation->id), ['body' => 'توکن اشتباه'])
            ->assertNotFound();
    }

    public function test_chat_is_unavailable_when_disabled(): void
    {
        Setting::set('chat_enabled', '0', 'chat', false);

        $this->postJson(route('support-chat.conversations.store'), ['token' => 'disabled-token'])->assertNotFound();
    }

    public function test_admin_can_list_conversations_and_reply(): void
    {
        $user = User::factory()->create();
        $conversation = SupportConversation::create([
            'user_id' => $user->id,
            'token' => 'admin-flow',
            'status' => 'open',
        ]);
        $conversation->messages()->create(['sender' => 'user', 'body' => 'سفارشم کجاست؟']);
        $conversation->update(['last_message_at' => now()]);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)->get(route('admin.support-chat.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/SupportChat')
                ->has('conversations', 1)
                ->where('conversations.0.user.name', $user->name));

        $this->actingAs($admin)
            ->postJson(route('admin.support-chat.reply', $conversation), ['body' => 'سفارش شما در حال ارسال است.'])
            ->assertOk()
            ->assertJsonPath('message.sender', 'admin');

        $this->assertDatabaseHas('support_messages', [
            'conversation_id' => $conversation->id,
            'sender' => 'admin',
            'body' => 'سفارش شما در حال ارسال است.',
        ]);
        $this->assertSame(1, $user->fresh()->unreadNotifications()->count());
    }

    public function test_admin_can_read_messages(): void
    {
        $conversation = SupportConversation::create(['token' => 'read-flow', 'status' => 'open']);
        $conversation->messages()->create(['sender' => 'user', 'body' => 'سلام']);
        $conversation->messages()->create(['sender' => 'ai', 'body' => 'در خدمتیم']);

        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->getJson(route('admin.support-chat.messages', $conversation))
            ->assertOk()
            ->assertJsonCount(2, 'messages');
    }

    public function test_chat_settings_can_be_saved_from_admin_panel(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $this->actingAs($admin)
            ->put(route('admin.settings.update'), [
                'settings' => [
                    'chat_enabled' => '1',
                    'chat_title' => 'پشتیبانی آنلاین',
                    'chat_ai_enabled' => '1',
                    'chat_ai_api_key' => 'sk-secret-42',
                    'chat_ai_base_url' => 'https://api.example.com/v1',
                    'chat_ai_model' => 'test-model',
                ],
            ])
            ->assertRedirect();

        $this->assertSame('پشتیبانی آنلاین', Setting::get('chat_title'));
        $this->assertSame('https://api.example.com/v1', Setting::get('chat_ai_base_url'));
        $this->assertSame('sk-secret-42', Setting::getSecret('chat_ai_api_key'));
        $this->assertSame('chat', Setting::where('key', 'chat_title')->value('group'));
    }
}
