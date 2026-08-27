<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('template')->default('default');
            $table->json('sections')->nullable();
            $table->json('seo')->nullable();
            $table->string('status')->default('draft'); // draft|published
            $table->timestamps();
        });

        Schema::create('menus', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->default('header'); // header|footer|mobile
            $table->json('items')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('group')->default('general');
            $table->string('key');
            $table->json('value')->nullable();
            $table->boolean('is_public')->default(false);
            $table->unique(['group', 'key']);
            $table->timestamps();
        });

        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->string('url');
            $table->string('title')->nullable();
            $table->string('referrer')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('ip_hash')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('visited_at');
            $table->index(['visited_at', 'url']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('pages');
    }
};
