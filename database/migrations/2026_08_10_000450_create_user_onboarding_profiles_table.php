<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_onboarding_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('audience')->default('student');
            $table->unsignedTinyInteger('child_age')->nullable();
            $table->string('grade')->nullable();
            $table->string('primary_goal')->nullable();
            $table->string('current_need')->nullable();
            $table->json('interests')->nullable();
            $table->json('answers')->nullable();
            $table->json('recommendation_snapshot')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['audience', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_onboarding_profiles');
    }
};
