<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\CommerceController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\LearningController;
use App\Http\Controllers\InstagramWebhookController;
use Illuminate\Support\Facades\Route;

Route::get('/instagram/webhook', [InstagramWebhookController::class, 'verify'])->name('instagram.webhook.verify');
Route::post('/instagram/webhook', [InstagramWebhookController::class, 'receive'])->name('instagram.webhook.receive');

// Reserved for a future official Eitaa inbound API; answers 501 with an explanation today.
Route::post('/eitaa/webhook/{bot}', [\App\Http\Controllers\EitaaWebhookController::class, 'receive'])->name('eitaa.webhook.receive');

Route::prefix('v1')->middleware('throttle:60,1')->group(function (): void {
    Route::get('/home', [HomeController::class, 'index'])->name('api.v1.home');

    Route::get('/courses', [CatalogController::class, 'courses'])->name('api.v1.courses.index');
    Route::get('/courses/{course:slug}', [CatalogController::class, 'course'])->name('api.v1.courses.show');
    Route::get('/products', [CatalogController::class, 'products'])->name('api.v1.products.index');
    Route::get('/products/{product:slug}', [CatalogController::class, 'product'])->name('api.v1.products.show');

    Route::prefix('auth')->name('auth.')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1')->name('register');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('login');
        Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum')->name('me');
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum')->name('logout');
    });

    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('auth:sanctum')
        ->name('api.v1.dashboard');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/courses/{course:slug}/checkout', [CommerceController::class, 'checkoutCourse'])->middleware('throttle:10,1')->name('api.v1.courses.checkout');
        Route::post('/cart/products/{product}', [CommerceController::class, 'addToCart'])->name('api.v1.cart.store');
        Route::post('/wishlist', [CommerceController::class, 'toggleWishlist'])->name('api.v1.wishlist.toggle');
        Route::get('/learning/{course:slug}/{lesson?}', [LearningController::class, 'show'])->name('api.v1.learning.show');
        Route::post('/learning/{course:slug}/lessons/{lesson}/progress', [LearningController::class, 'progress'])->name('api.v1.learning.progress');
        Route::post('/learning/{course:slug}/lessons/{lesson}/notes', [LearningController::class, 'note'])->name('api.v1.learning.notes');
        Route::post('/learning/{course:slug}/lessons/{lesson}/bookmark', [LearningController::class, 'bookmark'])->name('api.v1.learning.bookmark');
    });
});
