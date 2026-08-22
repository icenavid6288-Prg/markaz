<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->timestamp('refunded_at')->nullable()->after('paid_at');
            $table->string('refund_reason')->nullable()->after('refunded_at');
        });

        Schema::table('coaching_sessions', function (Blueprint $table): void {
            $table->timestamp('cancelled_at')->nullable()->after('rating');
            $table->string('cancel_reason')->nullable()->after('cancelled_at');
        });

        Schema::table('coach_availability', function (Blueprint $table): void {
            $table->uuid('series_id')->nullable()->after('is_booked');
        });

        Schema::table('media', function (Blueprint $table): void {
            $table->foreignId('parent_id')->nullable()->after('id')->constrained('media')->nullOnDelete();
            $table->unsignedInteger('version')->default(1)->after('collection');
            $table->boolean('is_current')->default(true)->after('version');
            $table->foreignId('uploaded_by')->nullable()->after('is_current')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('uploaded_by');
            $table->dropColumn(['version', 'is_current']);
            $table->dropConstrainedForeignId('parent_id');
        });

        Schema::table('coach_availability', function (Blueprint $table): void {
            $table->dropColumn('series_id');
        });

        Schema::table('coaching_sessions', function (Blueprint $table): void {
            $table->dropColumn(['cancelled_at', 'cancel_reason']);
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn(['refunded_at', 'refund_reason']);
        });
    }
};
