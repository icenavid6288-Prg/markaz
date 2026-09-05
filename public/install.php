<?php

declare(strict_types=1);

/*
 * Shared-host installer.
 * It deliberately lives outside Laravel so it can create .env before the
 * framework tries to connect to the production database.
 *
 * The install runs as a sequence of short AJAX steps (one request per step).
 * Shared hosts kill long-running requests with a bare 500 after a few
 * minutes; with per-step requests every step finishes in seconds, the state
 * lives in the PHP session, and any interrupted step can simply be retried —
 * the install resumes exactly where it stopped.
 */

$declaredRoot = dirname(__DIR__);
$root = $declaredRoot;
$isHttps = (! empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');

// ---- extract-bundle endpoint (called by deploy.sh for FTP hosts) ----
if (isset($_GET['extract-bundle']) && $_GET['extract-bundle'] === '1') {
    header('Content-Type: text/plain; charset=utf-8');
    $bundle = $root.'/markaz-deploy-vendor-build.tar.gz';
    if (! is_file($bundle)) {
        http_response_code(404);
        echo "BUNDLE_NOT_FOUND\n";
        exit;
    }
    if (! class_exists(PharData::class)) {
        http_response_code(500);
        echo "PHAR_MISSING\n";
        exit;
    }
    try {
        @set_time_limit(0);
        @ini_set('memory_limit', '512M');
        $archive = new PharData($bundle);
        $archive->extractTo($root, null, true);
        echo "EXTRACTED\n";
    } catch (Throwable $exception) {
        http_response_code(500);
        echo "EXTRACT_FAILED: ".$exception->getMessage()."\n";
    }
    exit;
}
// ---- end extract-bundle ----

// Self-heal module: rewrites outdated copies of installer-critical files that
// shared hosts may still carry in a MySQL-incompatible form (see the file).
require __DIR__.'/install-selfheal.php';

session_name('markaz_installer');
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => $isHttps,
    'path' => '/',
]);
session_start();

if (empty($_SESSION['installer_csrf'])) {
    $_SESSION['installer_csrf'] = bin2hex(random_bytes(32));
}

/* ---- fatal-error surfacing ---- */

$installerStreaming = false; // true once startInstallStream() has emitted output
$installerAjax = false;      // true while serving the JSON step endpoint

/**
 * Turns any fatal PHP error that happens mid-install (memory limit, hard
 * max_execution_time, unexpected Error) into an actionable Persian card on
 * the installer page (or a retryable JSON error in AJAX mode) instead of a
 * bare 500 with no explanation.
 */
register_shutdown_function(static function (): void {
    $error = error_get_last();
    if ($error === null) {
        return;
    }
    if (! in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
        return;
    }
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }
    $message = (string) ($error['message'] ?? '');

    if (! empty($GLOBALS['installerAjax'])) {
        echo json_encode([
            'ok' => false,
            'done' => true,
            'error' => 'خطای PHP در سرور: '.$message.' — دکمه «تلاش دوباره» را بزنید؛ نصب از همان مرحله ادامه پیدا می‌کند.',
        ], JSON_UNESCAPED_UNICODE);

        return;
    }

    if (empty($GLOBALS['installerStreaming'])) {
        return;
    }
    $cause = str_contains($message, 'Maximum execution time')
        ? 'سرور هاست زمان اجرای درخواست را محدود کرده است (timeout).'
        : (stripos($message, 'memory') !== false
            ? 'حافظهٔ سرور (memory limit) برای تکمیل نصب کافی نبود.'
            : 'این خطا معمولاً به محدودیت هاست در اجرای طولانی برمی‌گردد.');
    echo '<section class="card errors"><h2>نصب قطع شد — خطای PHP</h2>'
        .'<p>متن خطا: <code dir="ltr">'.h($message).'</code></p>'
        .'<p>'.$cause.'</p>'
        .'<p><b>صفحه را تازه‌سازی کنید و دوباره «شروع نصب امن» را بزنید.</b> مراحلِ انجام‌شده (پوشه vendor، فایل .env و جدول‌های دیتابیس) ذخیره شده‌اند و نصب از همان‌جا ادامه پیدا می‌کند؛ بار دوم معمولاً خیلی سریع‌تر تمام می‌شود.</p>'
        .'</section>';
});

/**
 * Emits the shared page shell: doctype, <head> with styles, <body>, <main>
 * and the brand header. Called either at the normal render point at the
 * bottom of the file or early in streaming mode before the heavy steps run.
 */
