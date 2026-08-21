<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\HomeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:60,1')->group(function (): void {
    Route::get('/home', [HomeController::class, 'index'])->name('api.v1.home');

    Route::get('/courses', [CatalogController::class, 'courses'])->name('api.v1.courses.index');
    Route::get('/courses/{course:slug}', [CatalogController::class, 'course'])->name('api.v1.courses.show');
    Route::get('/products', [CatalogController::class, 'products'])->name('api.v1.products.index');
    Route::get('/products/{product:slug}', [CatalogController::class, 'product'])->name('api.v1.products.show');

    Route::prefix('auth')->name('auth.')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])->name('register');
        Route::post('/login', [AuthController::class, 'login'])->name('login');
        Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum')->name('me');
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum')->name('logout');
    });

    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('auth:sanctum')
        ->name('api.v1.dashboard');
});
