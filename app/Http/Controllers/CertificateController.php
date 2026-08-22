<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Services\CertificatePdfService;
use App\Support\FaDate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    public function index(Request $request): Response
    {
        $certificates = Certificate::query()
            ->with('course:id,title,slug')
            ->where('user_id', $request->user()->id)
            ->latest('issued_at')
            ->get()
            ->map(fn (Certificate $certificate) => $this->present($certificate))
            ->values();

        return Inertia::render('Dashboard/Certificates', ['certificates' => $certificates]);
    }

    /**
     * The printable certificate page — reachable by the owner and by anyone
     * with certificate management permissions (e.g. admins from the panel).
     */
    public function show(Request $request, Certificate $certificate): Response
    {
        $user = $request->user();
        $isOwner = $certificate->user_id === $user?->id;
        $canManage = (bool) ($user?->can('manage all') || $user?->can('view certificates'));
        abort_unless($isOwner || $canManage, 403);

        return Inertia::render('Dashboard/CertificateShow', [
            'certificate' => $this->present($certificate, true),
        ]);
    }

    /** Public verification by the unique certificate number. */
    public function verify(Certificate $certificate): Response
    {
        return Inertia::render('Verify', [
            'certificate' => $this->present($certificate, true),
        ]);
    }

    /**
     * Download the real PDF. The file is generated at issuance; when it is
     * missing (legacy records, failed generation) it is rebuilt on the fly.
     */
    public function download(Request $request, Certificate $certificate): SymfonyResponse
    {
        $user = $request->user();
        $isOwner = $certificate->user_id === $user?->id;
        $canManage = (bool) ($user?->can('manage all') || $user?->can('view certificates'));
        abort_unless($isOwner || $canManage, 403);

        $path = $certificate->file_path;
        $disk = Storage::disk('local');
        if (! $path || ! $disk->exists($path)) {
            if ($path && Storage::disk('public')->exists($path)) {
                $disk = Storage::disk('public');
            } else {
                $path = app(CertificatePdfService::class)->store($certificate);
                $certificate->update(['file_path' => $path]);
            }
        }

        return $disk->download($path, 'Certificate-'.$certificate->certificate_number.'.pdf');
    }

    /** @return array<string, mixed> */
    private function present(Certificate $certificate, bool $withCourse = false): array
    {
        $data = [
            'id' => $certificate->id,
            'certificate_number' => $certificate->certificate_number,
            'issued_at' => $certificate->issued_at?->format('Y/m/d'),
            'issued_at_text' => $certificate->issued_at ? FaDate::format($certificate->issued_at) : null,
            'user' => ['id' => $certificate->user?->id, 'name' => $certificate->user?->name],
            'url' => route('certificates.show', $certificate),
            'download_url' => route('certificates.download', $certificate),
            'verify_url' => route('certificates.verify', $certificate->certificate_number),
        ];

        if ($withCourse && $certificate->course) {
            $data['course'] = [
                'id' => $certificate->course->id,
                'title' => $certificate->course->title,
                'slug' => $certificate->course->slug,
                'duration_minutes' => $certificate->course->duration_minutes,
            ];
        }

        return $data;
    }
}
