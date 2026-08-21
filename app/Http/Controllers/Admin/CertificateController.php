<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CertificateController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $query = Certificate::query()->with(['user:id,name,email', 'course:id,title']);

        if ($search !== '') {
            $query->where(function ($nested) use ($search) {
                $nested->where('certificate_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('course', fn ($course) => $course->where('title', 'like', "%{$search}%"));
            });
        }

        return Inertia::render('Admin/Certificates/Index', [
            'certificates' => $query->latest('issued_at')->paginate(15)->withQueryString()->through(fn (Certificate $certificate) => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'issued_at' => $certificate->issued_at?->format('Y/m/d'),
                'user' => $certificate->user ? ['id' => $certificate->user->id, 'name' => $certificate->user->name, 'email' => $certificate->user->email] : null,
                'course' => $certificate->course ? ['id' => $certificate->course->id, 'title' => $certificate->course->title] : null,
                'url' => route('certificates.show', $certificate),
                'download_url' => route('certificates.download', $certificate),
            ]),
            'filters' => ['search' => $search],
        ]);
    }
}
