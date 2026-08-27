<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\Course;
use App\Models\Page;
use App\Models\Product;
use App\Models\Service;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $xml = Cache::remember('seo.sitemap.v1', now()->addMinutes(30), function (): string {
            $base = rtrim((string) url('/'), '/');
            $lastmod = now()->toAtomString();

            $staticPages = collect([
                ['url' => $base.'/', 'priority' => '1.0', 'freq' => 'daily'],
                ['url' => $base.'/courses', 'priority' => '0.9', 'freq' => 'daily'],
                ['url' => $base.'/shop', 'priority' => '0.9', 'freq' => 'daily'],
                ['url' => $base.'/blog', 'priority' => '0.8', 'freq' => 'daily'],
                ['url' => $base.'/services', 'priority' => '0.8', 'freq' => 'weekly'],
                ['url' => $base.'/coaching', 'priority' => '0.8', 'freq' => 'weekly'],
                ['url' => $base.'/about', 'priority' => '0.7', 'freq' => 'monthly'],
                ['url' => $base.'/team', 'priority' => '0.7', 'freq' => 'monthly'],
                ['url' => $base.'/contact', 'priority' => '0.6', 'freq' => 'monthly'],
            ]);

            $courses = Course::published()
                ->latest('updated_at')
                ->get(['slug', 'updated_at'])
                ->map(fn (Course $course) => [
                    'url' => $base.'/courses/'.$course->slug,
                    'priority' => '0.9',
                    'freq' => 'weekly',
                    'lastmod' => $course->updated_at?->toAtomString() ?? $lastmod,
                ]);

            $products = Product::active()
                ->latest('updated_at')
                ->get(['slug', 'updated_at'])
                ->map(fn (Product $product) => [
                    'url' => $base.'/shop/'.$product->slug,
                    'priority' => '0.8',
                    'freq' => 'weekly',
                    'lastmod' => $product->updated_at?->toAtomString() ?? $lastmod,
                ]);

            $posts = BlogPost::where('status', 'published')
                ->latest('updated_at')
                ->get(['slug', 'updated_at'])
                ->map(fn (BlogPost $post) => [
                    'url' => $base.'/blog/'.$post->slug,
                    'priority' => '0.7',
                    'freq' => 'weekly',
                    'lastmod' => $post->updated_at?->toAtomString() ?? $lastmod,
                ]);

            $services = Service::active()
                ->latest('updated_at')
                ->get(['slug', 'updated_at'])
                ->map(fn (Service $service) => [
                    'url' => $base.'/services/'.$service->slug,
                    'priority' => '0.7',
                    'freq' => 'monthly',
                    'lastmod' => $service->updated_at?->toAtomString() ?? $lastmod,
                ]);

            $cmsPages = Page::published()
                ->latest('updated_at')
                ->get(['slug', 'updated_at'])
                ->map(fn (Page $page) => [
                    'url' => $base.'/p/'.$page->slug,
                    'priority' => '0.5',
                    'freq' => 'monthly',
                    'lastmod' => $page->updated_at?->toAtomString() ?? $lastmod,
                ]);

            $entries = $staticPages
                ->concat($courses)
                ->concat($products)
                ->concat($posts)
                ->concat($services)
                ->concat($cmsPages);

            return $this->render($entries);
        });

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=1800',
        ]);
    }

    /** @param Collection<int, array<string, string>> $entries */
    private function render(Collection $entries): string
    {
        $items = $entries->map(function (array $entry): string {
            $lastmod = $entry['lastmod'] ?? null;
            $lastmodTag = $lastmod ? "<lastmod>{$lastmod}</lastmod>" : '';

            return "  <url><loc>".htmlspecialchars($entry['url'], ENT_XML1 | ENT_QUOTES, 'UTF-8')."</loc>{$lastmodTag}<changefreq>{$entry['freq']}</changefreq><priority>{$entry['priority']}</priority></url>";
        })->implode("\n");

        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
            ."<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" xmlns:xhtml=\"http://www.w3.org/1999/xhtml\">\n"
            .$items."\n"
            ."</urlset>";
    }
}
