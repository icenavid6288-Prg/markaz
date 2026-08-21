<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function storeCourse(Request $request, Course $course): RedirectResponse
    {
        abort_unless($course->is_published, 404);
        abort_unless(Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->whereIn('status', ['active', 'completed'])
            ->exists(), 403, 'برای ثبت نظر باید در این دوره ثبت‌نام کرده باشید.');

        $review = $this->saveReview($request, $course);
        $this->refreshCourseRating($course);

        return back()->with('success', $review->wasRecentlyCreated
            ? 'نظر شما ثبت شد و پس از بررسی منتشر می‌شود.'
            : 'نظر شما به‌روزرسانی شد و پس از بررسی دوباره منتشر می‌شود.');
    }

    public function storeProduct(Request $request, Product $product): RedirectResponse
    {
        abort_unless($product->is_active, 404);
        abort_unless($request->user()->orders()
            ->where('status', 'paid')
            ->whereHas('items', fn ($query) => $query
                ->where('purchasable_type', Product::class)
                ->where('purchasable_id', $product->id))
            ->exists(), 403, 'برای ثبت نظر باید این محصول را خریداری کرده باشید.');

        $review = $this->saveReview($request, $product);

        return back()->with('success', $review->wasRecentlyCreated
            ? 'نظر شما ثبت شد و پس از بررسی منتشر می‌شود.'
            : 'نظر شما به‌روزرسانی شد و پس از بررسی دوباره منتشر می‌شود.');
    }

    private function saveReview(Request $request, Course|Product $reviewable): Review
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:120'],
            'body' => ['required', 'string', 'min:5', 'max:2000'],
        ]);

        return Review::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'reviewable_type' => $reviewable::class,
                'reviewable_id' => $reviewable->id,
            ],
            [
                ...$data,
                // New and edited reviews must be approved again by the content team.
                'is_approved' => false,
            ],
        );
    }

    private function refreshCourseRating(Course $course): void
    {
        $average = $course->reviews()
            ->where('is_approved', true)
            ->avg('rating');

        $course->updateQuietly(['rating_avg' => round((float) ($average ?? 0), 2)]);
    }
}
