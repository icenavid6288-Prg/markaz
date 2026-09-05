<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('instagram_accounts')) {
        Schema::create('instagram_accounts', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->default('اکانت اصلی اینستاگرام');
            $table->string('instagram_user_id')->unique();
            $table->string('username')->nullable();
            $table->string('profile_picture_url')->nullable();
            $table->text('access_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->json('scopes')->nullable();
            $table->string('status')->default('connected');
            $table->timestamp('last_connected_at')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            $table->text('last_error')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
        } // end instagram_accounts

        Schema::table('instagram_conversations', function (Blueprint $table): void {
            if (! Schema::hasColumn('instagram_conversations', 'instagram_account_id')) {
                $table->foreignId('instagram_account_id')->nullable()->after('lead_id')->constrained('instagram_accounts')->nullOnDelete();
            }
            if (! Schema::hasColumn('instagram_conversations', 'assigned_to')) {
                $table->foreignId('assigned_to')->nullable()->after('instagram_account_id')->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('instagram_conversations', 'unread_count')) {
                $table->unsignedInteger('unread_count')->default(0)->after('status');
            }
            if (! Schema::hasColumn('instagram_conversations', 'last_inbound_at')) {
                $table->timestamp('last_inbound_at')->nullable()->after('last_message_at');
            }
            if (! Schema::hasColumn('instagram_conversations', 'last_outbound_at')) {
                $table->timestamp('last_outbound_at')->nullable()->after('last_inbound_at');
            }
            if (! Schema::hasColumn('instagram_conversations', 'last_error')) {
                $table->text('last_error')->nullable()->after('last_outbound_at');
            }
            if (! Schema::hasColumn('instagram_conversations', 'tags')) {
                $table->json('tags')->nullable()->after('last_error');
            }
        });

        Schema::table('instagram_messages', function (Blueprint $table): void {
            foreach ([
                'sender_id' => fn (Blueprint $t) => $t->string('sender_id')->nullable()->after('external_parent_id'),
                'recipient_id' => fn (Blueprint $t) => $t->string('recipient_id')->nullable()->after('sender_id'),
                'media_url' => fn (Blueprint $t) => $t->text('media_url')->nullable()->after('recipient_id'),
                'media_type' => fn (Blueprint $t) => $t->string('media_type')->nullable()->after('media_url'),
                'error_code' => fn (Blueprint $t) => $t->string('error_code')->nullable()->after('status'),
                'error_message' => fn (Blueprint $t) => $t->text('error_message')->nullable()->after('error_code'),
                'provider_response' => fn (Blueprint $t) => $t->json('provider_response')->nullable()->after('error_message'),
                'delivered_at' => fn (Blueprint $t) => $t->timestamp('delivered_at')->nullable()->after('sent_at'),
                'read_at' => fn (Blueprint $t) => $t->timestamp('read_at')->nullable()->after('delivered_at'),
            ] as $column => $add) {
                if (! Schema::hasColumn('instagram_messages', $column)) {
                    $add($table);
                }
            }
        });

        if (! Schema::hasTable('instagram_templates')) {
        Schema::create('instagram_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('type')->default('dm');
            $table->text('body');
            $table->json('variables')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });
        } // end instagram_templates

        if (! Schema::hasTable('instagram_automations')) {
        Schema::create('instagram_automations', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('trigger_type')->default('message_received');
            $table->json('conditions')->nullable();
            $table->json('actions')->nullable();
            $table->boolean('enabled')->default(false);
            $table->unsignedInteger('priority')->default(100);
            $table->unsignedInteger('cooldown_seconds')->default(86400);
            $table->timestamp('last_run_at')->nullable();
            $table->timestamps();
        });
        } // end instagram_automations

        if (! Schema::hasTable('instagram_automation_runs')) {
        Schema::create('instagram_automation_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('automation_id')->nullable()->constrained('instagram_automations')->nullOnDelete();
            $table->foreignId('conversation_id')->nullable()->constrained('instagram_conversations')->nullOnDelete();
            $table->foreignId('message_id')->nullable()->constrained('instagram_messages')->nullOnDelete();
            $table->string('status')->default('queued');
            $table->json('input')->nullable();
            $table->json('output')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
        } // end instagram_automation_runs

        if (! Schema::hasTable('instagram_media')) {
        Schema::create('instagram_media', function (Blueprint $table): void {
            $table->id();
            $table->string('external_id')->unique();
            $table->string('media_type')->nullable();
            $table->string('media_product_type')->nullable();
            $table->text('caption')->nullable();
            $table->string('permalink')->nullable();
            $table->text('media_url')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->string('status')->default('published');
            $table->json('insights')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
        });
        } // end instagram_media
    }

    public function down(): void
    {
        Schema::table('instagram_messages', function (Blueprint $table): void {
            $table->dropColumn(['sender_id', 'recipient_id', 'media_url', 'media_type', 'error_code', 'error_message', 'provider_response', 'delivered_at', 'read_at']);
        });
        Schema::table('instagram_conversations', function (Blueprint $table): void {
            $table->dropForeign(['instagram_account_id']);
            $table->dropForeign(['assigned_to']);
            $table->dropColumn(['instagram_account_id', 'assigned_to', 'unread_count', 'last_inbound_at', 'last_outbound_at', 'last_error', 'tags']);
        });

        Schema::dropIfExists('instagram_automation_runs');
        Schema::dropIfExists('instagram_automations');
        Schema::dropIfExists('instagram_templates');
        Schema::dropIfExists('instagram_media');
        Schema::dropIfExists('instagram_accounts');
    }
};
