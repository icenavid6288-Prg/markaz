<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('instagram_media', function (Blueprint $table): void {
            if (! Schema::hasColumn('instagram_media', 'post_type')) {
                $table->string('post_type')->default('IMAGE')->after('external_id'); // IMAGE|VIDEO|CAROUSEL
            }
            if (! Schema::hasColumn('instagram_media', 'user_path')) {
                $table->string('user_path')->nullable()->after('media_url'); // local upload path on the public disk
            }
            if (! Schema::hasColumn('instagram_media', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('published_at');
            }
            if (! Schema::hasColumn('instagram_media', 'error')) {
                $table->text('error')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('instagram_media', function (Blueprint $table): void {
            $table->dropColumn(['post_type', 'user_path', 'scheduled_at', 'error']);
        });
    }
};
