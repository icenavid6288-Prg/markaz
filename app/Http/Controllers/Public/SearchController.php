<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Course;
use App\Models\Product;
use App\Models\Service;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $query = trim($request->string('q')->toString());
        $query = mb_substr($query, 0, 80);

        $results = [
            'courses' => [],
            'products' => [],
            'posts' => [],
            'services' => [],
        ];

        if ($query !== '') {
            $like = "%{$query}%";

            $results['courses'] = Course::published()
                ->where(function ($builder) use ($like): void {
                    $builder->where('title', 'like', $like)
                        ->orWhere('subtitle', 'like', $like)
                        ->orWhere('description', 'like', $like);
                })
                ->latest('created_at')
                ->limit(6)
                ->get(['id', 'title', 'slug', 'subtitle', 'description', 'thumbnail'])
                ->map(fn (Course $course): array => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => $course->subtitle ?: $course->description,
                    'url' => '/courses/'.$course->slug,
                    'image' => $course->thumbnail,
                ])
                ->values()
                ->all();

            $results['products'] = Product::active()
                ->where(function ($builder) use ($like): void {
                    $builder->where('title', 'like', $like)
                        ->orWhere('description', 'like', $like)
                        ->orWhere('author', 'like', $like);
                })
                ->latest('created_at')
                ->limit(6)
                ->get(['id', 'title', 'slug', 'description', 'image', 'author'])
                ->map(fn (Product $product): array => [
                    'id' => $product->id,
                    'title' => $product->title,
                    'description' => $product->author ?: $product->description,
                    'url' => '/shop/'.$product->slug,
                    'image' => $product->image,
                ])
                ->values()
                ->all();

            $results['posts'] = BlogPost::published()
                ->where(function ($builder) use ($like): void {
                    $builder->where('title', 'like', $like)
                        ->orWhere('excerpt', 'like', $like)
                        ->orWhere('body', 'like', $like);
                })
                ->latest('published_at')
                ->limit(6)
                ->get(['id', 'title', 'slug', 'excerpt', 'cover_image', 'published_at'])
                ->map(fn (BlogPost $post): array => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'description' => $post->excerpt,
                    'url' => '/blog/'.$post->slug,
                    'image' => $post->cover_image,
                ])
                ->values()
                ->all();

            $results['services'] = Service::active()
                ->where(function ($builder) use ($like): void {
                    $builder->where('title', 'like', $like)
                        ->orWhere('summary', 'like', $like)
                        ->orWhere('description', 'like', $like);
                })
                ->limit(6)
                ->get(['id', 'title', 'slug', 'summary', 'description', 'image'])
                ->map(fn (Service $service): array => [
                    'id' => $service->id,
                    'title' => $service->title,
                    'description' => $service->summary ?: $service->description,
                    'url' => '/services/'.$service->slug,
                    'image' => $service->image,
                ])
                ->values()
                ->all();
        }

        $seo = Seo::page(
            $request,
            $query !== '' ? "نتایج جستجو برای «{$query}»" : 'جستجو',
            'جستجوی دوره‌ها، محصولات آموزشی، مقالات و خدمات مرکز رشد و کارآفرینی دکتر بیدی.',
            null,
            ['@type' => 'SearchResultsPage'],
        );

        return Inertia::render('Search/Index', [
            'seo' => $seo,
            'query' => $query,
            'results' => $results,
        ]);
    }
}
