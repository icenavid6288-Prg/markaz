<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Presenters\CoursePresenter;
use App\Models\Course;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function index(): JsonResponse
    {
        $courses = Course::published()
            ->featured()
            ->with(['instructor.user', 'category'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Course $course) => CoursePresenter::payload($course));

        $latestCourses = Course::published()
            ->with(['instructor.user', 'category'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Course $course) => CoursePresenter::payload($course));

        $products = Product::active()
            ->with('category')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Product $product) => $product->only([
                'id', 'type', 'title', 'slug', 'description', 'image', 'price', 'discount_price',
                'author', 'pages', 'publisher', 'isbn', 'preview_url', 'is_featured',
            ]));

        return response()->json([
            'data' => [
                'site' => [
                    'name' => (string) Setting::get('site_name', 'مرکز رشد و کارآفرینی دکتر بیدی'),
                    'slogan' => (string) Setting::get('site_slogan', 'اکوسیستم آموزش، کوچینگ و طراحی مسیر رشد نوجوانان'),
                ],
                'featured_courses' => $courses,
                'latest_courses' => $latestCourses,
                'latest_products' => $products,
            ],
        ]);
    }
}
