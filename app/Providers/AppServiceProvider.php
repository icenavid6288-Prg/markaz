<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // SMS driver is pluggable: swap LogSmsSender with a real gateway driver
        // (e.g. Kavenegar) when credentials are configured.
        $this->app->bind(
            \App\Services\Sms\SmsSender::class,
            \App\Services\Sms\ConfiguredSmsSender::class,
        );
        $this->app->bind(
            \App\Services\Payments\PaymentGateway::class,
            \App\Services\Payments\ConfiguredPaymentGateway::class,
        );
    }

    public function boot(): void
    {
        Gate::before(function ($user, $ability) {
            return $user->hasRole('super-admin') ? true : null;
        });

        Model::preventLazyLoading(! app()->isProduction());
    }
}
