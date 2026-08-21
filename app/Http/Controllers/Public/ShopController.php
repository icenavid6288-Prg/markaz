<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Support\Seo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->string('type')->toString();
        $category = $request->string('category')->toString();
        $sort = $request->string('sort')->toString() ?: 'latest';
        $allowedTypes = ['book', 'podcast', 'digital', 'physical'];
        $allowedSorts = ['latest', 'oldest', 'price_asc', 'price_desc', 'popular', 'title'];
        $type = in_array($type, $allowedTypes, true) ? $type : '';
        $sort = in_array($sort, $allowedSorts, true) ? $sort : 'latest';

        $query = Product::active()->with(['category', 'episodes']);

        if ($type !== '') {
            $query->ofType($type);
        }

        if ($request->filled('q')) {
            $query->where(function ($q) use ($request) {
                $term = $request->string('q')->toString();
                $q->where('title', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhere('author', 'like', "%{$term}%");
            });
        }

        if ($category !== '') {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category)->where('type', 'product'));
        }

        match ($sort) {
            'oldest' => $query->orderBy('created_at')->orderBy('id'),
            'price_asc' => $query->orderByRaw('COALESCE(discount_price, price) asc')->orderByDesc('created_at'),
            'price_desc' => $query->orderByRaw('COALESCE(discount_price, price) desc')->orderByDesc('created_at'),
            'popular' => $query->orderByDesc('is_featured')->orderByDesc('created_at'),
            'title' => $query->orderBy('title')->orderByDesc('created_at'),
            default => $query->latest('created_at')->latest('id'),
        };

        $paginator = $query->paginate(9)->withQueryString();
        $products = collect($paginator->items())
            ->map(fn (Product $product) => $this->presentProduct($product, $request))
            ->values();

        $categories = Cache::remember('public.categories.product.v1', now()->addMinutes(5), fn () => Category::query()
            ->where('type', 'product')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->toArray());

        $featured = Product::active()
            ->where('is_featured', true)
            ->with(['category', 'episodes'])
            ->latest('created_at')
            ->latest('id')
            ->limit(3)
            ->get()
            ->map(fn (Product $product) => $this->presentProduct($product, $request))
            ->values();

        $seo = Seo::page(
            $request,
            'فروشگاه آموزشی',
            'کتاب‌ها، پادکست‌ها و محتوای آموزشی برای رشد نوجوانان، والدین و مدرسین.',
            null,
            [
                '@type' => 'CollectionPage',
                'mainEntity' => [
                    '@type' => 'ItemList',
                    'numberOfItems' => $paginator->total(),
                    'itemListElement' => $products->take(10)->values()->map(fn ($product, $index) => [
                        '@type' => 'ListItem',
                        'position' => (($paginator->currentPage() - 1) * $paginator->perPage()) + $index + 1,
                        'name' => $product['title'],
                        'url' => url('/shop/'.$product['slug']),
                    ])->all(),
                ],
            ],
        );

        return Inertia::render('Shop/Index', [
            'seo' => $seo,
            'products' => [
                'data' => $products,
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'categories' => $categories,
            'featured' => $featured,
            'filters' => [
                'q' => $request->string('q')->toString(),
                'type' => $type,
                'category' => $category,
                'sort' => $sort,
            ],
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $product = Product::active()->with(['category', 'episodes'])->where('slug', $slug)->firstOrFail();

        $related = Product::active()
            ->where('type', $product->type)
            ->where('id', '!=', $product->id)
            ->latest()
            ->limit(3)
            ->get();

        $seo = Seo::page(
            request(),
            $product->title,
            $product->description ?: 'محصول آموزشی از فروشگاه مرکز رشد و کارآفرینی دکتر بیدی.',
            $product->meta,
            [
                '@type' => 'Product',
                'name' => $product->title,
                'description' => $product->description,
                'url' => url('/shop/'.$product->slug),
                'brand' => [
                    '@type' => 'Brand',
                    'name' => 'مرکز رشد و کارآفرینی دکتر بیدی',
                ],
                'offers' => [
                    '@type' => 'Offer',
                    'price' => $product->finalPrice(),
                    'priceCurrency' => 'IRR',
                    'availability' => $product->stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                    'url' => url('/shop/'.$product->slug),
                ],
            ],
            $product->image,
        );

        return Inertia::render('Shop/Show', [
            'seo' => $seo,
            'wishlisted' => $request->user()
                ? \App\Models\Wishlist::query()
                    ->where('user_id', $request->user()->id)
                    ->where('wishlistable_type', Product::class)
                    ->where('wishlistable_id', $product->id)
                    ->exists()
                : false,
            'product' => $this->presentProduct($product, $request, true),
            'related' => $related->map(fn (Product $item) => $this->presentProduct($item, $request))->values(),
        ]);
    }

    /**
     * Present only public product fields. Private digital file paths and paid
     * audio URLs must never be sent in a public Inertia payload.
     *
     * @return array<string, mixed>
     */
    private function presentProduct(Product $product, Request $request, bool $includePaidAudio = false): array
    {
        $payload = $product->only([            'id', 'type', 'title', 'slug', 'description', 'image', 'price', 'discount_price', 'download_price', 'download_discount_price', 'author', 'pages', 'publisher', 'isbn', 'audio_duration_seconds', 'preview_url', 'is_active', 'is_featured',

        ]);

        $payload['category'] = $product->category ? $product->category->only(['id', 'name', 'slug']) : null;
        $hasPurchased = $includePaidAudio && $this->userHasPurchased($request, $product);
        $hasDownloadPurchase = $includePaidAudio && $this->userHasPurchased($request, $product, 'download');
        $payload['has_preview_file'] = $product->hasPreviewEdition();
        $payload['has_download_edition'] = $product->hasDownloadEdition();
        $payload['can_view_preview'] = $hasPurchased && $product->hasPreviewEdition();
        $payload['can_download'] = $hasDownloadPurchase && $product->hasDownloadEdition();
        $payload['preview_endpoint'] = $payload['can_view_preview'] ? route('products.preview', $product) : null;
        $payload['download_endpoint'] = $payload['can_download'] ? route('products.download', $product) : null;

        if ($includePaidAudio) {
            $approvedReviews = $product->reviews()
                ->with('user')
                ->where('is_approved', true)
                ->latest()
                ->limit(8)
                ->get();
            $payload['reviews'] = $approvedReviews->map(fn ($review) => [
                'id' => $review->id,
                'name' => $review->user?->name ?? 'خریدار محصول',
                'avatar' => $review->user?->avatar,
                'rating' => (int) $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'created_at' => $review->created_at?->toISOString(),
            ])->values();
            $payload['review_summary'] = [
                'count' => $product->reviews()->where('is_approved', true)->count(),
                'average' => round((float) ($product->reviews()->where('is_approved', true)->avg('rating') ?? 0), 2),
            ];
            $myReview = $request->user()
                ? $product->reviews()->where('user_id', $request->user()->id)->first()
                : null;
            $payload['my_review'] = $myReview ? [
                'rating' => (int) $myReview->rating,
                'title' => $myReview->title,
                'body' => $myReview->body,
                'is_approved' => (bool) $myReview->is_approved,
            ] : null;
            $payload['can_review'] = $hasPurchased;
        }

        if ($product->relationLoaded('episodes')) {
            $canAccessPaidAudio = $hasPurchased;
            $payload['episodes'] = $product->episodes->take(3)->map(fn ($episode) => [
                'id' => $episode->id,
                'title' => $episode->title,
                'description' => $episode->description,
                'audio_url' => ($episode->is_free || $canAccessPaidAudio) ? $episode->audio_url : null,
                'duration_seconds' => $episode->duration_seconds,
                'is_free' => $episode->is_free,
            ])->values();
        }

        return $payload;
    }

    private function userHasPurchased(Request $request, Product $product): bool
    {
        $user = $request->user();

        return $user !== null && $user->orders()
            ->where('status', 'paid')
            ->whereHas('items', fn ($query) => $query
                ->where('purchasable_type', Product::class)
                ->where('purchasable_id', $product->id))
            ->exists();
    }
}
