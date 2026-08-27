<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('digital'); // book|podcast|digital|physical
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('description')->nullable();
            $table->string('image')->nullable();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('price')->default(0);
            $table->unsignedBigInteger('discount_price')->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->string('file_path')->nullable();
            $table->string('author')->nullable();
            $table->unsignedSmallInteger('pages')->nullable();
            $table->string('publisher')->nullable();
            $table->string('isbn')->nullable();
            $table->unsignedInteger('audio_duration_seconds')->nullable();
            $table->string('preview_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('podcast_episodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('audio_url');
            $table->string('cover')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->longText('transcript')->nullable();
            $table->boolean('is_free')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('type')->default('percent'); // percent|fixed
            $table->unsignedBigInteger('value')->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->unsignedBigInteger('min_order')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('cart'); // cart|pending|paid|failed|cancelled|refunded
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->unsignedBigInteger('discount')->default(0);
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('total')->default(0);
            $table->string('payment_method')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('billing')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->morphs('purchasable');
            $table->string('title');
            $table->unsignedBigInteger('unit_price')->default(0);
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('total')->default(0);
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('gateway')->default('local'); // zarinpal|payping|idpay|zibal|cash|local
            $table->string('transaction_id')->nullable();
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('status')->default('pending'); // pending|success|failed|refunded
            $table->string('reference_id')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('wishlistable');
            $table->unique(['user_id', 'wishlistable_type', 'wishlistable_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('podcast_episodes');
        Schema::dropIfExists('products');
    }
};
