<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Favicon -->
    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Vite + React + Tailwind -->
    @routes
    @viteReactRefresh
    @vite([
    'resources/css/app.css', {{-- ✅ dito naka-import TailwindCSS --}}
    'resources/js/app.jsx',
    "resources/js/Pages/{$page['component']}.jsx"
    ])
    @inertiaHead
</head>

<body class="font-sans antialiased bg-gray-100 text-gray-900">
    @inertia
</body>

</html>