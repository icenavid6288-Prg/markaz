<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function index(Request $request): Response
    {
        $items = Wishlist::query()
            ->with('wishlistable')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(function (Wishlist $item) {
                $target = $item->wishlistable;
                if ($target instanceof Course) {
                    return [
                        'id' => $item->id,
                        'type' => 'course',
                        'title' => $target->title,
                        'url' => route('courses.show', $target->slug),
                        'image' => $target->thumbnail,
                    ];
                }
                if ($target instanceof Product) {
                    return [
                        'id' => $item->id,
                        'type' => 'product',
                        'title' => $target->title,
                        'url' => route('shop.show', $target->slug),
                        'image' => $target->image,
                    ];
                }

                return null;
            })
            ->filter()
            ->values();

        return Inertia::render('Dashboard/Wishlist', ['items' => $items]);
    }

    public function toggle(Request $request): RedirectResponse
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

            return back()->with('success', 'از علاقه‌مندی‌ها حذف شد.');
        }

        Wishlist::create([
            'user_id' => $request->user()->id,
            'wishlistable_type' => $model,
            'wishlistable_id' => $target->id,
        ]);

        return back()->with('success', 'به علاقه‌مندی‌ها اضافه شد.');
    }
}
