<?php

namespace App\Models;

use App\Models\Course;
use App\Services\CertificateService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'status',
        'progress_percent',
        'enrolled_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Reaching completion issues the course certificate automatically —
        // regardless of which path completed the course (video progress,
        // passing a quiz, or submitting the final assignment).
        static::updated(function (Enrollment $enrollment): void {
            if ($enrollment->wasChanged('status') && $enrollment->status === 'completed') {
                app(CertificateService::class)->issueIfEligible($enrollment);
            }
        });

        static::created(function (Enrollment $enrollment): void {
            Course::query()->whereKey($enrollment->course_id)->increment('students_count');

            if ($enrollment->status === 'completed') {
                app(CertificateService::class)->issueIfEligible($enrollment);
            }
        });

        static::deleted(function (Enrollment $enrollment): void {
            Course::query()->whereKey($enrollment->course_id)->where('students_count', '>', 0)->decrement('students_count');
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
