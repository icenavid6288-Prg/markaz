<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

register_shutdown_function(static function (): void {
    $error = error_get_last();
    if (! $error || ! in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        return;
    }
    $line = date('c').' '.$error['message'].' in '.$error['file'].':'.$error['line']."\n";
    @file_put_contents(__DIR__.'/../storage/logs/php-fatal.log', $line, FILE_APPEND);
});

// Self-heal: a stale config cache forces Laravel to connect with the OLD
// credentials baked in at cache time, ignoring the current .env. If .env
// is newer than the cached config, purge the cache automatically.
$rootDir = dirname(__DIR__);
$cachedConfig = $rootDir.'/bootstrap/cache/config.php';
$envFile = $rootDir.'/.env';
if (is_file($cachedConfig) && is_file($envFile)) {
    $cachedMtime = @filemtime($cachedConfig);
    $envMtime = @filemtime($envFile);
    if ($envMtime !== false && $cachedMtime !== false && $envMtime > $cachedMtime) {
        @unlink($cachedConfig);
    }
}

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
$autoload = __DIR__.'/../vendor/autoload.php';
if (! is_file($autoload)) {
    http_response_code(503);
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>پوشه vendor نیست</title></head><body style="font-family:Tahoma,sans-serif;background:#f4f1ea;color:#16332b;padding:2rem;line-height:1.9">';
    echo '<h1>سایت بالا نمی‌آید چون پوشه vendor روی هاست نیست</h1>';
    echo '<p>فایل لازم اینجاست و پیدا نشد:</p>';
    echo '<pre style="direction:ltr;text-align:left;background:#fff;padding:1rem;border-radius:12px">'.htmlspecialchars(dirname($autoload)).'</pre>';
    echo '<p>پوشه <strong>vendor</strong> را دقیقاً کنار پوشه <strong>public</strong> و <strong>app</strong> آپلود کنید؛ نه داخل public.</p>';
    echo '<p>بعد از آپلود این فایل باید وجود داشته باشد:</p>';
    echo '<pre style="direction:ltr;text-align:left;background:#fff;padding:1rem;border-radius:12px">'.htmlspecialchars($autoload).'</pre>';
    echo '</body></html>';
    exit;
}
require $autoload;

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
