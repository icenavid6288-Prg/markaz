<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Support\Seo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CmsPageController extends Controller
{
    public function show(Request $request, Page $page): Response
    {
        abort_unless($page->status === 'published', 404);

        $sections = collect($page->sections ?? [])
            ->filter(fn ($section) => is_array($section))
            ->map(fn (array $section) => [
                'type' => (string) ($section['type'] ?? 'text'),
                'title' => (string) ($section['title'] ?? ''),
                'body' => (string) ($section['body'] ?? $section['content'] ?? ''),
                'image' => (string) ($section['image'] ?? ''),
            ])
            ->values();

        $seo = Seo::page(
            $request,
            $page->title,
            is_array($page->seo) ? (string) ($page->seo['description'] ?? $page->title) : $page->title,
            is_array($page->seo) ? $page->seo : null,
            [
                '@type' => 'WebPage',
                'name' => $page->title,
                'url' => url('/p/'.$page->slug),
            ],
        );

        return Inertia::render('Pages/Show', [
            'seo' => $seo,
            'page' => [
                'title' => $page->title,
                'slug' => $page->slug,
                'template' => $page->template,
                'sections' => $sections,
            ],
        ]);
    }
}
