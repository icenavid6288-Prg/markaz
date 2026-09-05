<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->boolean('is_in_person')->default(false);
            $table->string('location')->nullable();
            $table->json('schedule')->nullable();
            $table->unsignedInteger('max_students')->nullable();
            $table->longText('in_person_description')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'is_in_person',
                'location',
                'schedule',
                'max_students',
                'in_person_description',
            ]);
        });
    }
};
