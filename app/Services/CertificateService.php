<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\Enrollment;
use Illuminate\Support\Str;

class CertificateService
{
    /**
     * Issue a certificate for an enrollment that just reached completion.
     * Returns null when the course does not allow certificates, the course is
     * not actually complete, or a certificate already exists for this pair —
     * so repeated completion events never create duplicates.
     */
    public function issueIfEligible(Enrollment $enrollment): ?Certificate
    {
        $course = $enrollment->course;

        if (! $course || ! $course->certificate_enabled) {
            return null;
        }

        $complete = $enrollment->status === 'completed' || (int) $enrollment->progress_percent >= 100;
        if (! $complete) {
            return null;
        }

        if (Certificate::query()->where('user_id', $enrollment->user_id)->where('course_id', $enrollment->course_id)->exists()) {
            return null;
        }

        $certificate = Certificate::create([
            'user_id' => $enrollment->user_id,
            'course_id' => $enrollment->course_id,
            'certificate_number' => $this->uniqueNumber(),
            'issued_at' => now(),
        ]);

        $this->storePdf($certificate);

        return $certificate;
    }

    /**
     * Generate and persist the PDF. A failure here must never block the
     * certificate issuance itself — the file is regenerated lazily on first
     * download when file_path is missing.
     */
    private function storePdf(Certificate $certificate): void
    {
        try {
            $path = app(CertificatePdfService::class)->store($certificate);
            $certificate->update(['file_path' => $path]);
        } catch (\Throwable $exception) {
            report($exception);
        }
    }

    private function uniqueNumber(): string
    {
        do {
            $number = 'SAR-'.now()->format('Y').'-'.Str::upper(Str::random(6));
        } while (Certificate::query()->where('certificate_number', $number)->exists());

        return $number;
    }
}
