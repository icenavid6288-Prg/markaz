<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\Course;
use App\Models\Product;
use App\Models\Service;
use App\Models\Testimonial;
use App\Models\Setting;
use App\Http\Presenters\CoursePresenter;
use App\Support\Seo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $content = Cache::remember('public.home.content.v1', now()->addSeconds(60), function (): array {
            $courses = Course::published()
                ->with(['instructor.user', 'category'])
                ->featured()
                ->limit(6)
                ->get()
                ->map(fn ($course) => CoursePresenter::payload($course))
                ->values()
                ->all();

            $podcast = Product::active()
                ->ofType('podcast')
                ->with('episodes')
                ->first();

            return [
                'courses' => $courses,
                'services' => Service::active()->where('is_featured', true)->limit(6)->get()->toArray(),
                'testimonials' => Testimonial::approved()->limit(6)->get()->toArray(),
                'posts' => BlogPost::published()->with('author')->latest('published_at')->limit(3)->get()->toArray(),
                'books' => Product::active()->ofType('book')->latest()->limit(3)->get()->toArray(),
                'podcast' => $podcast?->toArray(),
            ];
        });

        $siteName = (string) Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی');
        $seo = Seo::page(
            $request,
            $siteName,
            (string) Setting::get('meta_description', Setting::get('site_slogan', 'طراحی مسیر آینده نوجوانان')),
            null,
            [
                '@type' => 'WebSite',
                'name' => $siteName,
                'potentialAction' => [
                    '@type' => 'SearchAction',
                    'target' => url('/courses').'?q={search_term_string}',
                    'query-input' => 'required name=search_term_string',
                ],
            ],
        );

        return Inertia::render('Home', [
            'seo' => $seo,
            ...$content,
            'stats' => [
                ['value' => (int) Setting::get('stat_students', 2500), 'suffix' => '+', 'label' => 'نوجوان همراه ما'],
                ['value' => (int) Setting::get('stat_sessions', 5000), 'suffix' => '+', 'label' => 'جلسه کوچینگ برگزارشده'],
                ['value' => (int) Setting::get('stat_satisfaction', 97), 'suffix' => '٪', 'label' => 'رضایت والدین'],
                ['value' => (int) Setting::get('stat_experience', 8), 'suffix' => '+', 'label' => 'سال تجربه کاری'],
            ],
        ]);
    }

}
