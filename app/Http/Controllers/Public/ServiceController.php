<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use App\Support\Seo;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function index(Request $request): Response
    {
        $services = Cache::remember('public.services.index.v1', now()->addSeconds(60), fn () => Service::active()->get()->toArray());
        $seo = Seo::page(
            $request,
            'خدمات مرکز رشد و کارآفرینی',
            'راهکارهای جامع برای کشف استعداد، کوچینگ نوجوان، کوچینگ تحصیلی و تربیت مدرس.',
            null,
            [
                '@type' => 'CollectionPage',
                'mainEntity' => [
                    '@type' => 'ItemList',
                    'numberOfItems' => count($services),
                    'itemListElement' => collect($services)->take(10)->values()->map(fn ($service, $index) => [
                        '@type' => 'ListItem',
                        'position' => $index + 1,
                        'name' => $service['title'],
                        'url' => url('/services/'.$service['slug']),
                    ])->all(),
                ],
            ],
        );

        return Inertia::render('Services/Index', [
            'seo' => $seo,
            'services' => $services,
        ]);
    }

    public function show(string $slug): Response
    {
        $service = Service::active()->where('slug', $slug)->firstOrFail();

        $testimonials = Testimonial::approved()->limit(4)->get();

        $seo = Seo::page(
            request(),
            $service->title,
            $service->summary ?: ($service->description ?: 'خدمت تخصصی برای طراحی مسیر رشد و آینده.'),
            $service->seo,
            [
                '@type' => 'Service',
                'name' => $service->title,
                'description' => $service->description ?: $service->summary,
                'url' => url('/services/'.$service->slug),
                'provider' => [
                    '@type' => 'Organization',
                    'name' => 'مرکز رشد و کارآفرینی دکتر بیدی',
                ],
                'areaServed' => 'IR',
            ],
            $service->image,
        );

        return Inertia::render('Services/Show', [
            'seo' => $seo,
            'service' => $service,
            'testimonials' => $testimonials,
            'others' => Service::active()->where('id', '!=', $service->id)->limit(3)->get(),
        ]);
    }
}
