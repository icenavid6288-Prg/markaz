<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketing_campaign_recipients', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->after('campaign_id')->constrained()->nullOnDelete();
            $table->index(['campaign_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('marketing_campaign_recipients', function (Blueprint $table): void {
            $table->dropIndex(['campaign_id', 'user_id']);
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
