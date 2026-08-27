<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class AppIconController extends Controller
{
    public function __invoke(): Response
    {
        $configured = (string) Setting::get('app_logo', '');
        $path = parse_url($configured, PHP_URL_PATH) ?: $configured;

        if (is_string($path) && str_starts_with($path, '/storage/')) {
            $relative = ltrim(substr($path, strlen('/storage/')), '/');
            $disk = Storage::disk('public');

            if ($relative !== '' && $disk->exists($relative)) {
                return $disk->response($relative, null, ['Cache-Control' => 'no-cache, must-revalidate']);
            }
        }

        $fallback = public_path('images/pwa-icon.svg');
        abort_unless(is_file($fallback), 404);

        return response()->file($fallback, ['Cache-Control' => 'no-cache, must-revalidate']);
    }
}
