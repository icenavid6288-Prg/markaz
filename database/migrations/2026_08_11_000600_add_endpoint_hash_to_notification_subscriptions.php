<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('notification_subscriptions')) {
            return;
        }

        Schema::table('notification_subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('notification_subscriptions', 'endpoint_hash')) {
                $table->string('endpoint_hash', 64)->nullable()->after('endpoint');
            }
        });

        // Backfill existing rows (hash computed in PHP so it works on every driver).
        foreach (DB::table('notification_subscriptions')->whereNull('endpoint_hash')->get(['id', 'endpoint']) as $row) {
            DB::table('notification_subscriptions')->where('id', $row->id)->update([
                'endpoint_hash' => hash('sha256', (string) $row->endpoint),
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('notification_subscriptions') && Schema::hasColumn('notification_subscriptions', 'endpoint_hash')) {
            Schema::table('notification_subscriptions', function (Blueprint $table) {
                $table->dropColumn('endpoint_hash');
            });
        }
    }
};
