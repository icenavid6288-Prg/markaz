<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Category;
use App\Support\Seo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $sort = $request->string('sort')->toString() ?: 'latest';
        $category = $request->string('category')->toString();
        $allowedSorts = ['latest', 'oldest', 'popular', 'reading_time'];
        $sort = in_array($sort, $allowedSorts, true) ? $sort : 'latest';

        $query = BlogPost::published()->with(['author', 'category']);

        if ($request->filled('q')) {
            $query->where(function ($q) use ($request) {
                $term = $request->string('q')->toString();
                $q->where('title', 'like', "%{$term}%")
                    ->orWhere('excerpt', 'like', "%{$term}%");
            });
        }

        if ($category !== '') {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category)->where('type', 'blog'));
        }

        match ($sort) {
            'oldest' => $query->orderBy('published_at')->orderBy('id'),
            'popular' => $query->orderByDesc('views_count')->orderByDesc('published_at'),
            'reading_time' => $query->orderBy('reading_time')->orderByDesc('published_at'),
            default => $query->latest('published_at')->latest('id'),
        };

        $paginator = $query->paginate(9)->withQueryString();
        $featured = null;

        if ($paginator->currentPage() === 1 && $sort === 'latest' && ! $request->filled('q') && $category === '') {
            $featured = $paginator->getCollection()->first();
            $paginator->setCollection($paginator->getCollection()->skip(1)->values());
        }

        $postsForSchema = collect($paginator->items());
        if ($featured) {
            $postsForSchema->prepend($featured);
        }

        $categories = Cache::remember('public.categories.blog.v1', now()->addMinutes(5), fn () => Category::query()
            ->where('type', 'blog')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->toArray());

        $seo = Seo::page(
            $request,
            'بلاگ و دانش‌نامه',
            'مقالات تخصصی درباره استعدادیابی، کوچینگ نوجوان، مهارت‌های آینده و تربیت برای خانواده‌ها و مدرسین.',
            null,
            [
                '@type' => 'CollectionPage',
                'mainEntity' => [
                    '@type' => 'ItemList',
                    'numberOfItems' => $paginator->total(),
                    'itemListElement' => $postsForSchema->take(10)->values()->map(fn ($post, $index) => [
                        '@type' => 'ListItem',
                        'position' => (($paginator->currentPage() - 1) * $paginator->perPage()) + $index + 1,
                        'name' => $post->title,
                        'url' => url('/blog/'.$post->slug),
                    ])->all(),
                ],
            ],
        );

        return Inertia::render('Blog/Index', [
            'seo' => $seo,
            'posts' => [
                'data' => $paginator->items(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'featured' => $featured,
            'categories' => $categories,
            'filters' => [
                'q' => $request->string('q')->toString(),
                'category' => $category,
                'sort' => $sort,
            ],
        ]);
    }

    public function show(string $slug): Response
    {
        $post = BlogPost::published()->with(['author', 'category', 'tags'])->where('slug', $slug)->firstOrFail();

        $post->increment('views_count');

        $related = BlogPost::published()
            ->with('author')
            ->where('id', '!=', $post->id)
            ->latest('published_at')
            ->limit(3)
            ->get();

        $seo = Seo::page(
            request(),
            $post->title,
            $post->excerpt ?: 'مقاله تخصصی از دانش‌نامه مرکز رشد و کارآفرینی دکتر بیدی.',
            $post->seo,
            [
                '@type' => 'Article',
                'headline' => $post->title,
                'description' => $post->excerpt,
                'url' => url('/blog/'.$post->slug),
                'datePublished' => $post->published_at?->toIso8601String(),
                'dateModified' => $post->updated_at?->toIso8601String(),
                'author' => [
                    '@type' => 'Person',
                    'name' => $post->author?->name ?: 'مرکز رشد و کارآفرینی دکتر بیدی',
                ],
                'publisher' => [
                    '@type' => 'Organization',
                    'name' => 'مرکز رشد و کارآفرینی دکتر بیدی',
                ],
            ],
            $post->cover_image,
        );

        return Inertia::render('Blog/Show', [
            'seo' => $seo,
            'post' => $post,
            'related' => $related,
        ]);
    }
}
