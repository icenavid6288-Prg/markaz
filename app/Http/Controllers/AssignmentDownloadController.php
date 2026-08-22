<?php

namespace App\Http\Controllers;

use App\Models\Submission;
use App\Support\SafeStoragePath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AssignmentDownloadController extends Controller
{
    public function __invoke(Request $request, Submission $submission): StreamedResponse
    {
        $user = $request->user();
        $isOwner = $submission->user_id === $user?->id;
        $canManage = (bool) ($user?->can('manage all') || $user?->can('view lessons') || $user?->can('update lessons'));
        abort_unless($isOwner || $canManage, 403);

        $path = SafeStoragePath::normalize($submission->attachment);
        abort_unless($path, 404);

        $disk = Storage::disk('local');
        if (! $disk->exists($path) && (bool) config('filesystems.allow_legacy_public_downloads', false)) {
            $disk = Storage::disk('public');
        }

        abort_unless($disk->exists($path), 404);

        return $disk->download($path, basename($path), [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
