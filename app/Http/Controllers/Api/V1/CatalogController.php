<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Presenters\CoursePresenter;
use App\Models\Course;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function courses(Request $request): JsonResponse
    {
        $courses = Course::published()
            ->with(['instructor.user', 'category'])
            ->latest()
            ->paginate(min(24, max(1, $request->integer('per_page', 12))))
            ->through(fn (Course $course) => CoursePresenter::payload($course));

        return response()->json(['data' => $courses]);
    }

    public function course(Request $request, Course $course): JsonResponse
    {
        abort_unless($course->is_published, 404);

        $course->load(['instructor.user', 'category', 'modules.lessons']);

        $user = $request->user() ?? $request->user('sanctum');
        $enrollment = $user?->enrollments()->where('course_id', $course->id)->first();

        $curriculum = $course->modules->map(fn ($module) => [
            'id' => $module->id,
            'title' => $module->title,
            'lessons' => $module->lessons->map(fn ($lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'type' => $lesson->type,
                'duration_minutes' => $lesson->duration_minutes,
                'is_free' => $lesson->is_free,
                'slug' => $lesson->slug,
            ]),
        ]);

        return response()->json([
            'data' => array_merge(CoursePresenter::payload($course), [
                'curriculum' => $curriculum,
                'enrollment' => $enrollment ? [
                    'id' => $enrollment->id,
                    'status' => $enrollment->status,
                    'progress_percent' => $enrollment->progress_percent,
                ] : null,
            ]),
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $products = Product::active()
            ->with('category')
            ->latest()
            ->paginate(min(24, max(1, $request->integer('per_page', 12))))
            ->through(fn (Product $product) => $product->only([
                'id', 'type', 'title', 'slug', 'description', 'image', 'price', 'discount_price',
                'author', 'pages', 'publisher', 'isbn', 'preview_url', 'is_featured',
            ]));

        return response()->json(['data' => $products]);
    }

    public function product(Product $product): JsonResponse
    {
        abort_unless($product->is_active, 404);

        return response()->json(['data' => $product->only([
            'id', 'type', 'title', 'slug', 'description', 'image', 'price', 'discount_price',
            'author', 'pages', 'publisher', 'isbn', 'preview_url', 'is_featured',
        ])]);
    }
}
