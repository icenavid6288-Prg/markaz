<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('share_token', 48)->unique();
            $table->text('description')->nullable();
            $table->text('welcome_message')->nullable();
            $table->text('completion_message')->nullable();
            $table->string('status')->default('draft'); // draft|published|closed
            $table->json('settings')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'starts_at', 'ends_at']);
        });

        Schema::create('survey_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('single'); // single|multiple|text|textarea|number|rating|yes_no
            $table->text('title');
            $table->text('description')->nullable();
            $table->json('options')->nullable();
            $table->json('settings')->nullable();
            $table->boolean('is_required')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['survey_id', 'sort_order']);
        });

        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_token', 64)->unique();
            $table->string('status')->default('in_progress'); // in_progress|registered|completed|abandoned
            $table->json('answers')->nullable();
            $table->unsignedInteger('answered_count')->default(0);
            $table->timestamp('registered_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('ip_hash', 64)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['survey_id', 'status']);
            $table->index(['survey_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('survey_questions');
        Schema::dropIfExists('surveys');
    }
};
