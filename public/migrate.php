<?php

declare(strict_types=1);

/*
 * migrate.php — اجرای یک‌باره‌ی مایگریشن‌ها روی هاست‌های بدون SSH.
 *
 * چرا این فایل وجود دارد؟
 *   ماژول‌های «ربات ایتا» و «اینستاگرام» جدول‌های دیتابیس خودشان را دارند
 *   (migrations با تاریخ 2026_09_03_*). اگر پروژه قبل از اضافه‌شدن این
 *   ماژول‌ها نصب شده باشد، storage/app/installed.lock وجود دارد و نصب‌کننده
 *   دیگر اجرا نمی‌شود؛ در نتیجه این جدول‌ها روی هاست ساخته نشده‌اند و صفحات
 *   پنل ایتا/اینستاگرام با خطای 500 (SQLSTATE 42S02: table not found) مواجه
 *   می‌شوند.
 *
 * نحوه استفاده:
 *   1. این فایل را در public/ هاست آپلود کنید.
 *   2. این آدرس را در مرورگر باز کنید (KEY را با مقدار زیر جایگزین کنید):
 *        https://YOUR-DOMAIN/migrate.php?key=KEY
 *   3. بعد از دیدن پیام موفقیت، همین فایل را از هاست حذف کنید.
 *
 * اگر هاست SSH دارد، به‌جای این فایل کافی است بزنید:
 *   php artisan migrate --force
 */

const MIGRATE_KEY = 'CHANGE-THIS-KEY-9f4c2b7e18d54a06';

$root = dirname(__DIR__);

header('Content-Type: text/plain; charset=utf-8');

if (MIGRATE_KEY === 'CHANGE-THIS-KEY-9f4c2b7e18d54a06') {
    http_response_code(500);
    exit("خطای پیکربندی: ابتدا مقدار MIGRATE_KEY را در بالای این فایل به یک مقدار تصادفی تغییر دهید.\n");
}

if (! isset($_GET['key']) || ! hash_equals(MIGRATE_KEY, (string) $_GET['key'])) {
    http_response_code(403);
    exit("دسترسی غیرمجاز.\n");
}

$autoload = $root.'/vendor/autoload.php';
if (! is_file($autoload)) {
    http_response_code(500);
    exit("vendor/autoload.php پیدا نشد؛ اول بسته vendor را روی هاست استخراج کنید.\n");
}

require $autoload;

$app = require $root.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

@set_time_limit(300);
@ini_set('memory_limit', '512M');

echo "== پاک‌سازی کش‌ها ==\n";
foreach (['optimize:clear'] as $command) {
    $kernel->call($command);
    echo trim($kernel->output())."\n";
}

echo "\n== اجرای migrate --force ==\n";
try {
    $kernel->call('migrate', ['--force' => true]);
    echo trim($kernel->output())."\n";
    $ok = true;
} catch (Throwable $exception) {
    echo 'مایگریشن ناموفق بود: '.$exception->getMessage()."\n";
    $ok = false;
}

if ($ok) {
    echo "\n✅ مایگریشن‌ها اجرا شد. حالا صفحات ایتا و اینستاگرام باید باز شوند.\n";
    echo "⚠️  امنیت: همین فایل (public/migrate.php) را از هاست حذف کنید.\n";
} else {
    echo "\n❌ مشکل باقی است؛ خروجی بالا را برای پشتیبانی بفرستید.\n";
}
