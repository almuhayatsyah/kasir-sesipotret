<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

        <title inertia>{{ config('app.name', 'Kasir Sesi Potret') }}</title>

        <!-- ── PWA Manifest ─────────────────────────── -->
        <link rel="manifest" href="/manifest.json">

        <!-- ── Theme & Splash ───────────────────────── -->
        <meta name="theme-color" content="#0D1B2A">
        <meta name="background-color" content="#0D1B2A">

        <!-- ── Android / Chrome PWA ─────────────────── -->
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="application-name" content="Kasir Sesi Potret">

        <!-- ── Apple / iOS PWA ──────────────────────── -->
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Sesi Potret">
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png">
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png">
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png">
        <link rel="apple-touch-icon" sizes="96x96"   href="/icons/icon-96x96.png">

        <!-- ── Windows / IE Tile ─────────────────────── -->
        <meta name="msapplication-TileColor" content="#0D1B2A">
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png">

        <!-- ── Favicon ──────────────────────────────── -->
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png">
        <link rel="icon" type="image/png" sizes="96x96"   href="/icons/icon-96x96.png">
        <link rel="shortcut icon" href="/favicon.ico">

        <!-- ── SEO ──────────────────────────────────── -->
        <meta name="description" content="Aplikasi Kasir & Point of Sale untuk Sesi Potret Coffee Shop">
        <meta name="robots" content="noindex, nofollow">

        <!-- ── Fonts ─────────────────────────────────── -->
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        <!-- ── Scripts ───────────────────────────────── -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-brand-sand text-brand-navy selection:bg-brand-teal selection:text-white">
        @inertia
    </body>
</html>
