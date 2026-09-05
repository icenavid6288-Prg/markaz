<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        // Idempotent: this migration may have partially run before on a live
        // database, so guard every table creation individually.

        // Central bot registry. Tokens are stored encrypted via Setting::setSecret pattern
        // (see EitaaBot::setAccessToken) and never rendered back to the UI.
        if (! Schema::hasTable('eitaa_bots')) {
            Schema::create('eitaa_bots', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('token_credential_id')->nullable(); // reference into settings (encrypted)
                $table->text('access_token_encrypted')->nullable();
                $table->string('username')->nullable();
                $table->string('bot_id')->nullable();
                $table->string('status')->default('disconnected'); // connected|disconnected|error
                $table->boolean('is_active')->default(false);
                $table->boolean('test_mode')->default(true); // blocks real API calls until disabled by an admin
                $table->unsignedInteger('rate_limit_per_minute')->default(20);
                $table->timestamp('last_connected_at')->nullable();
                $table->timestamp('last_message_at')->nullable();
                $table->text('last_error')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index('status');
            });
        }

        // Outbound-capable chat targets: official API supports channels/groups only.
        if (! Schema::hasTable('eitaa_targets')) {
            Schema::create('eitaa_targets', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('bot_id')->nullable()->constrained('eitaa_bots')->nullOnDelete();
                $table->string('chat_id'); // numeric channel/group id or @username
                $table->string('title')->nullable();
                $table->string('type')->default('channel'); // channel|group
                $table->string('status')->default('active'); // active|paused|blocked
                $table->string('opt_in_status')->default('opted_in'); // opted_in|unknown|opted_out|blocked
                $table->unsignedInteger('member_count')->nullable();
                $table->json('tags')->nullable();
                $table->timestamp('last_send_at')->nullable();
                $table->timestamp('last_error_at')->nullable();
                $table->text('last_error')->nullable();
                $table->timestamps();

                $table->unique(['bot_id', 'chat_id']);
                $table->index('status');
            });
        }

        if (! Schema::hasTable('eitaa_templates')) {
            Schema::create('eitaa_templates', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('category')->default('general'); // welcome|course|price|followup|thankyou|general
                $table->text('body');
                $table->boolean('is_active')->default(true);
                $table->json('variables')->nullable();
                $table->unsignedInteger('usage_count')->default(0);
                $table->timestamps();

                $table->index('category');
            });
        }

        if (! Schema::hasTable('eitaa_campaigns')) {
            Schema::create('eitaa_campaigns', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('bot_id')->constrained('eitaa_bots')->cascadeOnDelete();
                $table->string('name');
                $table->text('description')->nullable();
                $table->text('message_body');
                $table->string('status')->default('draft'); // draft|scheduled|running|paused|completed|failed|cancelled
                $table->string('audience_type')->default('all'); // all|tags|targets
                $table->json('audience_filters')->nullable(); // {tags:[], target_ids:[], opt_in:'opted_in'}
                $table->foreignId('template_id')->nullable()->constrained('eitaa_templates')->nullOnDelete();
                $table->timestamp('scheduled_at')->nullable();
                $table->unsignedInteger('rate_limit_per_minute')->default(20);
                $table->unsignedInteger('max_retries')->default(3);
                $table->unsignedInteger('total_targets')->default(0);
                $table->unsignedInteger('sent_count')->default(0);
                $table->unsignedInteger('failed_count')->default(0);
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();

                $table->index(['status', 'scheduled_at']);
            });
        }

        if (! Schema::hasTable('eitaa_campaign_targets')) {
            Schema::create('eitaa_campaign_targets', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('campaign_id')->constrained('eitaa_campaigns')->cascadeOnDelete();
                $table->foreignId('target_id')->constrained('eitaa_targets')->cascadeOnDelete();
                $table->string('status')->default('pending'); // pending|queued|sent|failed|skipped
                $table->string('message_id')->nullable();
                $table->unsignedInteger('attempts')->default(0);
                $table->text('error')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();

                $table->unique(['campaign_id', 'target_id']);
                $table->index('status');
            });
        }

        // Unified outbound + inbound message log. Inbound rows (direction=in) only
        // appear once Eitaa ships an official receive API; schema is ready today.
        if (! Schema::hasTable('eitaa_messages')) {
            Schema::create('eitaa_messages', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('bot_id')->constrained('eitaa_bots')->cascadeOnDelete();
                $table->foreignId('target_id')->nullable()->constrained('eitaa_targets')->nullOnDelete();
                $table->foreignId('campaign_id')->nullable()->constrained('eitaa_campaigns')->nullOnDelete();
                $table->string('direction')->default('out'); // out|in
                $table->string('chat_id')->nullable();
                $table->string('external_message_id')->nullable();
                $table->string('message_type')->default('text'); // text|file
                $table->text('body')->nullable();
                $table->string('file_path')->nullable();
                $table->string('status')->default('queued'); // queued|sent|failed|received|cancelled
                $table->unsignedInteger('attempts')->default(0);
                $table->unsignedInteger('priority')->default(100);
                $table->unsignedInteger('available_at')->nullable(); // unix ts, for rate-limit spacing
                $table->string('error_category')->nullable(); // auth|rate_limit|network|invalid|user_unavailable|permission|unknown
                $table->text('error')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();

                $table->unique(['bot_id', 'external_message_id']);
                $table->index(['status', 'available_at']);
                $table->index(['campaign_id', 'status']);
                $table->index('direction');
            });
        }

        if (! Schema::hasTable('eitaa_keywords')) {
            Schema::create('eitaa_keywords', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('bot_id')->constrained('eitaa_bots')->cascadeOnDelete();
                $table->string('keyword');
                $table->string('match_type')->default('contains'); // exact|contains|starts_with|regex
                $table->text('response')->nullable();
                $table->unsignedInteger('priority')->default(100);
                $table->boolean('stop_processing')->default(false);
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('hit_count')->default(0);
                $table->timestamps();

                $table->index(['bot_id', 'is_active', 'priority']);
            });
        }

        if (! Schema::hasTable('eitaa_auto_replies')) {
            Schema::create('eitaa_auto_replies', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('bot_id')->constrained('eitaa_bots')->cascadeOnDelete();
                $table->string('name');
                $table->string('trigger_type')->default('keyword'); // keyword|intent|greeting
                $table->string('keyword')->nullable();
                $table->text('response')->nullable();
                $table->unsignedInteger('priority')->default(100);
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('hit_count')->default(0);
                $table->timestamps();

                $table->index(['bot_id', 'is_active']);
            });
        }

        if (! Schema::hasTable('eitaa_conversations')) {
            Schema::create('eitaa_conversations', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('bot_id')->constrained('eitaa_bots')->cascadeOnDelete();
                $table->foreignId('target_id')->nullable()->constrained('eitaa_targets')->nullOnDelete();
                $table->string('external_chat_id')->unique();
                $table->string('title')->nullable();
                $table->string('mode')->default('bot'); // bot|human|closed
                $table->unsignedInteger('unread_count')->default(0);
                $table->timestamp('last_message_at')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['bot_id', 'mode']);
            });
        }

        // Reserved for the day Eitaa publishes an official receive API. The webhook
        // endpoint validates and stores raw events here instead of faking flows.
        if (! Schema::hasTable('eitaa_inbound_events')) {
            Schema::create('eitaa_inbound_events', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('bot_id')->constrained('eitaa_bots')->cascadeOnDelete();
                $table->string('external_update_id')->unique();
                $table->string('object')->default('eitaa');
                $table->json('payload');
                $table->string('status')->default('received'); // received|processed|ignored|error
                $table->text('error')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();

                $table->index(['bot_id', 'status']);
            });
        }

        if (! Schema::hasTable('eitaa_logs')) {
            Schema::create('eitaa_logs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('bot_id')->nullable()->constrained('eitaa_bots')->nullOnDelete();
                $table->unsignedBigInteger('admin_id')->nullable();
                $table->string('event')->index(); // bot.connected, campaign.dispatched, message.failed...
                $table->string('level')->default('info'); // info|warning|error
                $table->text('message')->nullable();
                $table->json('context')->nullable(); // never contains tokens/secrets
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();

                $table->index(['bot_id', 'event']);
            });
        }

        if (! Schema::hasTable('eitaa_notifications')) {
            Schema::create('eitaa_notifications', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('bot_id')->nullable()->constrained('eitaa_bots')->nullOnDelete();
                $table->string('type'); // lead|support|error|campaign|api
                $table->string('title');
                $table->text('body')->nullable();
                $table->string('level')->default('info');
                $table->timestamp('read_at')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['type', 'read_at']);
            });
        }

        if (! Schema::hasTable('eitaa_ai_settings')) {
            Schema::create('eitaa_ai_settings', function (Blueprint $table): void {
                $table->id();
                $table->boolean('enabled')->default(false);
                $table->string('provider')->default('openai'); // openai|custom
                $table->string('api_key_credential_id')->nullable();
                $table->text('api_key_encrypted')->nullable();
                $table->string('base_url')->nullable();
                $table->string('model')->default('gpt-4o-mini');
                $table->decimal('temperature', 3, 2)->default(0.40);
                $table->unsignedInteger('max_tokens')->default(800);
                $table->text('system_prompt')->nullable();
                $table->timestamps();
            });
        }

        // Module permissions aligned with the panel's spatie-based RBAC.
        $permissions = collect(['view eitaa', 'create eitaa', 'update eitaa', 'delete eitaa'])
            ->map(fn (string $name) => Permission::findOrCreate($name, 'web'));
        Role::where('name', 'admin')->where('guard_name', 'web')->first()?->givePermissionTo($permissions->all());
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $permissions = Permission::whereIn('name', ['view eitaa', 'create eitaa', 'update eitaa', 'delete eitaa'])
            ->where('guard_name', 'web')
            ->get();
        Role::where('name', 'admin')->where('guard_name', 'web')->first()?->revokePermissionTo($permissions->all());
        $permissions->each->delete();

        foreach ([
            'eitaa_notifications', 'eitaa_logs', 'eitaa_inbound_events', 'eitaa_conversations',
            'eitaa_auto_replies', 'eitaa_keywords', 'eitaa_messages', 'eitaa_campaign_targets',
            'eitaa_campaigns', 'eitaa_templates', 'eitaa_targets', 'eitaa_bots', 'eitaa_ai_settings',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
