<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->timestamp('reservation_expires_at')->nullable()->after('paid_at');
            $table->index(['status', 'reservation_expires_at']);
        });

        Schema::create('marketing_consents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->boolean('sms')->default(false);
            $table->boolean('email_marketing')->default(false);
            $table->boolean('in_app')->default(true);
            $table->timestamp('consented_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index(['phone', 'revoked_at']);
            $table->index(['email', 'revoked_at']);
            $table->unique('user_id');
        });

        Schema::create('notification_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');
            // MySQL/MariaDB cannot index TEXT columns, so uniqueness is tracked
            // through a sha256 hash of the endpoint (see controller).
            $table->string('endpoint_hash', 64);
            $table->string('public_key')->nullable();
            $table->string('auth_token')->nullable();
            $table->string('content_encoding')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'endpoint_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_subscriptions');
        Schema::dropIfExists('marketing_consents');

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropIndex(['status', 'reservation_expires_at']);
            $table->dropColumn('reservation_expires_at');
        });
    }
};
