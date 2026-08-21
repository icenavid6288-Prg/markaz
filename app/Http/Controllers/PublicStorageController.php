<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class PublicStorageController extends Controller
{
    public function __invoke(string $path): Response
    {
        abort_if($path === '' || str_contains($path, '..'), 404);

        $disk = Storage::disk('public');
        abort_unless($disk->exists($path), 404);

        return $disk->response($path);
    }
}
