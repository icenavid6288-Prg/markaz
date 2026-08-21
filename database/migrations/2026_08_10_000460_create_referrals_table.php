<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('referral_code', 12)->nullable()->unique()->after('phone');
            $table->foreignId('referred_by')->nullable()->constrained('users')->nullOnDelete()->after('referral_code');
        });

        Schema::create('referrals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('referrer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referred_id')->constrained('users')->cascadeOnDelete();
            $table->string('coupon_code')->nullable();
            $table->timestamp('rewarded_at')->nullable();
            $table->timestamps();
            $table->unique(['referrer_id', 'referred_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referrals');
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['referral_code']);
            $table->dropColumn(['referral_code', 'referred_by']);
        });
    }
};