function renderPageHead(): void
{
    global $pageHeadDone;
    $pageHeadDone = true;
    echo <<<'HTML'
<!doctype html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>نصب مرکز رشد و کارآفرینی</title>
    <style>
        :root { color-scheme: light; --ink:#14231f; --muted:#61736c; --line:#dce9e3; --brand:#0c8b62; --brand-dark:#076044; --bg:#f3f8f5; --danger:#a33b32; }
        * { box-sizing: border-box; }
        body { margin:0; min-height:100vh; background:radial-gradient(circle at 80% 0%,#d9f3e8 0,transparent 36%),var(--bg); color:var(--ink); font-family:Tahoma,Arial,sans-serif; }
        main { width:min(920px,calc(100% - 32px)); margin:40px auto; }
        .brand { display:flex; align-items:center; gap:12px; margin-bottom:22px; }
        .mark { width:48px; height:48px; display:grid; place-items:center; border-radius:15px; background:var(--brand); color:#fff; font-weight:800; font-size:21px; }
        h1 { margin:0; font-size:clamp(22px,4vw,34px); } h2 { margin:0 0 16px; font-size:20px; } p { line-height:1.9; color:var(--muted); }
        .card { background:#fff; border:1px solid var(--line); border-radius:24px; padding:24px; margin-bottom:16px; box-shadow:0 14px 45px rgba(31,78,61,.08); }
        .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:15px; } .full { grid-column:1/-1; }
        label { display:block; color:var(--ink); font-weight:700; font-size:13px; margin-bottom:7px; } input,select { width:100%; border:1px solid #cdded7; border-radius:12px; padding:12px 13px; background:#fbfefd; color:var(--ink); font:inherit; } input:focus,select:focus { outline:3px solid #c9efe0; border-color:var(--brand); }
        .hint { font-size:12px; color:var(--muted); margin-top:6px; } .errors { border-color:#efc3be; background:#fff6f5; color:var(--danger); } .errors p { color:var(--danger); margin:5px 0; }
        .checks { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 18px; } .check { color:var(--muted); font-size:13px; } .check b { color:#138457; margin-left:5px; } .check b.bad { color:var(--danger); }
        button { border:0; border-radius:13px; padding:13px 20px; background:var(--brand); color:#fff; cursor:pointer; font:inherit; font-weight:800; } button:hover { background:var(--brand-dark); } button:disabled { opacity:.5; cursor:not-allowed; }
        .success { border-color:#a9ddca; background:#f1fff8; } .success h2 { color:var(--brand-dark); } code { direction:ltr; unicode-bidi:plaintext; background:#edf4f1; padding:2px 6px; border-radius:5px; }
        ol.steps-list { line-height:2.2; color:var(--ink); padding-inline-start:22px; } ol.steps-list li.running { color:var(--brand-dark); font-weight:800; } ol.steps-list li.done { color:var(--muted); } ol.steps-list li.failed { color:var(--danger); font-weight:800; }
        #js-log { white-space:pre-wrap; background:#0d201a; color:#b9f0d8; padding:12px 14px; border-radius:12px; font-size:12px; line-height:1.9; max-height:260px; overflow-y:auto; }
        @media (max-width:680px) { main { width:min(100% - 20px,920px); margin:20px auto; } .card { padding:18px; border-radius:18px; } .grid,.checks { grid-template-columns:1fr; } .full { grid-column:auto; } }
    </style>
</head>
<body>
<main>
    <div class="brand"><div class="mark">ر</div><div><h1>نصب سریع سایت</h1><p style="margin:2px 0 0">پیکربندی امن هاست، دیتابیس و مدیر اصلی</p></div></div>
HTML;
}

/**
 * Switches a POST install into streaming mode: sends the page shell plus an
 * open progress <pre> to the browser, lifts time/memory limits as far as the
 * host allows and disables output buffering so every step is flushed
 * immediately. The caller closes the <pre>/</section> in a finally block.
 *
 * This is the no-JavaScript fallback; browsers with JS use the per-step
 * AJAX flow instead (see runInstallerStep and the script at the bottom).
 */
function startInstallStream(): void
{
    global $installerStreaming;
    $installerStreaming = true;

    @header('X-Accel-Buffering: no'); // nginx: don't buffer the whole response
    @set_time_limit(0);               // hosts that honor it let us finish
    @ini_set('max_execution_time', '0');
    @ini_set('memory_limit', '512M');
    @ignore_user_abort(true);         // keep working if the browser gives up first

    while (ob_get_level() > 0) {
        @ob_end_flush();
    }

    renderPageHead();
    echo '<section class="card"><h2>در حال نصب…</h2>'
        .'<p>لطفاً صفحه را نبندید و دکمه نصب را دوباره فشار ندهید؛ مراحل زیر به‌ترتیب اجرا می‌شوند. اگر سرور هاست درخواست را قطع کرد و خطای ۵۰۰ دیدید، فقط صفحه را تازه‌سازی و دوباره «شروع نصب امن» را بزنید — نصب از همان مرحله‌ای که مانده ادامه پیدا می‌کند.</p>'
        .'<pre id="install-log" dir="ltr" style="white-space:pre-wrap;background:#0d201a;color:#b9f0d8;padding:12px 14px;border-radius:12px;font-size:12px;line-height:1.9">';
    @ob_flush();
    @flush();
}

/**
 * Progress callback used by the no-JS streaming pipeline: appends one step
 * line to the streaming <pre> and flushes it to the browser immediately.
 */
function installStep(string $message): void
{
    echo h($message)."\n";
    @ob_flush();
    @flush();
}

/**
 * Calls the optional progress callback when one is attached.
 */
function installerProgress(?callable $onStep, string $message): void
{
    if ($onStep !== null) {
        $onStep($message);
    }
}

/**
 * Appends one line to a persistent install log so a failed install can be
 * diagnosed afterwards (storage/logs/install-progress.log).
 */
function installerLogLine(string $message): void
{
    global $root;
    if (! isset($root) || $root === '') {
        return;
    }
    $dir = $root.'/storage/logs';
    if (! is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    @file_put_contents($dir.'/install-progress.log', '['.gmdate('Y-m-d H:i:s').' UTC] '.$message."\n", FILE_APPEND | LOCK_EX);
}

/* Detect where the domain root points so we can warn (and auto-fix) when the
   app is not served from its public/ folder — the most common cause of a 404
   right after a successful install. */
$layout = 'unknown';
$publicRoot = $root.'/public';
$docRoot = rtrim(str_replace('\\', '/', (string) ($_SERVER['DOCUMENT_ROOT'] ?? '')), '/');
$rootReal = realpath($root);
$publicReal = realpath($publicRoot);
$docReal = $docRoot !== '' ? (realpath($docRoot) ?: $docRoot) : '';
if ($docReal !== '' && $publicReal !== false && $rootReal !== false) {
    $docNorm = rtrim(str_replace('\\', '/', $docReal), '/');
    $rootNorm = rtrim(str_replace('\\', '/', $rootReal), '/');
    $publicNorm = rtrim(str_replace('\\', '/', $publicReal), '/');
    if ($docNorm === $publicNorm) {
        $layout = 'ok';
    } elseif ($docNorm === $rootNorm) {
        $layout = 'root'; // doc root = project folder → fixable with a root .htaccess
    } else {
        $layout = 'parent'; // doc root is above the project folder
    }
}
$GLOBALS['installerLayout'] = $layout;

function h(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function looksLikeProjectRoot(string $path): bool
{
    return is_file($path.'/bootstrap/app.php') && is_file($path.'/artisan');
}

function findProjectRoot(string $fallback): string
{
    $candidates = [];
    foreach ([$fallback, dirname($fallback), dirname(__DIR__), __DIR__, dirname(__DIR__, 2)] as $candidate) {
        $candidate = rtrim(str_replace('\\', '/', $candidate), '/');
        if ($candidate !== '' && ! in_array($candidate, $candidates, true)) {
            $candidates[] = $candidate;
        }
    }

    foreach ($candidates as $candidate) {
        if (looksLikeProjectRoot($candidate)) {
            return $candidate;
        }
    }

    return $fallback;
}

function vendorAutoloadPath(string $root): string
{
    return $root.'/vendor/autoload.php';
}

function vendorMissingMessage(string $root): string
{
    return "پوشه vendor در مسیر پروژه پیدا نشد.\n"
        ."مسیر بررسی‌شده: ".$root."/vendor/autoload.php\n"
        ."راه‌حل (روی رایانه خود، نه روی هاست):\n"
        ."1) در پوشه پروژه اجرا کنید: composer install --no-dev --optimize-autoloader\n"
        ."2) کل پوشه vendor را کنار پوشه‌های app و public روی هاست آپلود کنید.\n"
        ."3) صفحه نصب را تازه‌سازی کنید.";
}

function shellAllowed(string $function): bool
{
    if (! function_exists($function)) {
        return false;
    }

    $disabled = array_map('trim', explode(',', (string) ini_get('disable_functions')));

    return ! in_array($function, $disabled, true);
}

function runComposerInstall(string $root): array
{
    if (is_file(vendorAutoloadPath($root))) {
        return [true, 'vendor از قبل موجود است.'];
    }

    if (! is_file($root.'/composer.json') || ! is_file($root.'/composer.lock')) {
        return [false, 'فایل composer.json یا composer.lock روی هاست نیست.'];
    }

    if (! shellAllowed('exec') && ! shellAllowed('proc_open')) {
        return [false, vendorMissingMessage($root)."\nهاست اجازه اجرای دستور composer را نمی‌دهد؛ باید پوشه vendor را خودتان آپلود کنید."];
    }

    $phar = $root.'/composer.phar';
    if (! is_file($phar)) {
        $downloaded = @file_get_contents('https://getcomposer.org/download/latest-stable/composer.phar', false, stream_context_create([
            'http' => ['timeout' => 45, 'follow_location' => 1],
            'https' => ['timeout' => 45, 'follow_location' => 1],
        ]));
        if (is_string($downloaded) && str_starts_with($downloaded, '#!') && @file_put_contents($phar, $downloaded, LOCK_EX) !== false) {
            @chmod($phar, 0755);
        }
    }

    $php = (defined('PHP_BINARY') && PHP_BINARY !== '') ? PHP_BINARY : 'php';
    $command = is_file($phar)
        ? escapeshellarg($php).' '.escapeshellarg($phar).' install --no-dev --optimize-autoloader --no-interaction --working-dir='.escapeshellarg($root)
        : 'composer install --no-dev --optimize-autoloader --no-interaction --working-dir='.escapeshellarg($root);

    $output = [];
    $code = 1;
    if (shellAllowed('exec')) {
        exec($command.' 2>&1', $output, $code);
    }

    if ($code === 0 && is_file(vendorAutoloadPath($root))) {
        return [true, implode("\n", $output)];
    }

    return [false, vendorMissingMessage($root)."\nخروجی composer:\n".implode("\n", $output)];
}

function envQuote(string $value): string
{
    return "'".str_replace(['\\', "'"], ['\\\\', "\\'"], $value)."'";
}

function putEnvValue(string $contents, string $key, string $value): string
{
    $line = $key.'='.envQuote($value);
    $pattern = '/^'.preg_quote($key, '/').'=.*$/m';

    if (preg_match($pattern, $contents) === 1) {
        return (string) preg_replace($pattern, $line, $contents, 1);
    }

    return rtrim($contents)."\n".$line."\n";
}

function envValue(string $contents, string $key): string
{
    if (preg_match('/^'.preg_quote($key, '/').'=(.*)$/m', $contents, $matches) !== 1) {
        return '';
    }

    return trim($matches[1], " \t\r\n'\"");
}

/**
 * Removes every regenerable cache file from bootstrap/cache. A config cache
 * left by a previous install or deploy would otherwise override the .env the
 * installer just wrote — the classic cause of an "Access denied" (1045) that
 * reports credentials the user never typed (e.g. root with no password).
 *
 * @return ?string null on success, otherwise an actionable Persian message.
 */
function clearConfigCache(string $root): ?string
{
    $stuck = [];
    foreach ((array) glob($root.'/bootstrap/cache/*.php') as $cachedFile) {
        if (@unlink((string) $cachedFile) === false && is_file((string) $cachedFile)) {
            $stuck[] = basename((string) $cachedFile);
        }
    }

    return $stuck === []
        ? null
        : 'حذف کش قدیمی bootstrap/cache انجام نشد: '.implode('، ', $stuck).' — این فایل‌ها را از طریق فایل منیجر هاست دستی حذف کنید و دوباره تلاش کنید.';
}

/**
 * Translates a MySQL PDO error message into the actionable Persian hint.
 * Returns '' for unknown codes so callers can fall back to generic advice.
 */
function dbErrorHint(string $message): string
{
    $errorNumber = 0;
    if (preg_match('/\[(\d{4})\]/', $message, $matches) === 1) {
        $errorNumber = (int) $matches[1];
    }

    return match ($errorNumber) {
        1045 => 'نام کاربری یا رمز دیتابیس اشتباه است — این خطا ربطی به نام دیتابیس ندارد. رمز را در MySQL Databases با Change Password عوض کنید و دقیقاً همان را در فرم بگذارید (نه رمز ورود به cPanel/phpMyAdmin و نه رمز مدیر سایت).',
        1049 => 'دیتابیس با این نام پیدا نشد — نام کامل با پیشوند را از MySQL Databases کپی کنید.',
        1044 => 'کاربر به این دیتابیس وصل نیست — در بخش Add User To Database، کاربر را با ALL PRIVILEGES به دیتابیس اضافه کنید.',
        2002, 2003 => 'سرور MySQL پاسخ نداد — Host یا Port را بررسی کنید (معمولاً localhost و 3306) یا از پشتیبانی هاست بپرسید.',
        default => '',
    };
}

function checkDatabase(array $data): ?string
{
    if ($data['driver'] === 'sqlite') {
        $path = $data['database'];
        $directory = dirname($path);

        if (! is_dir($directory) && ! @mkdir($directory, 0755, true)) {
            return 'پوشه دیتابیس قابل ساخت نیست: '.$directory;
        }

        if (! file_exists($path) && @touch($path) === false) {
            return 'فایل SQLite قابل ساخت یا نوشتن نیست: '.$path;
        }

        if (! is_writable($path)) {
            return 'فایل SQLite قابل نوشتن نیست. مجوز فایل را روی ۶۶۴ یا ۶۶۰ تنظیم کنید.';
        }

        try {
            new PDO('sqlite:'.$path, null, null, [PDO::ATTR_TIMEOUT => 5]);
        } catch (Throwable $exception) {
            return 'اتصال SQLite برقرار نشد: '.$exception->getMessage();
        }

        return null;
    }

    if (! in_array('mysql', PDO::getAvailableDrivers(), true)) {
        return 'در PHP سرور، افزونه PDO_MySQL فعال نیست.';
    }

    $host = $data['host'];
    $port = $data['port'];
    $database = $data['database'];
    $username = $data['username'];
    $password = $data['password'];

    // Many shared hosts only accept "localhost" (unix socket) and reject
    // 127.0.0.1 (TCP), so retry with localhost automatically.
    $attempts = $host === '127.0.0.1'
        ? [['127.0.0.1', $port], ['localhost', $port]]
        : [[$host, $port]];
    $lastMessage = '';

    foreach ($attempts as [$tryHost, $tryPort]) {
        try {
            $pdo = new PDO(
                "mysql:host={$tryHost};port={$tryPort};dbname={$database};charset=utf8mb4",
                $username,
                $password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
            );
            $pdo->query('SELECT 1');

            return null;
        } catch (Throwable $exception) {
            $lastMessage = $exception->getMessage();
        }
    }

    // Translate the MySQL error number into an actionable hint.
    $hint = dbErrorHint($lastMessage);
    if ($hint === '') {
        $hint = 'در هاست‌های اشتراکی Host معمولاً localhost است و نام دیتابیس/کاربر ممکن است پیشوند داشته باشد (مثلاً user_db).';
    }

    return 'اتصال MySQL برقرار نشد. جزئیات: '.$lastMessage.' — راهنمایی: '.$hint;
}

function writeIfMissing(string $path, string $contents): ?string
{
    if (file_exists($path)) {
        return null;
    }

    return @file_put_contents($path, $contents, LOCK_EX) === false
        ? 'قابل نوشتن نیست: '.$path
        : null;
}

/**
 * Makes sure public/.htaccess exists and adds a root-level forwarder that lets
 * hosts whose document root is the project folder serve the app from public/
 * without touching the server configuration.
 *
 * @return array<string, ?string> name => error message (null when ok)
 */
function ensureHtaccessFiles(string $root): array
{
    $reports = [];
    $laravelHt = "<IfModule mod_rewrite.c>\n"
        ."    <IfModule mod_negotiation.c>\n"
        ."        Options -MultiViews -Indexes\n"
        ."    </IfModule>\n\n"
        ."    RewriteEngine On\n\n"
        ."    RewriteCond %{HTTP:Authorization} .\n"
        ."    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]\n\n"
        ."    RewriteCond %{HTTP:x-xsrf-token} .\n"
        ."    RewriteRule .* - [E=HTTP_X_XSRF_TOKEN:%{HTTP:X-XSRF-Token}]\n\n"
        ."    RewriteCond %{REQUEST_FILENAME} !-d\n"
        ."    RewriteCond %{REQUEST_URI} (.+)/$\n"
        ."    RewriteRule ^ %1 [L,R=301]\n\n"
        ."    RewriteCond %{REQUEST_FILENAME} !-d\n"
        ."    RewriteCond %{REQUEST_FILENAME} !-f\n"
        ."    RewriteRule ^ index.php [L]\n"
        ."</IfModule>\n";

    $reports['public/.htaccess'] = writeIfMissing($root.'/public/.htaccess', $laravelHt);

    $forwardHt = "# Generated by the installer: forwards every request to the public/ folder.\n"
        ."<IfModule mod_rewrite.c>\n"
        ."    RewriteEngine On\n"
        ."    RewriteCond %{REQUEST_URI} !^/public/\n"
        ."    RewriteRule ^(.*)$ public/$1 [L]\n"
        ."</IfModule>\n";
    $reports['.htaccess (ریشه)'] = writeIfMissing($root.'/.htaccess', $forwardHt);

    return $reports;
}

function countDatabaseTables(array $db): ?int
{
    try {
        if ($db['driver'] === 'sqlite') {
            $pdo = new PDO('sqlite:'.$db['database'], null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

            return (int) $pdo->query("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")->fetchColumn();
        }

        $pdo = new PDO(
            "mysql:host={$db['host']};port={$db['port']};dbname={$db['database']};charset=utf8mb4",
            $db['username'],
            $db['password'],
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        return (int) $pdo->query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()')->fetchColumn();
    } catch (Throwable) {
        return null;
    }
}

/**
 * Runs pending migrations in small chunks that fit inside one HTTP request.
 *
 * Shared hosts kill a request that runs all ~50 migrations at once, which is
 * why the browser saw the «migration» step spinning forever. This version
 * runs a handful of migrations per request (max 12 seconds of work), reports
 * progress and returns done=false so the caller immediately asks for the
 * next chunk. Pending migrations are recomputed from the migrations table on
 * every call, so an interrupted chunk simply resumes on the next request —
 * no session state needed.
 *
 * If a chunk fails, the same recovery as before applies: heal outdated
 * migration files, then (only when the database holds no real user data)
 * drop the half-created tables and retry the whole run once.
 *
 * @return array{0: bool, 1: bool, 2: ?string} [ok, done, error]
 */
function runMigrationsChunked(object $app, object $kernel, string $root, ?callable $onStep = null): array
{
    installerProgress($onStep, '⏳ ساخت جدول‌های دیتابیس (migration)…');

    $relativePath = static function (string $path) use ($root): string {
        $normalizedRoot = rtrim(str_replace('\\', '/', $root), '/');
        $normalized = str_replace('\\', '/', $path);
        if (str_starts_with($normalized, $normalizedRoot.'/')) {
            return substr($normalized, strlen($normalizedRoot) + 1);
        }

        return 'database/migrations/'.basename($path);
    };

    $pendingMigrations = static function () use ($root, $app): array {
        $migrator = $app->make('migrator');
        try {
            $ran = (array) $migrator->getRepository()->getRan();
        } catch (Throwable) {
            $ran = []; // the migrations table does not exist yet
        }
        // NB: $migrator->paths() is empty outside the migrate command, so list
        // the default migration directory directly (name => absolute path).
        $files = [];
        foreach ((array) glob($root.'/database/migrations/*.php') as $file) {
            $files[basename((string) $file, '.php')] = (string) $file;
        }
        ksort($files); // chronological name order

        $pending = [];
        foreach ($files as $name => $path) {
            if (! in_array($name, $ran, true)) {
                $pending[$name] = $path;
            }
        }

        return [$pending, count($files)];
    };

    $runChunks = static function () use ($app, $kernel, $onStep, $relativePath, $pendingMigrations): array {
        $startedAt = time();
        $previousRemaining = PHP_INT_MAX;

        while (true) {
            [$pending, $total] = $pendingMigrations();
            $remaining = count($pending);

            if ($remaining === 0) {
                installerProgress($onStep, '✓ جدول‌های دیتابیس آماده شد ('.$total.' migration).');

                return [true, true, null];
            }

            // Guard against an infinite loop: if a batch ran but nothing new
            // was recorded, the migrator is not making progress.
            if ($remaining >= $previousRemaining) {
                throw new RuntimeException('اجرای migration پیشرفت نکرد (در '.($total - $remaining).' از '.$total.' متوقف ماند).');
            }
            $previousRemaining = $remaining;

            // Run a small batch (at most 5 migrations) per pass.
            $batch = array_slice($pending, 0, 5, true);
            foreach ($batch as $name => $path) {
                $exitCode = $kernel->call('migrate', ['--force' => true, '--path' => ['database/migrations/'.basename((string) $path)]]);
                if ($exitCode !== 0) {
                    throw new RuntimeException('migration ناموفق: '.$name.' — '.trim((string) $kernel->output()));
                }
                installerProgress($onStep, '⏳ اجرای migrationها: '.($total - $remaining + 1).' از '.$total.'…');
            }

            // Out of time for this request: let the caller re-invoke this step
            // (the AJAX flow retries automatically, the streaming loop too).
            if ((time() - $startedAt) >= 12) {
                installerProgress($onStep, '⏳ '.($total - $remaining).' از '.$total.' migration اجرا شد؛ ادامه در درخواست بعدی…');

                return [true, false, null];
            }
        }
    };

    try {
        return $runChunks();
    } catch (Throwable $exception) {
        $message = $exception->getMessage();

        // The most common host-only failure: the server still carries an
        // outdated migration that puts a UNIQUE index on a TEXT column, which
        // MySQL/MariaDB rejects (error 1170). Heal those files before wiping
        // so the retry can actually succeed. SQLite allows such an index, so
        // this never shows up locally.
        $healed = [];
        if (str_contains($message, '1170') || str_contains($message, "BLOB/TEXT column 'endpoint'")) {
            $healed = selfHealOutdatedFiles($root);
        }

        try {
            $connection = $app->make('db')->connection();
            $schema = $connection->getSchemaBuilder();

            // Safety guard: never wipe a database that has real user data.
            $userCount = 0;
            if ($schema->hasTable('users')) {
                try {
                    $userCount = (int) $connection->table('users')->count();
                } catch (Throwable) {
                    $userCount = 0;
                }
            }
            if ($userCount > 0) {
                return [false, true, $message.' — دیتابیس دارای داده واقعی است؛ برای نصب تازه یا یک دیتابیس خالی دیگر بسازید یا جدول‌ها را در phpMyAdmin خالی کنید.'];
            }

            // No real data yet: wipe any half-created tables from a failed
            // attempt and retry once. dropAllTables() is provided by the
            // framework for MySQL, MariaDB, SQLite, PostgreSQL and SQL Server
            // and handles foreign keys internally.
            try {
                $schema->dropAllTables();
            } catch (Throwable $dropException) {
                return [false, true, $message.' — پاک‌سازی جدول‌های قبلی ناموفق بود: '.$dropException->getMessage()];
            }

            installerProgress($onStep, '↻ جدول‌های نیمه‌کاره قبلی پاک شد؛ اجرای مجدد migration…');

            return $runChunks();
        } catch (Throwable $second) {
            $hint = $healed !== []
                ? ' — فایل‌های قدیمی زیر خودکار به نسخه درست بازنویسی شدند (نسخه قبلی با پسوند .bak نگهداری شد): '.implode('، ', $healed).'. اگر باز هم خطا می‌بینید، نسخه فعلی migration روی هاست هنوز مشکل دارد.'
                : '';

            $dbHint = dbErrorHint($second->getMessage());

            return [false, true, $second->getMessage().$hint.($dbHint !== '' ? ' — راهنمایی: '.$dbHint : '')];
        }
    }
}

/**
 * Boots the Laravel console kernel for a step that needs the framework.
 * The boot is cached per request so consecutive steps in the no-JS streaming
 * mode reuse one application instance instead of re-bootstrapping.
 *
 * @return array{0: object, 1: object} [app, console kernel]
 */
function bootLaravelKernel(string $root): array
{
    static $cached = null;
    if ($cached !== null && $cached['root'] === $root) {
        return [$cached['app'], $cached['kernel']];
    }

    require_once vendorAutoloadPath($root);
    $app = require $root.'/bootstrap/app.php';
    $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    $cached = ['root' => $root, 'app' => $app, 'kernel' => $kernel];

    return [$app, $kernel];
}

/**
 * Collects and validates the installer form from POST.
 *
 * @return array{0: array<string,mixed>, 1: array<int,string>} [form, errors]
 */
function collectAndValidateInstallerForm(string $root): array
{
    $isHttps = (! empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');
    $form = [
        'app_name' => 'مرکز رشد و کارآفرینی دکتر بیدی',
        'app_url' => (($isHttps ? 'https' : 'http').'://'.($_SERVER['HTTP_HOST'] ?? 'localhost')),
        'driver' => 'mysql',
        'host' => '127.0.0.1',
        'port' => '3306',
        'database' => '',
        'username' => '',
        'admin_name' => 'مدیر سیستم',
        'admin_phone' => '',
        'admin_email' => '',
    ];
    foreach ($form as $key => $default) {
        $form[$key] = trim((string) ($_POST[$key] ?? $default));
    }
    $form['driver'] = (($_POST['driver'] ?? 'mysql') === 'sqlite') ? 'sqlite' : 'mysql';
    $form['admin_password'] = (string) ($_POST['admin_password'] ?? '');
    $form['db_password'] = (string) ($_POST['db_password'] ?? '');

    $errors = [];
    if ($form['app_name'] === '') {
        $errors[] = 'نام سایت الزامی است.';
    }
    if (filter_var($form['app_url'], FILTER_VALIDATE_URL) === false) {
        $errors[] = 'آدرس سایت معتبر نیست.';
    }
    if (mb_strlen($form['admin_name']) < 2 || ! preg_match('/^[0-9+\-\s()]{7,20}$/', $form['admin_phone'])) {
        $errors[] = 'نام مدیر و شماره موبایل معتبر وارد کنید.';
    }
    if (mb_strlen($form['admin_password']) < 10) {
        $errors[] = 'رمز مدیر باید حداقل ۱۰ کاراکتر باشد.';
    }
    if ($form['admin_email'] !== '' && filter_var($form['admin_email'], FILTER_VALIDATE_EMAIL) === false) {
        $errors[] = 'ایمیل مدیر معتبر نیست.';
    }

    if ($form['driver'] === 'mysql') {
        $form['host'] = trim((string) ($_POST['host'] ?? $form['host'])) ?: 'localhost';
        $form['port'] = trim((string) ($_POST['port'] ?? $form['port'])) ?: '3306';
        $form['username'] = trim((string) ($_POST['username'] ?? ''));
        if ($form['database'] === '' || $form['username'] === '') {
            $errors[] = 'نام دیتابیس و نام کاربری MySQL الزامی است.';
        }
        if (! ctype_digit($form['port']) || (int) $form['port'] < 1 || (int) $form['port'] > 65535) {
            $errors[] = 'پورت MySQL معتبر نیست.';
        }
    } else {
        $form['database'] = $root.'/database/database.sqlite';
    }

    return [$form, $errors];
}

/**
 * Extracts the vendor bundle in small chunks that fit comfortably inside one
 * HTTP request. Progress (the entry list + current index) lives in the PHP
 * session, so an interrupted extraction simply resumes on the next request.
 *
 * @return array{0: bool, 1: bool, 2: ?string} [ok, done, error]
 */
function extractVendorBundleChunked(string $root, callable $onStep): array
{
    $bundle = $root.'/markaz-deploy-vendor-build.tar.gz';
    if (! is_file($bundle)) {
        return [false, true, 'پوشه vendor موجود نیست. فایل markaz-deploy-vendor-build.tar.gz را در ریشه پروژه آپلود کنید (نصب‌کننده خودش آن را استخراج می‌کند)، یا composer install را روی هاست اجرا کنید و دوباره نصب را شروع کنید.'];
    }

    if (! class_exists(PharData::class)) {
        return [false, true, 'بسته vendor پیدا شد اما افزونه Phar در PHP هاست غیرفعال است. پوشه vendor را دستی از فایل markaz-deploy-vendor-build.tar.gz استخراج و در ریشه پروژه آپلود کنید، یا composer install را اجرا کنید.'];
    }

    try {
        @set_time_limit(0);
        @ini_set('memory_limit', '512M');

        $state = $_SESSION['installer_extract'] ?? null;
        $tarPath = $root.'/markaz-deploy-vendor-build.tar';

        if (! is_array($state)) {
            installerProgress($onStep, '⏳ آماده‌سازی بسته vendor (باز کردن فایل فشرده)…');
            if (! is_file($tarPath)) {
                (new PharData($bundle))->decompress(); // creates bundle.tar next to the .gz
            }
            $archivePath = is_file($tarPath) ? $tarPath : $bundle;
            $archive = new PharData($archivePath);
            // NB: never use $archive->getPathname() for the prefix — PharData has
            // a known quirk where it returns the path of the current entry instead
            // of the archive itself, producing a doubled phar://phar:// prefix.
            $prefix = 'phar://'.rtrim(str_replace('\\', '/', $archivePath), '/');
            $entries = [];
            foreach (new RecursiveIteratorIterator($archive, RecursiveIteratorIterator::LEAVES_ONLY) as $item) {
                $rel = str_replace('\\', '/', (string) $item->getPathname());
                if (str_starts_with($rel, $prefix)) {
                    $rel = ltrim(substr($rel, strlen($prefix)), '/');
                }
                if ($rel === '' || str_contains($rel, '..')) {
                    continue;
                }
                $entries[] = ($item->isDir() ? 'd:' : 'f:').$rel;
            }
            $state = ['archive' => $archivePath, 'entries' => $entries, 'index' => 0, 'total' => count($entries)];
            $_SESSION['installer_extract'] = $state;
            installerProgress($onStep, '✓ فهرست فایل‌های بسته خوانده شد ('.count($entries).' مورد). استخراج آغاز می‌شود…');
        }

        $archivePath = (string) ($state['archive'] ?? '');
        if ($archivePath === '' || ! is_file($archivePath)) {
            $_SESSION['installer_extract'] = null;

            return [false, true, 'فایل بسته vendor در میانه استخراج پیدا نشد. فایل markaz-deploy-vendor-build.tar.gz را دوباره آپلود کنید و صفحه را تازه‌سازی کنید.'];
        }
        $archive = new PharData($archivePath);
        $entries = (array) ($state['entries'] ?? []);
        $index = (int) ($state['index'] ?? 0);
        $total = (int) ($state['total'] ?? count($entries));

        $startedAt = time();
        $processed = 0;
        $batch = [];
        while ($index < $total) {
            $entry = (string) $entries[$index];
            $isDir = str_starts_with($entry, 'd:');
            $rel = substr($entry, 2);
            if ($isDir) {
                if (! is_dir($root.'/'.$rel)) {
                    @mkdir($root.'/'.$rel, 0755, true);
                }
            } else {
                $batch[] = $rel;
            }
            $index++;
            $processed++;
            // Keep every request short: at most 100 entries or 15 seconds,
            // whichever comes first. The browser immediately asks for more.
            if ($processed >= 100 || (time() - $startedAt) >= 15) {
                break;
            }
        }
        if ($batch !== []) {
            $archive->extractTo($root, $batch, true);
        }

        $_SESSION['installer_extract'] = [
            'archive' => $archivePath,
            'entries' => $entries,
            'index' => $index,
            'total' => $total,
        ];

        if ($index < $total) {
            installerProgress($onStep, '⏳ استخراج بسته vendor: '.$index.' از '.$total.' فایل…');

            return [true, false, null]; // not done — the client calls this step again
        }

        // Extraction finished: clean up the intermediate .tar.
        $_SESSION['installer_extract'] = null;
        if (is_file($tarPath)) {
            @unlink($tarPath);
        }

        if (! is_file(vendorAutoloadPath($root))) {
            return [false, true, 'بسته vendor استخراج شد اما vendor/autoload.php ساخته نشد؛ مطمئن شوید vendor مستقیماً در ریشه پروژه (کنار artisan) قرار می‌گیرد.'];
        }

        installerProgress($onStep, '✓ استخراج بسته vendor کامل شد.');

        return [true, true, null];
    } catch (Throwable $exception) {
        $_SESSION['installer_extract'] = null;

        return [false, true, 'استخراج خودکار بسته vendor ناموفق بود: '.$exception->getMessage().' — پوشه vendor را دستی استخراج و آپلود کنید یا composer install را روی هاست اجرا کنید.'];
    }
}

/**
 * Runs one install step. Each step is short enough to finish inside a single
 * HTTP request, and every step is idempotent so it can safely be retried
 * after a host timeout — this is what makes the install resumable.
 *
 * @return array{ok: bool, done: bool, error?: string, log: array<int,string>, payload?: array<string,mixed>}
 */
function runInstallerStep(int $step, string $root, ?callable $onStep = null): array
{
    $form = $_SESSION['installer_form'] ?? null;
    if (! is_array($form)) {
        return [
            'ok' => false,
            'done' => true,
            'error' => 'اطلاعات نصب در نشست پیدا نشد. صفحه را تازه‌سازی کنید و دوباره «شروع نصب امن» را بزنید.',
            'log' => [],
        ];
    }

    $collected = [];
    $onStep = static function (string $message) use (&$collected, $onStep): void {
        $collected[] = $message;
        installerLogLine($message);
        if ($onStep !== null) {
            $onStep($message);
        }
    };

    @set_time_limit(0);
    @ini_set('memory_limit', '512M');
    @ignore_user_abort(true);

    try {
        switch ($step) {
            case 0: // write .env + purge stale caches
                installerProgress($onStep, '⏳ ذخیره فایل .env…');
                $envPath = $root.'/.env';
                $envContents = is_file($envPath)
                    ? (string) file_get_contents($envPath)
                    : (string) (@file_get_contents($root.'/.env.example') ?: '');
                $envContents = preg_replace('/^\[TEMPLATE\]\s*$/m', '', $envContents) ?: $envContents;
                $appKey = envValue($envContents, 'APP_KEY');
                if ($appKey === '') {
                    $appKey = 'base64:'.base64_encode(random_bytes(32));
                }

                $values = [
                    'APP_NAME' => (string) $form['app_name'],
                    'APP_ENV' => 'production',
                    'APP_KEY' => $appKey,
                    'APP_DEBUG' => 'false',
                    'APP_URL' => rtrim((string) $form['app_url'], '/'),
                    'APP_LOCALE' => 'fa',
                    'APP_FALLBACK_LOCALE' => 'fa',
                    'DB_CONNECTION' => (string) $form['driver'],
                    'DB_DATABASE' => (string) $form['database'],
                    'DB_HOST' => ((string) $form['host'] === '127.0.0.1' ? 'localhost' : (string) $form['host']),
                    'DB_PORT' => (string) $form['port'],
                    'DB_USERNAME' => (string) $form['username'],
                    'DB_PASSWORD' => (string) $form['db_password'],
                    'SESSION_DRIVER' => 'file',
                    'SESSION_SECURE_COOKIE' => ((! empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443')) ? 'true' : 'false',
                    'CACHE_STORE' => 'file',
                    'QUEUE_CONNECTION' => 'database',
                    'FILESYSTEM_DISK' => 'local',
                    'ALLOW_LEGACY_PUBLIC_DOWNLOADS' => 'false',
                ];
                foreach ($values as $key => $value) {
                    $envContents = putEnvValue($envContents, $key, $value);
                }

                if (! is_writable($root) && ! (is_file($envPath) && is_writable($envPath))) {
                    return ['ok' => false, 'done' => true, 'error' => 'ریشه پروژه یا فایل .env قابل نوشتن نیست.', 'log' => $collected];
                }
                if (@file_put_contents($envPath, $envContents, LOCK_EX) === false) {
                    return ['ok' => false, 'done' => true, 'error' => 'ذخیره .env انجام نشد. مجوز نوشتن ریشه پروژه را بررسی کنید.', 'log' => $collected];
                }

                // A stale cached config (from a previous install or deploy) would
                // override the .env we just wrote, so purge the regenerable caches.
                installerProgress($onStep, '✓ فایل .env ذخیره شد. پاک‌سازی کش قدیمی…');
                $cacheError = clearConfigCache($root);
                if ($cacheError !== null) {
                    return ['ok' => false, 'done' => true, 'error' => $cacheError, 'log' => $collected];
                }
                installerProgress($onStep, '✓ کش‌ها پاک شد.');

                return ['ok' => true, 'done' => true, 'log' => $collected];

            case 1: // vendor bundle (chunked, resumable)
                installerProgress($onStep, '⏳ بررسی پوشه vendor…');
                if (is_file(vendorAutoloadPath($root))) {
                    $_SESSION['installer_extract'] = null;
                    installerProgress($onStep, '✓ پوشه vendor از قبل موجود است.');

                    return ['ok' => true, 'done' => true, 'log' => $collected];
                }

                [$vendorOk, $vendorDone, $vendorError] = extractVendorBundleChunked($root, $onStep);
                if (! $vendorOk) {
                    return ['ok' => false, 'done' => true, 'error' => (string) $vendorError, 'log' => $collected];
                }

                return ['ok' => true, 'done' => (bool) $vendorDone, 'log' => $collected];

            case 2: // DB connection check + migrations (with recovery)
                installerProgress($onStep, '⏳ بررسی اتصال دیتابیس…');
                $dbError = checkDatabase([
                    'driver' => (string) $form['driver'],
                    'database' => (string) $form['database'],
                    'host' => (string) $form['host'],
                    'port' => (string) $form['port'],
                    'username' => (string) $form['username'],
                    'password' => (string) $form['db_password'],
                ]);
                if ($dbError !== null) {
                    return ['ok' => false, 'done' => true, 'error' => $dbError, 'log' => $collected];
                }
                installerProgress($onStep, '✓ اتصال دیتابیس برقرار است.');

                if (! is_file(vendorAutoloadPath($root))) {
                    return ['ok' => false, 'done' => true, 'error' => 'پوشه vendor موجود نیست؛ مرحله قبلی (آماده‌سازی vendor) کامل نشده است.', 'log' => $collected];
                }

                // Pre-emptive self-heal: replace outdated MySQL-incompatible
                // migration files before the very first migrate attempt.
                selfHealOutdatedFiles($root);

                [$app, $kernel] = bootLaravelKernel($root);

                [$migrateOk, $migrateDone, $migrateError] = runMigrationsChunked($app, $kernel, $root, $onStep);
                if (! $migrateOk) {
                    return ['ok' => false, 'done' => true, 'error' => (string) $migrateError, 'log' => $collected];
                }

                return ['ok' => true, 'done' => (bool) $migrateDone, 'log' => $collected];

            case 3: // roles + first administrator
                if (! is_file(vendorAutoloadPath($root))) {
                    return ['ok' => false, 'done' => true, 'error' => 'پوشه vendor موجود نیست؛ مرحله قبلی (آماده‌سازی vendor) کامل نشده است.', 'log' => $collected];
                }

                [, $kernel] = bootLaravelKernel($root);

                installerProgress($onStep, '⏳ ساخت نقش‌ها و دسترسی‌ها…');
                $kernel->call('db:seed', ['--class' => 'RoleAndPermissionSeeder', '--force' => true]);
                installerProgress($onStep, '✓ نقش‌ها و دسترسی‌ها آماده شد.');

                // ContentSeeder needs an author, so create the administrator first.
                installerProgress($onStep, '⏳ ساخت مدیر اصلی…');
                $user = \App\Models\User::query()->firstOrNew(['phone' => (string) $form['admin_phone']]);
                $user->forceFill([
                    'name' => (string) $form['admin_name'],
                    'phone' => (string) $form['admin_phone'],
                    'email' => ((string) $form['admin_email'] !== '' ? (string) $form['admin_email'] : null),
                    'password' => \Illuminate\Support\Facades\Hash::make((string) $form['admin_password']),
                    'is_active' => true,
                ])->save();
                $user->syncRoles(['super-admin']);
                installerProgress($onStep, '✓ مدیر اصلی ساخته شد.');

                return ['ok' => true, 'done' => true, 'log' => $collected];

            case 4: // base seeders (skipped when already applied so retries are fast)
                if (! is_file(vendorAutoloadPath($root))) {
                    return ['ok' => false, 'done' => true, 'error' => 'پوشه vendor موجود نیست؛ مرحله قبلی (آماده‌سازی vendor) کامل نشده است.', 'log' => $collected];
                }

                [, $kernel] = bootLaravelKernel($root);

                if (\App\Models\Setting::query()->count() === 0) {
                    installerProgress($onStep, '⏳ ثبت تنظیمات پایه سایت…');
                    $kernel->call('db:seed', ['--class' => 'SiteSettingSeeder', '--force' => true]);
                    installerProgress($onStep, '✓ تنظیمات پایه سایت ثبت شد.');
                } else {
                    installerProgress($onStep, '✓ تنظیمات پایه سایت از قبل موجود است.');
                }

                if (\App\Models\BlogPost::query()->count() === 0) {
                    installerProgress($onStep, '⏳ ثبت محتوای نمونه (دوره‌ها، خدمات، بلاگ و…)…');
                    $kernel->call('db:seed', ['--class' => 'ContentSeeder', '--force' => true]);
                    installerProgress($onStep, '✓ محتوای نمونه ثبت شد.');
                } else {
                    installerProgress($onStep, '✓ محتوای نمونه از قبل موجود است.');
                }

                return ['ok' => true, 'done' => true, 'log' => $collected];

            case 5: // finalize: lock file, permissions, .htaccess, final checks
                $lockPath = $root.'/storage/app/installed.lock';
                installerProgress($onStep, '⏳ نهایی‌سازی نصب…');

                @mkdir(dirname($lockPath), 0755, true);
                $lockWritten = @file_put_contents($lockPath, json_encode([
                    'installed_at' => gmdate(DATE_ATOM),
                    'app_url' => rtrim((string) $form['app_url'], '/'),
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
                if ($lockWritten === false) {
                    return ['ok' => false, 'done' => true, 'error' => 'نصب انجام شد اما قفل نصب ذخیره نشد؛ storage/app را قابل نوشتن کنید و دوباره بررسی کنید.', 'log' => $collected];
                }
                @chmod($lockPath, 0600);
                @chmod($root.'/storage', 0775);
                @chmod($root.'/bootstrap/cache', 0775);
                foreach ([
                    $root.'/storage/logs',
                    $root.'/storage/framework',
                    $root.'/storage/framework/cache',
                    $root.'/storage/framework/cache/data',
                    $root.'/storage/framework/sessions',
                    $root.'/storage/framework/views',
                    $root.'/storage/app',
                    $root.'/storage/app/public',
                    $root.'/storage/app/private',
                ] as $dir) {
                    if (! is_dir($dir)) {
                        @mkdir($dir, 0775, true);
                    }
                    @chmod($dir, 0775);
                }

                $htaccessReports = ensureHtaccessFiles($root);
                $tableCount = countDatabaseTables([
                    'driver' => (string) $form['driver'],
                    'database' => (string) $form['database'],
                    'host' => (string) $form['host'],
                    'port' => (string) $form['port'],
                    'username' => (string) $form['username'],
                    'password' => (string) $form['db_password'],
                ]);

                $payload = [
                    'url' => rtrim((string) $form['app_url'], '/'),
                    'tables' => $tableCount,
                    'htaccess' => $htaccessReports,
                    'layout' => (string) ($GLOBALS['installerLayout'] ?? 'unknown'),
                    'isNginx' => stripos((string) ($_SERVER['SERVER_SOFTWARE'] ?? ''), 'nginx') !== false,
                ];

                // Secrets no longer need to sit in the session once installed.
                unset($_SESSION['installer_form'], $_SESSION['installer_extract']);
                $_SESSION['installer_done'] = $payload;

                installerProgress($onStep, '✓ نصب کامل شد؛ قفل نصب ساخته شد.');

                return ['ok' => true, 'done' => true, 'log' => $collected, 'payload' => $payload];
        }
    } catch (Throwable $exception) {
        return ['ok' => false, 'done' => true, 'error' => $exception->getMessage(), 'log' => $collected];
    }

    return ['ok' => false, 'done' => true, 'error' => 'مرحله نصب نامعتبر است.', 'log' => $collected];
}

$root = findProjectRoot($declaredRoot);
$GLOBALS['root'] = $root;
$lockPath = $root.'/storage/app/installed.lock';

/* ---- AJAX step endpoint: one short request per install step ---- */
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' && isset($_POST['ajax_step'])) {
    $GLOBALS['installerAjax'] = true;
    @ini_set('display_errors', '0'); // JSON only — PHP warnings would corrupt the response
    @header('Content-Type: application/json; charset=utf-8');

    if (file_exists($lockPath)) {
        echo json_encode(['ok' => false, 'done' => true, 'error' => 'نصب قبلاً انجام شده است.', 'redirect' => '/'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if (! hash_equals((string) $_SESSION['installer_csrf'], (string) ($_POST['_token'] ?? ''))) {
        echo json_encode(['ok' => false, 'done' => true, 'error' => 'درخواست نامعتبر است. صفحه را تازه‌سازی کنید و دوباره تلاش کنید.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $step = (int) $_POST['ajax_step'];
    if ($step === 0) {
        [$stepForm, $stepErrors] = collectAndValidateInstallerForm($root);
        if ($stepErrors !== []) {
            echo json_encode(['ok' => false, 'done' => true, 'error' => implode("\n", $stepErrors)], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $_SESSION['installer_form'] = $stepForm;
        $_SESSION['installer_extract'] = null;
        installerLogLine('install started (step mode)');
    }

    $result = runInstallerStep($step, $root, null);
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    exit;
}
/* ---- end AJAX step endpoint ---- */

$errors = [];
$success = false;
$commandOutput = '';
$htaccessReports = [];
$tableCount = null;
$pageHeadDone = false;
$installerDone = $_SESSION['installer_done'] ?? null;

if (file_exists($lockPath)) {
    ensureHtaccessFiles($root);
    header('Location: /', true, 302);
    exit;
} elseif (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    // No-JS fallback: validate the form, then run every step in one streamed
    // request. Each step is the same idempotent function the AJAX flow uses,
    // so a host timeout here can be recovered by simply retrying.
    [$form, $validationErrors] = collectAndValidateInstallerForm($root);
    $errors = $validationErrors;
    if (! hash_equals((string) $_SESSION['installer_csrf'], (string) ($_POST['_token'] ?? ''))) {
        $errors[] = 'درخواست نامعتبر است. صفحه را تازه‌سازی کنید و دوباره تلاش کنید.';
    }

    if ($errors === []) {
        $_SESSION['installer_form'] = $form;
        $_SESSION['installer_extract'] = null;
        installerLogLine('install started (no-JS streaming mode)');

        try {
            startInstallStream();

            for ($step = 0; $step <= 5; $step++) {
                $guard = 0;
                do {
                    $result = runInstallerStep($step, $root, installStep(...));
                    $guard++;
                } while (($result['ok'] ?? false) && ($result['done'] ?? true) === false && $guard < 10000);

                if (! ($result['ok'] ?? false)) {
                    $errors[] = (string) ($result['error'] ?? 'خطای نامشخص در حین نصب.');
                    break;
                }
            }

            $success = $errors === [];
            $installerDone = $_SESSION['installer_done'] ?? null;
        } catch (Throwable $exception) {
            $errors[] = 'خطای غیرمنتظره در حین نصب: '.$exception->getMessage();
        } finally {
            if ($installerStreaming) {
                echo '</pre></section>';
                @ob_flush();
                @flush();
            }
        }
    }
}

[$displayForm, ] = collectAndValidateInstallerForm($root);
$vendorReady = is_file(vendorAutoloadPath($root));
$requirements = [
    ['label' => 'PHP 8.2 یا بالاتر', 'ok' => PHP_VERSION_ID >= 80200],
    ['label' => 'PDO', 'ok' => extension_loaded('pdo')],
    ['label' => 'mbstring', 'ok' => extension_loaded('mbstring')],
    ['label' => 'OpenSSL', 'ok' => extension_loaded('openssl')],
    ['label' => 'Fileinfo', 'ok' => extension_loaded('fileinfo')],
    ['label' => 'پوشه vendor (کتابخانه‌های PHP)', 'ok' => $vendorReady],
    ['label' => 'پوشه storage قابل نوشتن', 'ok' => is_writable($root.'/storage')],
    ['label' => 'پوشه bootstrap/cache قابل نوشتن', 'ok' => is_writable($root.'/bootstrap/cache')],
    ['label' => 'پوشه vendor', 'ok' => is_file($root.'/vendor/autoload.php') || is_file($root.'/markaz-deploy-vendor-build.tar.gz')],
];
$hasRequirements = ! in_array(false, array_column($requirements, 'ok'), true);
$successUrl = (string) ($installerDone['url'] ?? '');
$tableCount = is_array($installerDone) ? ($installerDone['tables'] ?? null) : null;
$htaccessReports = is_array($installerDone) ? ($installerDone['htaccess'] ?? []) : [];
$successLayout = is_array($installerDone) ? (string) ($installerDone['layout'] ?? $layout) : $layout;
?>
<?php if (! $pageHeadDone) { renderPageHead(); } ?>

    <?php if ($success): ?>
        <section class="card success">
            <h2>نصب با موفقیت انجام شد</h2>
            <p>فایل قفل نصب ایجاد شده است و این صفحه دیگر امکان اجرای دوباره ندارد. اکنون می‌توانید وارد سایت شوید و تنظیمات پیامک، پرداخت و محتوای سایت را از پنل مدیریت کامل کنید.</p>
            <p><a href="<?= h($successUrl) ?>" style="color:var(--brand-dark);font-weight:800">ورود به سایت</a></p>
            <p>اگر صفحه اصلی خطای ۵۰۰ داد، اول <a href="boot-check.php" style="color:var(--brand-dark);font-weight:800">صفحه بررسی بوت</a> را باز کنید و متن خطا را بخوانید. پوشه‌های <code>storage</code> و <code>bootstrap/cache</code> باید مجوز ۷۷۵ داشته باشند.</p>
            <p class="hint">برای امنیت بیشتر، پس از اطمینان از کارکرد سایت، فایل <code>public/install.php</code> را از هاست حذف کنید. اگر خواستید دیتابیس را عوض کنید (مثلاً از SQLite به MySQL)، فایل‌های <code>storage/app/installed.lock</code> و <code>.env</code> را از هاست حذف کنید و دوباره <code>install.php</code> را باز کنید.</p>
        </section>
        <section class="card">
            <h2>بررسی نهایی</h2>
            <div class="checks">
                <?php foreach ([
                    ['public/index.php', is_file($root.'/public/index.php')],
                    ['public/.htaccess', is_file($root.'/public/.htaccess')],
                    ['پوشه storage قابل نوشتن', is_writable($root.'/storage')],
                    ['جدول‌های دیتابیس', $tableCount !== null && $tableCount > 0],
                ] as [$label, $ok]): ?>
                <div class="check"><b class="<?= $ok ? '' : 'bad' ?>"><?= $ok ? '✓' : '×' ?></b><?= h((string) $label) ?><?= $ok && $label === 'جدول‌های دیتابیس' ? ' ('.$tableCount.' جدول)' : '' ?></div>
                <?php endforeach; ?>
                <?php foreach ($htaccessReports as $name => $error): ?>
                    <?php if ($error !== null): ?><div class="check"><b class="bad">×</b><?= h((string) $name).' — '.h((string) $error) ?></div><?php endif; ?>
                <?php endforeach; ?>
            </div>
            <?php if ($successLayout === 'root'): ?>
                <p>فایل <code>.htaccess</code> ریشه ساخته شد تا دامنه به‌صورت خودکار از پوشه <code>public</code> سرو شود؛ ریشه دامنه حالا باید کار کند.</p>
            <?php elseif ($successLayout === 'parent'): ?>
                <p style="color:var(--danger)"><b>ریشه دامنه روی پوشه‌ای بالاتر از پروژه تنظیم شده است.</b> برای اینکه <code><?= h($successUrl) ?></code> کار کند، یا محتوای پوشه <code>public</code> را مستقیماً در ریشه دامنه آپلود کنید، یا در پنل هاست Document Root را روی پوشه <code>public</code> پروژه تنظیم کنید.</p>
            <?php elseif ($successLayout === 'unknown'): ?>
                <p>اگر ریشه دامنه خطای ۴۰۴ داد، مطمئن شوید Document Root هاست روی پوشه <code>public</code> پروژه تنظیم شده است.</p>
            <?php endif; ?>
            <?php if (! empty($installerDone['isNginx'])): ?>
                <p style="color:var(--danger)"><b>سرور nginx شناسایی شد.</b> nginx فایل <code>.htaccess</code> را نمی‌خواند؛ در تنظیمات سرور باید درخواست‌ها به <code>public/index.php</code> هدایت شوند (try_files). اگر دسترسی SSH ندارید، با پشتیبانی هاست هماهنگ کنید.</p>
            <?php endif; ?>
        </section>
    <?php else: ?>
        <?php if ($errors !== []): ?><section class="card errors"><h2>نصب کامل نشد</h2><?php foreach ($errors as $error): ?><p>• <?= nl2br(h($error)) ?></p><?php endforeach; ?><?php if ($commandOutput !== ''): ?><details open><summary>خروجی فنی</summary><pre dir="ltr" style="white-space:pre-wrap;unicode-bidi:isolate;text-align:left;font-size:12px;line-height:1.7"><?= h($commandOutput) ?></pre></details><?php endif; ?></section><?php endif; ?>
        <?php if (! $vendorReady): ?>
            <section class="card errors">
                <h2>پوشه vendor روی هاست نیست</h2>
                <p>نصب بدون کتابخانه‌های PHP ممکن نیست. این پوشه داخل Git نیست و باید جداگانه ساخته و آپلود شود.</p>
                <ol style="line-height:2;color:var(--danger);padding-inline-start:22px">
                    <li>روی رایانه خود در پوشه پروژه اجرا کنید: <code>composer install --no-dev --optimize-autoloader</code></li>
                    <li>کل پوشه <code>vendor</code> را کنار پوشه‌های <code>app</code> و <code>public</code> روی هاست آپلود کنید.</li>
                    <li>همین صفحه را تازه‌سازی کنید تا تیک «پوشه vendor» سبز شود.</li>
                </ol>
                <p class="hint">مسیر فعلی پروژه: <code><?= h($root) ?></code></p>
            </section>
        <?php endif; ?>
        <?php if ($layout === 'root'): ?>
            <section class="card" style="border-color:#e7c56b;background:#fffaf0">
                <p><b>ریشه دامنه روی پوشه پروژه تنظیم شده، نه روی <code>public</code>.</b> بعد از نصب، نصب‌کننده یک <code>.htaccess</code> در ریشه می‌سازد که همه درخواست‌ها را به <code>public</code> هدایت می‌کند تا دامنه بدون تغییر تنظیمات هاست کار کند.</p>
            </section>
        <?php elseif ($layout === 'parent'): ?>
            <section class="card" style="border-color:#efc3be;background:#fff6f5">
                <p><b>ریشه دامنه به پوشه‌ای بالاتر از پروژه اشاره می‌کند.</b> در این حالت دامنه بعد از نصب هم ۴۰۴ می‌دهد. راه‌حل: محتوای پوشه <code>public</code> را مستقیماً در ریشه دامنه آپلود کنید یا در پنل هاست Document Root را روی پوشه <code>public</code> تنظیم کنید؛ سپس دوباره <code>install.php</code> را باز کنید.</p>
            </section>
        <?php endif; ?>
        <section class="card">
            <h2>پیش‌نیازها</h2>
            <div class="checks"><?php foreach ($requirements as $requirement): ?><div class="check"><b class="<?= $requirement['ok'] ? '' : 'bad' ?>"><?= $requirement['ok'] ? '✓' : '×' ?></b><?= h($requirement['label']) ?></div><?php endforeach; ?></div>
            <p class="hint">قبل از نصب، دامنه را روی پوشه <code>public</code> پروژه تنظیم کنید. کدهای PHP و فایل‌های private نباید از مرورگر قابل دانلود باشند.</p>
        </section>

        <section id="js-progress" class="card" style="display:none">
            <h2>در حال نصب…</h2>
            <p>لطفاً این صفحه را نبندید. هر مرحله جداگانه اجرا می‌شود؛ اگر خطایی دیدید، با دکمه «تلاش دوباره» نصب دقیقاً از همان مرحله ادامه پیدا می‌کند و مراحل قبلی تکرار نمی‌شوند.</p>
            <ol class="steps-list" id="js-steps"></ol>
            <pre id="js-log" dir="ltr"></pre>
        </section>

        <form method="post" class="card" id="install-form">
            <input type="hidden" name="_token" value="<?= h($_SESSION['installer_csrf']) ?>">
            <section>
                <h2>اطلاعات سایت</h2>
                <div class="grid">
                    <div><label for="app_name">نام سایت</label><input id="app_name" name="app_name" required value="<?= h($displayForm['app_name']) ?>"></div>
                    <div><label for="app_url">آدرس کامل سایت</label><input id="app_url" name="app_url" type="url" required value="<?= h($displayForm['app_url']) ?>"></div>
                </div>
            </section>
            <section style="border-top:1px solid var(--line);margin-top:24px;padding-top:24px">
                <h2>دیتابیس</h2>
                <div class="grid">
                    <div class="full"><label for="driver">نوع دیتابیس</label><select id="driver" name="driver" onchange="toggleDb()"><option value="mysql" <?= $displayForm['driver'] === 'mysql' ? 'selected' : '' ?>>MySQL / MariaDB برای هاست</option><option value="sqlite" <?= $displayForm['driver'] === 'sqlite' ? 'selected' : '' ?>>SQLite برای نصب سبک</option></select></div>
                    <div class="mysql"><label>Host</label><input name="host" value="<?= h($displayForm['host']) ?>"></div><div class="mysql"><label>Port</label><input name="port" value="<?= h($displayForm['port']) ?>"></div>
                    <div class="mysql"><label>نام دیتابیس</label><input name="database" value="<?= h($displayForm['database']) ?>"></div><div class="mysql"><label>نام کاربری دیتابیس</label><input name="username" value="<?= h($displayForm['username']) ?>"></div>
                    <div class="mysql full"><label>رمز دیتابیس</label><input name="db_password" type="password" autocomplete="new-password"></div>
                </div>
                <p class="hint">نصب‌کننده ابتدا اتصال را تست می‌کند و فقط در صورت موفقیت فایل <code>.env</code> را ذخیره و migrationها را اجرا می‌کند.</p>
            </section>
            <section style="border-top:1px solid var(--line);margin-top:24px;padding-top:24px">
                <h2>مدیر اصلی</h2>
                <div class="grid">
                    <div><label>نام مدیر</label><input name="admin_name" required value="<?= h($displayForm['admin_name']) ?>"></div><div><label>شماره موبایل ورود</label><input name="admin_phone" required inputmode="tel" value="<?= h($displayForm['admin_phone']) ?>"></div>
                    <div><label>رمز عبور</label><input name="admin_password" required type="password" minlength="10" autocomplete="new-password"></div><div><label>ایمیل اختیاری</label><input name="admin_email" type="email" value="<?= h($displayForm['admin_email']) ?>"></div>
                </div>
                <p class="hint">رمز حداقل ۱۰ کاراکتر باشد. پس از نصب با شماره موبایل وارد شوید؛ ایمیل برای ورود الزامی نیست.</p>
            </section>
            <button type="submit" <?= $hasRequirements ? '' : 'disabled' ?>>شروع نصب امن</button>
        </form>
    <?php endif; ?>
</main>
<script>
function toggleDb(){document.querySelectorAll('.mysql').forEach(function(el){el.style.display=document.getElementById('driver').value==='mysql'?'block':'none';});}
toggleDb();

(function () {
    var form = document.getElementById('install-form');
    var panel = document.getElementById('js-progress');
    if (!form || !panel || !window.fetch) { return; }

    var token = form.querySelector('input[name="_token"]').value;
    var stepNames = [
        'ذخیره تنظیمات (.env) و پاک‌سازی کش',
        'آماده‌سازی پوشه vendor',
        'ساخت جدول‌های دیتابیس (migration)',
        'ساخت نقش‌ها و مدیر اصلی',
        'ثبت تنظیمات و محتوای پایه',
        'نهایی‌سازی نصب'
    ];
    var list = document.getElementById('js-steps');
    var logBox = document.getElementById('js-log');
    var current = 0, running = false, retries = 0;

    stepNames.forEach(function (name, i) {
        var li = document.createElement('li');
        li.id = 'step-' + i;
        li.textContent = '□ ' + name;
        list.appendChild(li);
    });

    function setMark(i, mark) {
        var li = document.getElementById('step-' + i);
        if (li) { li.textContent = mark + ' ' + stepNames[i]; }
    }

    function appendLog(lines) {
        (lines || []).forEach(function (line) {
            logBox.textContent += line + '\n';
            logBox.scrollTop = logBox.scrollHeight;
        });
    }

    function postStep(i) {
        var body = new FormData();
        body.append('_token', token);
        body.append('ajax_step', String(i));
        if (i === 0) {
            new FormData(form).forEach(function (value, key) { body.append(key, value); });
        }
        return fetch(window.location.href, { method: 'POST', body: body, credentials: 'same-origin' })
            .then(function (res) {
                if (!res.ok) { throw new Error('HTTP ' + res.status); }
                return res.json();
            });
    }

    function fail(message) {
        running = false;
        setMark(current, '×');
        var box = document.createElement('section');
        box.className = 'card errors';
        var p = document.createElement('p');
        p.textContent = message;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'تلاش دوباره از همین مرحله';
        btn.addEventListener('click', function () {
            box.remove();
            setMark(current, '□');
            running = true;
            retries = 0;
            runStep(current);
        });
        box.appendChild(p);
        box.appendChild(btn);
        panel.parentNode.insertBefore(box, panel.nextSibling);
    }

    function renderSuccess(payload) {
        panel.style.display = 'none';
        var card = document.createElement('section');
        card.className = 'card success';
        var h = document.createElement('h2');
        h.textContent = 'نصب با موفقیت انجام شد';
        card.appendChild(h);
        var p1 = document.createElement('p');
        p1.textContent = 'فایل قفل نصب ساخته شد و این صفحه دیگر اجرا نمی‌شود. حالا وارد سایت شوید و تنظیمات پیامک، پرداخت و محتوا را از پنل مدیریت کامل کنید.';
        card.appendChild(p1);
        var link = document.createElement('a');
        link.href = payload.url || '/';
        link.style.color = 'var(--brand-dark)';
        link.style.fontWeight = '800';
        link.textContent = 'ورود به سایت';
        card.appendChild(link);
        if (payload.tables !== null && payload.tables !== undefined) {
            var p2 = document.createElement('p');
            p2.textContent = 'تعداد جدول‌های ساخته‌شده در دیتابیس: ' + payload.tables;
            card.appendChild(p2);
        }
        (payload.htaccess ? Object.keys(payload.htaccess) : []).forEach(function (name) {
            if (payload.htaccess[name]) {
                var pe = document.createElement('p');
                pe.style.color = 'var(--danger)';
                pe.textContent = name + ' — ' + payload.htaccess[name];
                card.appendChild(pe);
            }
        });
        if (payload.layout === 'parent') {
            var p3 = document.createElement('p');
            p3.style.color = 'var(--danger)';
            p3.textContent = 'ریشه دامنه روی پوشه‌ای بالاتر از پروژه تنظیم شده است. Document Root هاست را روی پوشه public تنظیم کنید یا محتوای public را در ریشه دامنه آپلود کنید.';
            card.appendChild(p3);
        }
        if (payload.isNginx) {
            var p4 = document.createElement('p');
            p4.style.color = 'var(--danger)';
            p4.textContent = 'سرور nginx شناسایی شد؛ باید درخواست‌ها در تنظیمات سرور به public/index.php هدایت شوند (nginx فایل .htaccess را نمی‌خواند).';
            card.appendChild(p4);
        }
        var p5 = document.createElement('p');
        p5.className = 'hint';
        p5.textContent = 'پس از اطمینان از کارکرد سایت، فایل public/install.php را از هاست حذف کنید. اگر صفحه اصلی خطای ۵۰۰ داد، صفحه boot-check.php را باز کنید و متن خطا را بخوانید.';
        card.appendChild(p5);
        panel.parentNode.appendChild(card);
    }

    function runStep(i) {
        current = i;
        setMark(i, '⏳');
        postStep(i).then(function (data) {
            appendLog(data.log);
            if (data.redirect) { window.location.href = data.redirect; return; }
            if (!data.ok) { fail(data.error || 'نصب در این مرحله متوقف شد.'); return; }
            if (data.done === false) { retries = 0; setTimeout(function () { runStep(i); }, 300); return; }
            setMark(i, '✓');
            retries = 0;
            if (data.payload) { renderSuccess(data.payload); return; }
            runStep(i + 1);
        }).catch(function () {
            retries++;
            if (retries <= 2) {
                appendLog(['↻ پاسخ سرور قطع شد؛ تلاش مجدد خودکار…']);
                setTimeout(function () { runStep(i); }, 2000);
            } else {
                fail('سرور درخواست را قطع کرد یا پاسخ نداد (خطای ۵۰۰ هاست). دکمه «تلاش دوباره» را بزنید؛ نصب از همین مرحله ادامه پیدا می‌کند و مراحل قبلی تکرار نمی‌شوند. اگر خطا تکرار شد، متن کامل خطا در فایل storage/logs/install-progress.log ذخیره می‌شود.');
            }
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (running) { return; }
        running = true;
        panel.style.display = 'block';
        form.style.display = 'none';
        runStep(0);
    });
})();
</script>
</body>
</html>
