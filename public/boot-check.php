<?php

declare(strict_types=1);

/**
 * Temporary diagnostics for a 500 after install. Delete this file after the site works.
 */
header('Content-Type: text/html; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', '1');

$root = dirname(__DIR__);
$lines = [];
$ok = static function (string $label, bool $pass, string $detail = '') use (&$lines): void {
    $lines[] = ($pass ? '[OK]  ' : '[ERR] ').$label.($detail !== '' ? ' — '.$detail : '');
};

$ok('PHP', PHP_VERSION_ID >= 80200, PHP_VERSION);
foreach (['pdo', 'mbstring', 'openssl', 'fileinfo', 'tokenizer', 'json', 'ctype', 'tokenizer', 'xml'] as $ext) {
    $ok('ext '.$ext, extension_loaded($ext));
}
$ok('vendor/autoload.php', is_file($root.'/vendor/autoload.php'));
$ok('bootstrap/app.php', is_file($root.'/bootstrap/app.php'));
$ok('storage writable', is_writable($root.'/storage'));
$ok('storage/framework/views writable', is_writable($root.'/storage/framework/views'));
$ok('bootstrap/cache writable', is_writable($root.'/bootstrap/cache'));
$ok('public/build/manifest.json', is_file($root.'/public/build/manifest.json'));
$ok('.env', is_file($root.'/.env'));

echo '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>بررسی بوت</title>';
echo '<body style="font-family:Tahoma,sans-serif;max-width:860px;margin:32px auto;line-height:1.8">';
echo '<h1>بررسی خطای ۵۰۰</h1><pre dir="ltr" style="white-space:pre-wrap;background:#111;color:#eee;padding:16px;border-radius:12px">';
echo htmlspecialchars(implode("\n", $lines), ENT_QUOTES, 'UTF-8')."\n\n";

try {
    require $root.'/vendor/autoload.php';
    echo "autoload: OK\n";
    $app = require $root.'/bootstrap/app.php';
    echo 'bootstrap: '.get_class($app)."\n";
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    echo 'kernel bootstrap: OK\n';
    echo 'app env: '.$app->environment()."\n";
    echo 'debug: '.($app->hasDebugModeEnabled() ? 'true' : 'false')."\n";
} catch (Throwable $exception) {
    echo "BOOT EXCEPTION:\n".$exception."\n";
}

$log = $root.'/storage/logs/laravel.log';
$fatal = $root.'/storage/logs/php-fatal.log';
foreach (['laravel.log' => $log, 'php-fatal.log' => $fatal] as $name => $path) {
    echo "\n----- {$name} -----\n";
    if (! is_file($path)) {
        echo "(missing)\n";
        continue;
    }
    $text = (string) file_get_contents($path);
    echo htmlspecialchars(substr($text, -4000), ENT_QUOTES, 'UTF-8');
}

echo '</pre><p>بعد از رفع خطا این فایل را حذف کنید: <code>public/boot-check.php</code></p></body></html>';
