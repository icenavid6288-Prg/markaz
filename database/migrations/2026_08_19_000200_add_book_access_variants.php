<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table): void {
                if (! Schema::hasColumn('products', 'preview_file_path')) {
                    $table->string('preview_file_path')->nullable()->after('file_path');
                }
                if (! Schema::hasColumn('products', 'download_price')) {
                    $table->unsignedBigInteger('download_price')->nullable()->after('discount_price');
                }
                if (! Schema::hasColumn('products', 'download_discount_price')) {
                    $table->unsignedBigInteger('download_discount_price')->nullable()->after('download_price');
                }
            });
        }

        if (Schema::hasTable('order_items') && ! Schema::hasColumn('order_items', 'purchase_mode')) {
            Schema::table('order_items', function (Blueprint $table): void {
                // Existing product purchases were downloads before access variants existed.
                $table->string('purchase_mode')->default('download')->after('total');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('order_items') && Schema::hasColumn('order_items', 'purchase_mode')) {
            Schema::table('order_items', function (Blueprint $table): void {
                $table->dropColumn('purchase_mode');
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table): void {
                foreach (['preview_file_path', 'download_discount_price', 'download_price'] as $column) {
                    if (Schema::hasColumn('products', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
