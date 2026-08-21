<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#087f52">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'مرکز رشد') }}">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="manifest" href="{{ url('/app-manifest.webmanifest') }}">
        <link rel="icon" href="{{ url('/app-icon') }}">
        <link rel="apple-touch-icon" href="{{ url('/app-icon') }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased overflow-x-hidden">
        @inertia
    </body>
</html>
