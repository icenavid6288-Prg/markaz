<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('channel')->default('sms'); // sms|email|in_app
            $table->string('trigger')->default('manual'); // manual|lead_created|course_purchased|inactive_user
            $table->string('audience')->default('all_users'); // all_users|leads|students|parents|customers|inactive_users
            $table->string('subject')->nullable();
            $table->text('message');
            $table->string('status')->default('draft'); // draft|active|paused|running
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('last_run_at')->nullable();
            $table->unsignedInteger('total_recipients')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->index(['status', 'trigger']);
            $table->index(['channel', 'audience']);
        });

        Schema::create('marketing_campaign_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('marketing_campaigns')->cascadeOnDelete();
            $table->string('status')->default('queued'); // queued|running|completed|failed
            $table->unsignedInteger('recipients_count')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_campaign_runs');
        Schema::dropIfExists('marketing_campaigns');
    }
};
