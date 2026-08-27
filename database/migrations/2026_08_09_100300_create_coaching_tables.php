<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coaching_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('scheduled_at');
            $table->unsignedTinyInteger('duration_minutes')->default(60);
            $table->string('status')->default('pending'); // pending|confirmed|completed|cancelled
            $table->string('meeting_link')->nullable();
            $table->unsignedBigInteger('price')->default(0);
            $table->text('report')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->timestamps();
        });

        Schema::create('coaching_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('coach_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('pending'); // pending|in_progress|achieved
            $table->date('due_date')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('coaching_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained('coaching_goals')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('coach_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status')->default('pending'); // pending|done|overdue
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('coaching_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('coaching_sessions')->cascadeOnDelete();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->longText('content');
            $table->text('next_steps')->nullable();
            $table->timestamps();
        });

        Schema::create('coach_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->constrained('users')->cascadeOnDelete();
            $table->date('available_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_booked')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_availability');
        Schema::dropIfExists('coaching_reports');
        Schema::dropIfExists('coaching_tasks');
        Schema::dropIfExists('coaching_goals');
        Schema::dropIfExists('coaching_sessions');
    }
};
