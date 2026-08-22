<?php

namespace App\Support;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class BulkSmsTables
{
    public static function ensure(): void
    {
        if (! Schema::hasTable('bulk_sms_runs')) {
            Schema::create('bulk_sms_runs', function (Blueprint $table): void {
                $table->id();
                $table->string('message', 500);
                $table->unsignedInteger('recipients_count')->default(0);
                $table->unsignedInteger('sent_count')->default(0);
                $table->unsignedInteger('failed_count')->default(0);
                $table->string('status')->default('running');
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('bulk_sms_run_recipients')) {
            Schema::create('bulk_sms_run_recipients', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('run_id')->constrained('bulk_sms_runs')->cascadeOnDelete();
                $table->string('name')->nullable();
                $table->string('phone', 20);
                $table->string('status')->default('queued');
                $table->text('error')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
                $table->index(['run_id', 'status']);
                $table->index(['run_id', 'phone']);
            });
        }
    }
}
