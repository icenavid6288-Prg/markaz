<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('grade')->nullable();
            $table->string('school')->nullable();
            $table->date('birth_date')->nullable();
            $table->json('talents')->nullable();
            $table->json('interests')->nullable();
            $table->timestamps();
        });

        Schema::create('parents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('relation')->nullable();
            $table->timestamps();
        });

        Schema::create('instructors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('specialty')->nullable();
            $table->text('bio')->nullable();
            $table->unsignedTinyInteger('experience_years')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });

        Schema::create('coaches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('specialty')->nullable();
            $table->text('bio')->nullable();
            $table->unsignedTinyInteger('experience_years')->default(0);
            $table->unsignedBigInteger('hourly_rate')->nullable();
            $table->decimal('rating', 3, 2)->default(0);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_available')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coaches');
        Schema::dropIfExists('instructors');
        Schema::dropIfExists('parents');
        Schema::dropIfExists('students');
    }
};
