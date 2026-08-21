<?php

namespace App\Services;

use App\Models\Certificate;
use App\Support\FaDate;
use Illuminate\Support\Facades\Storage;

class CertificatePdfService
{
    /**
     * Renders the certificate blade into a real PDF (mPDF) and stores it on
     * the public disk. Returns the stored relative path (e.g. certificates/...).
     */
    public function store(Certificate $certificate): string
    {
        $path = 'certificates/'.$certificate->certificate_number.'.pdf';
        Storage::disk('public')->put($path, $this->generate($certificate));

        return $path;
    }

    public function generate(Certificate $certificate): string
    {
        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4-L',
            'margin_left' => 14,
            'margin_right' => 14,
            'margin_top' => 14,
            'margin_bottom' => 14,
            'fontDir' => [public_path('fonts')],
            'fontdata' => [
                'vazirmatn' => [
                    'R' => 'Vazirmatn-Regular.ttf',
                    'B' => 'Vazirmatn-Bold.ttf',
                    'I' => 'Vazirmatn-Regular.ttf',
                    'BI' => 'Vazirmatn-Bold.ttf',
                    'useOTL' => 0xFF,
                    'useKashida' => 75,
                ],
            ],
            'default_font' => 'vazirmatn',
            'tempDir' => $this->tempDir(),
        ]);

        $mpdf->WriteHTML(view('certificates.pdf', [
            'name' => $certificate->user?->name ?? 'هنرجوی گرامی',
            'course' => $certificate->course?->title ?? '',
            'courseHours' => $certificate->course && $certificate->course->duration_minutes > 0
                ? (int) round($certificate->course->duration_minutes / 60)
                : 0,
            'issuedAt' => $certificate->issued_at ? FaDate::format($certificate->issued_at) : '',
            'number' => $certificate->certificate_number,
            'verifyUrl' => route('certificates.verify', $certificate->certificate_number),
        ])->render());

        return $mpdf->Output('', \Mpdf\Output\Destination::STRING_RETURN);
    }

    private function tempDir(): string
    {
        $dir = storage_path('framework/cache/mpdf');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        return $dir;
    }
}
