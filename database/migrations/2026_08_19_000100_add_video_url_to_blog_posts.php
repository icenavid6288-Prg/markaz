<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Preview databases can be restored from an older snapshot. Keep the
        // migration safe if the column was added manually during recovery.
        if (Schema::hasTable('blog_posts') && ! Schema::hasColumn('blog_posts', 'video_url')) {
            Schema::table('blog_posts', function (Blueprint $table) {
                $table->string('video_url')->nullable()->after('cover_image');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('blog_posts') && Schema::hasColumn('blog_posts', 'video_url')) {
            Schema::table('blog_posts', function (Blueprint $table) {
                $table->dropColumn('video_url');
            });
        }
    }
};
