<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Presenters\CoursePresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $enrollments = $user->enrollments()
            ->with('course.instructor.user', 'course.category')
            ->latest('enrolled_at')
            ->get()
            ->map(fn ($enrollment) => [
                'id' => $enrollment->id,
                'status' => $enrollment->status,
                'progress_percent' => $enrollment->progress_percent,
                'enrolled_at' => $enrollment->enrolled_at?->toIso8601String(),
                'completed_at' => $enrollment->completed_at?->toIso8601String(),
                'course' => $enrollment->course
                    ? CoursePresenter::payload($enrollment->course)
                    : null,
            ]);

        $orders = $user->orders()
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total' => $order->total,
                'status' => $order->status,
                'created_at' => $order->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                    'bio' => $user->bio,
                ],
                'enrollments' => $enrollments,
                'orders' => $orders,
            ],
        ]);
    }
}
