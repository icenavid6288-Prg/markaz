<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Order;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommerceController extends Controller
{
    public function checkoutCourse(Request $request, Course $course): JsonResponse
    {
        abort_unless($course->is_published, 404);

        $enrollment = Enrollment::query()
            ->where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->first();

        if ($enrollment) {
            return response()->json([
                'data' => [
                    'enrolled' => true,
                    'player_url' => url('/dashboard/courses/'.$course->slug.'/learn'),
                ],
            ]);
        }

        $response = app(\App\Http\Controllers\CheckoutController::class)->store($request, $course);
        $order = Order::query()->where('user_id', $request->user()->id)->latest('id')->first();

        return response()->json([
            'data' => [
                'enrolled' => $order?->status === 'paid',
                'order_number' => $order?->order_number,
                'status' => $order?->status,
                'checkout_url' => $order && $order->status !== 'paid'
                    ? url('/checkout/'.$order->order_number)
                    : null,
                'player_url' => url('/dashboard/courses/'.$course->slug.'/learn'),
                'redirect' => $response->getTargetUrl(),
            ],
        ]);
    }

    public function addToCart(Request $request, Product $product): JsonResponse
    {
        app(\App\Http\Controllers\CartController::class)->store($request, $product);

        return response()->json(['data' => ['message' => 'به سبد اضافه شد.', 'cart_url' => url('/cart')]]);
    }

    public function toggleWishlist(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:course,product'],
            'id' => ['required', 'integer'],
        ]);
        $model = $validated['type'] === 'course' ? Course::class : Product::class;
        $target = $model::query()->findOrFail($validated['id']);

        $existing = Wishlist::query()
            ->where('user_id', $request->user()->id)
            ->where('wishlistable_type', $model)
            ->where('wishlistable_id', $target->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return response()->json(['data' => ['saved' => false]]);
        }

        Wishlist::create([
            'user_id' => $request->user()->id,
            'wishlistable_type' => $model,
            'wishlistable_id' => $target->id,
        ]);

        return response()->json(['data' => ['saved' => true]]);
    }
}
