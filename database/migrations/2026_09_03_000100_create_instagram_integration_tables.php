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
        // Idempotent: this migration may have partially run before (columns
        // already present on a live database), so guard every operation.
        Schema::table('leads', function (Blueprint $table): void {
            if (! Schema::hasColumn('leads', 'instagram_user_id')) {
                $table->string('instagram_user_id')->nullable()->after('source');
            }
            if (! Schema::hasColumn('leads', 'instagram_username')) {
                $table->string('instagram_username')->nullable()->after('instagram_user_id');
            }
            if (! Schema::hasColumn('leads', 'attribution')) {
                $table->json('attribution')->nullable()->after('tags');
            }
            if (! $this->hasIndex('leads', 'leads_instagram_user_id_index')) {
                $table->index('instagram_user_id');
            }
        });

        Schema::table('page_views', function (Blueprint $table): void {
            foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'attribution_source'] as $column) {
                if (! Schema::hasColumn('page_views', $column)) {
                    $table->string($column)->nullable();
                }
            }
            if (! $this->hasIndex('page_views', 'page_views_attribution_source_visited_at_index')) {
                $table->index(['attribution_source', 'visited_at']);
            }
        });

        if (! Schema::hasTable('instagram_conversations')) {
            Schema::create('instagram_conversations', function (Blueprint $table): void {
                $table->id();
                $table->string('external_id')->unique();
                $table->string('channel')->default('dm'); // dm|comment
                $table->string('participant_id');
                $table->string('participant_username')->nullable();
                $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
                $table->string('status')->default('open'); // open|closed
                $table->timestamp('last_message_at')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['channel', 'status', 'last_message_at']);
                $table->index('participant_id');
            });
        }

        if (! Schema::hasTable('instagram_messages')) {
            Schema::create('instagram_messages', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('conversation_id')->constrained('instagram_conversations')->cascadeOnDelete();
                $table->string('external_id')->nullable()->unique();
                $table->string('direction')->default('inbound'); // inbound|outbound
                $table->string('message_type')->default('dm'); // dm|comment
                $table->text('body')->nullable();
                $table->string('external_parent_id')->nullable();
                $table->string('status')->default('received'); // received|sent|failed
                $table->json('payload')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();

                $table->index(['conversation_id', 'created_at']);
                $table->index(['message_type', 'status']);
            });
        }

        if (! Schema::hasTable('instagram_webhook_events')) {
            Schema::create('instagram_webhook_events', function (Blueprint $table): void {
                $table->id();
                $table->string('external_id')->unique();
                $table->string('object')->nullable();
                $table->json('payload');
                $table->timestamp('processed_at')->nullable();
                $table->text('error')->nullable();
                $table->timestamps();
            });
        }

        // findOrCreate is idempotent; keep the admin grant re-runnable.
        $permissions = collect(['view instagram', 'create instagram', 'update instagram', 'delete instagram', 'reply instagram'])
            ->map(fn (string $name) => Permission::findOrCreate($name, 'web'));
        Role::where('name', 'admin')->where('guard_name', 'web')->first()?->givePermissionTo($permissions->all());
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function hasIndex(string $table, string $index): bool
    {
        return collect(Schema::getIndexes($table))->firstWhere('name', $index) !== null;
    }

    public function down(): void
    {
        $permissions = Permission::whereIn('name', ['view instagram', 'create instagram', 'update instagram', 'delete instagram', 'reply instagram'])
            ->where('guard_name', 'web')
            ->get();
        Role::where('name', 'admin')->where('guard_name', 'web')->first()?->revokePermissionTo($permissions->all());
        $permissions->each->delete();

        Schema::dropIfExists('instagram_webhook_events');
        Schema::dropIfExists('instagram_messages');
        Schema::dropIfExists('instagram_conversations');

        Schema::table('page_views', function (Blueprint $table): void {
            $table->dropIndex(['attribution_source', 'visited_at']);
            $table->dropColumn(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'attribution_source']);
        });
        Schema::table('leads', function (Blueprint $table): void {
            $table->dropIndex(['instagram_user_id']);
            $table->dropColumn(['instagram_user_id', 'instagram_username', 'attribution']);
        });
    }
};
