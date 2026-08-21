<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Support\SafeStoragePath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductPreviewController extends Controller
{
    public function __invoke(Request $request, Product $product): StreamedResponse
    {
        abort_unless($product->type === 'book', 404);
        abort_unless($product->is_active && filled($product->preview_file_path), 404);

        $hasAccess = $request->user()->orders()
            ->where('status', 'paid')
            ->whereHas('items', fn ($query) => $query
                ->where('purchasable_type', Product::class)
                ->where('purchasable_id', $product->id)
                ->whereIn('purchase_mode', ['online', 'download']))
            ->exists();

        abort_unless($hasAccess, 403);

        $path = ltrim((string) $product->preview_file_path, '/');
        $disk = Storage::disk('local');
        abort_unless($disk->exists($path), 404);

        $filename = Str::slug($product->title).'-preview.pdf';

        return $disk->response($path, $filename, [
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
            'Content-Type' => 'application/pdf',
            'Cache-Control' => 'private, no-store, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'self'",
        ]);
    }
}
