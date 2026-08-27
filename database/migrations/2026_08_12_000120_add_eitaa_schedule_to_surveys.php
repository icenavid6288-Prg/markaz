<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            $table->timestamp('eitaa_scheduled_at')->nullable()->after('ends_at');
            $table->timestamp('eitaa_published_at')->nullable()->after('eitaa_scheduled_at');

            $table->index(['status', 'eitaa_scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            $table->dropIndex(['status', 'eitaa_scheduled_at']);
            $table->dropColumn(['eitaa_scheduled_at', 'eitaa_published_at']);
        });
    }
};
