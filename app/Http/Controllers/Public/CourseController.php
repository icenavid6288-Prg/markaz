<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Presenters\CoursePresenter;
use App\Models\Category;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function index(Request $request): Response
    {
        $category = $request->string('category')->toString();
        $sort = $request->string('sort')->toString() ?: 'latest';
        $allowedSorts = ['latest', 'oldest', 'popular', 'price_asc', 'price_desc', 'title'];
        $sort = in_array($sort, $allowedSorts, true) ? $sort : 'latest';

        $query = Course::published()->with(['instructor.user', 'category']);

        if ($request->filled('level')) {
            $level = $request->string('level')->toString();
            if (in_array($level, ['beginner', 'intermediate', 'advanced'], true)) {
                $query->where('level', $level);
            }
        }

        if ($request->filled('q')) {
            $term = $request->string('q')->toString();
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', "%{$term}%")
                    ->orWhere('subtitle', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhereHas('instructor.user', fn ($instructor) => $instructor->where('name', 'like', "%{$term}%"));
            });
        }

        if ($category !== '') {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category)->where('type', 'course'));
        }

        match ($sort) {
            'oldest' => $query->orderBy('created_at')->orderBy('id'),
            'popular' => $query->orderByDesc('students_count')->orderByDesc('rating_avg')->orderByDesc('created_at'),
            'price_asc' => $query->orderByRaw('COALESCE(discount_price, price) asc')->orderByDesc('created_at'),
            'price_desc' => $query->orderByRaw('COALESCE(discount_price, price) desc')->orderByDesc('created_at'),
            'title' => $query->orderBy('title')->orderByDesc('created_at'),
            default => $query->latest('created_at')->latest('id'),
        };

        $paginator = $query->paginate(9)->withQueryString();
        $courses = collect($paginator->items())->map(fn ($course) => CoursePresenter::payload($course))->values();

        $categories = Cache::remember('public.categories.course.v1', now()->addMinutes(5), fn () => Category::query()
            ->where('type', 'course')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->toArray());

        $seo = \App\Support\Seo::page(
            $request,
            'دوره‌های آموزشی',
            'دوره‌های آنلاین و حضوری برای نوجوانان، والدین و مدرسین؛ با گواهینامه معتبر و پشتیبانی مستمر.',
            null,
            [
                '@type' => 'CollectionPage',
                'mainEntity' => [
                    '@type' => 'ItemList',
                    'numberOfItems' => $paginator->total(),
                    'itemListElement' => $courses->take(10)->values()->map(fn ($course, $index) => [
                        '@type' => 'ListItem',
                        'position' => (($paginator->currentPage() - 1) * $paginator->perPage()) + $index + 1,
                        'name' => $course['title'],
                        'url' => url('/courses/'.$course['slug']),
                    ])->all(),
                ],
            ],
        );

        return Inertia::render('Courses/Index', [
            'seo' => $seo,
            'courses' => [
                'data' => $courses,
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'categories' => $categories,
            'filters' => [
                'q' => $request->string('q')->toString(),
                'level' => $request->string('level')->toString(),
                'category' => $category,
                'sort' => $sort,
            ],
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $course = Course::published()
            ->with(['instructor.user', 'category', 'modules.lessons', 'faqs'])
            ->where('slug', $slug)
            ->firstOrFail();

        $payload = CoursePresenter::payload($course);
        $payload['modules'] = $course->modules->map(fn ($module) => [
            'id' => $module->id,
            'title' => $module->title,
            'lessons' => $module->lessons->map(fn ($lesson) => [
                'id' => $lesson->id,
                'title' => $lesson->title,
                'duration_minutes' => $lesson->duration_minutes,
                'is_free' => $lesson->is_free,
            ])->values(),
        ])->values();
        $payload['faqs'] = $course->faqs->map(fn ($faq) => [
            'id' => $faq->id,
            'question' => $faq->question,
            'answer' => $faq->answer,
        ])->values();

        $reviews = $course->reviews()
            ->with('user')
            ->where('is_approved', true)
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($review) => [
                'id' => $review->id,
                'name' => $review->user?->name ?? 'کاربر دوره',
                'avatar' => $review->user?->avatar,
                'rating' => $review->rating,
                'title' => $review->title,
                'body' => $review->body,
                'created_at' => $review->created_at?->toISOString(),
            ])->values();

        $enrollment = $request->user()
            ? Enrollment::query()
                ->where('user_id', $request->user()->id)
                ->where('course_id', $course->id)
                ->first()
            : null;
        $myReview = $request->user()
            ? $course->reviews()->where('user_id', $request->user()->id)->first()
            : null;
        $reviewCount = $course->reviews()->where('is_approved', true)->count();
        $canReview = $enrollment !== null && in_array($enrollment->status, ['active', 'completed'], true);

        $related = Course::published()
            ->with(['category', 'instructor.user'])
            ->where('id', '!=', $course->id)
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn ($c) => CoursePresenter::payload($c));

        $seo = \App\Support\Seo::page(
            $request,
            $course->title,
            $course->description ?: ($course->subtitle ?: 'دوره آموزشی کاربردی برای ساختن مهارت‌های آینده.'),
            $course->seo,
            [
                '@type' => 'Course',
                'name' => $course->title,
                'description' => $course->description ?: $course->subtitle,
                'url' => url('/courses/'.$course->slug),
                'provider' => [
                    '@type' => 'Organization',
                    'name' => 'مرکز رشد و کارآفرینی دکتر بیدی',
                ],
                'offers' => [
                    '@type' => 'Offer',
                    'price' => $course->finalPrice(),
                    'priceCurrency' => 'IRR',
                    'availability' => 'https://schema.org/InStock',
                    'url' => url('/courses/'.$course->slug),
                ],
            ],
            $course->thumbnail,
        );

        return Inertia::render('Courses/Show', [
            'seo' => $seo,
            'course' => $payload,
            'related' => $related,
            'reviews' => $reviews,
            'review_summary' => [
                'count' => $reviewCount,
                'average' => (float) $course->rating_avg,
            ],
            'my_review' => $myReview ? [
                'rating' => (int) $myReview->rating,
                'title' => $myReview->title,
                'body' => $myReview->body,
                'is_approved' => (bool) $myReview->is_approved,
            ] : null,
            'can_review' => $canReview,
            'enrollment' => $enrollment ? [
                'is_enrolled' => true,
                'status' => $enrollment->status,
                'progress_percent' => (int) $enrollment->progress_percent,
            ] : [
                'is_enrolled' => false,
                'status' => null,
                'progress_percent' => 0,
            ],
        ]);
    }
}
