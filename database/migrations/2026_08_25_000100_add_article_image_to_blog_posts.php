<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('blog_posts') && ! Schema::hasColumn('blog_posts', 'article_image')) {
            Schema::table('blog_posts', function (Blueprint $table): void {
                $table->string('article_image')->nullable()->after('cover_image');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('blog_posts') && Schema::hasColumn('blog_posts', 'article_image')) {
            Schema::table('blog_posts', function (Blueprint $table): void {
                $table->dropColumn('article_image');
            });
        }
    }
};
