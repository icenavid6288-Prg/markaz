<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('type')->default('webinar');
            $table->text('summary')->nullable();
            $table->longText('description')->nullable();
            $table->string('poster')->nullable();
            $table->string('video_url')->nullable();
            $table->string('live_url')->nullable();
            $table->string('video_path')->nullable();
            $table->unsignedBigInteger('price')->default(0);
            $table->unsignedBigInteger('discount_price')->nullable();
            $table->dateTime('event_date')->nullable();
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->string('location')->nullable();
            $table->string('speaker')->nullable();
            $table->string('status')->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->json('seo')->nullable();
            $table->timestamps();
            $table->index(['status', 'event_date']);
        });
    }

    public function down(): void { Schema::dropIfExists('events'); }
};
