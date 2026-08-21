<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->unsignedTinyInteger('reminder_stage')->default(0)->after('last_reminded_at');
            $table->index(['reminder_stage', 'last_reminded_at']);
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->dropIndex(['reminder_stage', 'last_reminded_at']);
            $table->dropColumn('reminder_stage');
        });
    }
};
