<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia; // ✅ CORRECT


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
        Vite::prefetch(concurrency: 3);
        Inertia::share([
        'flash' => function () {
            return [
                'success' => session('success'),
                'error' => session('error'),
            ];
        },
    ]);
    }
}
