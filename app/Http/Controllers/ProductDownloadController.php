<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductDownloadController extends Controller
{
    public function __invoke(Request $request, Product $product): StreamedResponse
    {
        abort_unless(in_array($product->type, ['digital', 'book'], true), 404);
        abort_unless($product->is_active && $product->hasDownloadEdition() && filled($product->file_path), 404);

        $hasPurchased = $request->user()->orders()
            ->where('status', 'paid')
            ->whereHas('items', fn ($query) => $query
                ->where('purchasable_type', Product::class)
                ->where('purchasable_id', $product->id)
                ->where(function ($mode) {
                    $mode->whereNull('purchase_mode')->orWhere('purchase_mode', 'download');
                }))
            ->exists();

        abort_unless($hasPurchased, 403);

        $path = ltrim((string) $product->file_path, '/');
        if (Str::startsWith($path, 'storage/')) {
            $path = Str::after($path, 'storage/');
        }

        // Digital files belong on the private disk. Legacy public files can be
        // enabled temporarily during migration, but are rejected by default in
        // production so a leaked /storage URL cannot bypass this controller.
        $disk = Storage::disk('local');
        if (! $disk->exists($path) && (bool) config('filesystems.allow_legacy_public_downloads', false)) {
            $disk = Storage::disk('public');
        }

        abort_unless($disk->exists($path), 404);

        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $filename = Str::slug($product->title).($extension ? '.'.$extension : '');

        return $disk->download($path, $filename, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
