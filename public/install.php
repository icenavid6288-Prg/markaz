<?php

declare(strict_types=1);

/*
 * Shared-host installer.
 * It deliberately lives outside Laravel so it can create .env before the
 * framework tries to connect to the production database.
 */

$declaredRoot = dirname(__DIR__);
$root = $declaredRoot;
$lockPath = $root.'/storage/app/installed.lock';
$isHttps = (! empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') === '443');

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
    $errorNumber = 0;
    if (preg_match('/\[(\d{4})\]/', $lastMessage, $matches) === 1) {
        $errorNumber = (int) $matches[1];
    }

    $hint = match ($errorNumber) {
        1045 => 'نام کاربری یا رمز دیتابیس اشتباه است — این خطا ربطی به نام دیتابیس ندارد. رمز را در MySQL Databases با Change Password عوض کنید و دقیقاً همان را در فرم بگذارید (نه رمز ورود به cPanel/phpMyAdmin و نه رمز مدیر سایت).',
        1049 => 'دیتابیس با این نام پیدا نشد — نام کامل با پیشوند را از MySQL Databases کپی کنید.',
        1044 => 'کاربر به این دیتابیس وصل نیست — در بخش Add User To Database، کاربر را با ALL PRIVILEGES به دیتابیس اضافه کنید.',
        2002, 2003 => 'سرور MySQL پاسخ نداد — Host یا Port را بررسی کنید (معمولاً localhost و 3306) یا از پشتیبانی هاست بپرسید.',
        default => 'در هاست‌های اشتراکی Host معمولاً localhost است و نام دیتابیس/کاربر ممکن است پیشوند داشته باشد (مثلاً user_db).',
    };

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
 * Runs migrations. If a previous half-finished install left the database in a
 * broken state (orphan tables, duplicate columns, unrecorded partial runs) and
 * the database has no real user data yet, it drops every table and retries once.
 * It never wipes a database that already contains user rows.
 *
 * @return array{0: bool, 1: string}
 */
function runMigrationsWithRecovery(object $app, object $kernel, string $root): array
{
    try {
        $kernel->call('migrate', ['--force' => true]);

        return [true, ''];
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
                return [false, $message.' — دیتابیس دارای داده واقعی است؛ برای نصب تازه یا یک دیتابیس خالی دیگر بسازید یا جدول‌ها را در phpMyAdmin خالی کنید.'];
            }

            // No real data yet: wipe any half-created tables from a failed
            // attempt and retry once. dropAllTables() is provided by the
            // framework for MySQL, MariaDB, SQLite, PostgreSQL and SQL Server
            // and handles foreign keys internally.
            try {
                $schema->dropAllTables();
            } catch (Throwable $dropException) {
                return [false, $message.' — پاک‌سازی جدول‌های قبلی ناموفق بود: '.$dropException->getMessage()];
            }

            $kernel->call('migrate', ['--force' => true]);

            return [true, ''];
        } catch (Throwable $second) {
            $hint = $healed !== []
                ? ' — فایل‌های قدیمی زیر خودکار به نسخه درست بازنویسی شدند (نسخه قبلی با پسوند .bak نگهداری شد): '.implode('، ', $healed).'. اگر باز هم خطا می‌بینید، نسخه فعلی migration روی هاست هنوز مشکل دارد.'
                : '';

            return [false, $second->getMessage().$hint];
        }
    }
}

/**
 * Runs migrations, seeds and the admin creation inside the same request,
 * without calling the shell. This works on shared hosts where proc_open,
 * exec and the CLI SAPI are disabled (the old version failed there with
 * "Artisan is not available on this host").
 */
function installInProcess(string $root, array $data): array
{
    $autoload = vendorAutoloadPath($root);
    if (! is_file($autoload)) {
        [$ok, $composerOutput] = runComposerInstall($root);
        if (! $ok || ! is_file($autoload)) {
            return [1, $composerOutput];
        }
    }

    try {
        @set_time_limit(300); // some shared hosts kill long migration runs

        // Pre-emptive self-heal: replace outdated MySQL-incompatible migration
        // files before the very first migrate attempt (see install-selfheal.php).
        selfHealOutdatedFiles($root);

        require $autoload;

        $app = require $root.'/bootstrap/app.php';
        $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);

        [$migrateOk, $migrateError] = runMigrationsWithRecovery($app, $kernel, $root);
        if (! $migrateOk) {
            return [1, $migrateError];
        }
        $kernel->call('db:seed', ['--class' => 'RoleAndPermissionSeeder', '--force' => true]);

        // ContentSeeder needs an author, so create the administrator first.
        $user = \App\Models\User::query()->firstOrNew(['phone' => $data['admin_phone']]);
        $user->forceFill([
            'name' => $data['admin_name'],
            'phone' => $data['admin_phone'],
            'email' => $data['admin_email'] !== '' ? $data['admin_email'] : null,
            'password' => \Illuminate\Support\Facades\Hash::make($data['admin_password']),
            'is_active' => true,
        ])->save();
        $user->syncRoles(['super-admin']);

        $kernel->call('db:seed', ['--class' => 'SiteSettingSeeder', '--force' => true]);
        $kernel->call('db:seed', ['--class' => 'ContentSeeder', '--force' => true]);

        return [0, ''];
    } catch (Throwable $exception) {
        return [1, $exception->getMessage()];
    }
}

$root = findProjectRoot($declaredRoot);
$lockPath = $root.'/storage/app/installed.lock';
$vendorReady = is_file(vendorAutoloadPath($root));

$errors = [];
$success = false;
$commandOutput = '';
$htaccessReports = [];
$tableCount = null;
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

if (file_exists($lockPath)) {
    ensureHtaccessFiles($root);
    header('Location: /', true, 302);
    exit;
} elseif (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    foreach ($form as $key => $default) {
        $form[$key] = trim((string) ($_POST[$key] ?? $default));
    }
    $form['driver'] = $_POST['driver'] === 'sqlite' ? 'sqlite' : 'mysql';
    $form['password'] = (string) ($_POST['password'] ?? '');
    $form['admin_password'] = (string) ($_POST['admin_password'] ?? '');
    $form['db_password'] = (string) ($_POST['db_password'] ?? '');

    if (! hash_equals((string) $_SESSION['installer_csrf'], (string) ($_POST['_token'] ?? ''))) {
        $errors[] = 'درخواست نامعتبر است. صفحه را تازه‌سازی کنید و دوباره تلاش کنید.';
    }
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
        $form['database'] = trim((string) ($_POST['database'] ?? ''));
        $form['db_password'] = (string) ($_POST['db_password'] ?? '');
        if ($form['database'] === '' || $form['username'] === '') {
            $errors[] = 'نام دیتابیس و نام کاربری MySQL الزامی است.';
        }
        if (! ctype_digit($form['port']) || (int) $form['port'] < 1 || (int) $form['port'] > 65535) {
            $errors[] = 'پورت MySQL معتبر نیست.';
        }
    } else {
        $form['database'] = $root.'/database/database.sqlite';
    }

    if ($errors === []) {
        $dbError = checkDatabase([
            'driver' => $form['driver'],
            'database' => $form['database'],
            'host' => $form['host'],
            'port' => $form['port'],
            'username' => $form['username'],
            'password' => $form['db_password'],
        ]);
        if ($dbError !== null) {
            $errors[] = $dbError;
        }
    }

    if ($errors === []) {
        $envPath = $root.'/.env';
        $envContents = file_exists($envPath) ? (string) file_get_contents($envPath) : (string) file_get_contents($root.'/.env.example');
        $envContents = preg_replace('/^\[TEMPLATE\]\s*$/m', '', $envContents) ?: $envContents;
        $appKey = envValue($envContents, 'APP_KEY');
        if ($appKey === '') {
            $appKey = 'base64:'.base64_encode(random_bytes(32));
        }

        $values = [
            'APP_NAME' => $form['app_name'],
            'APP_ENV' => 'production',
            'APP_KEY' => $appKey,
            'APP_DEBUG' => 'false',
            'APP_URL' => rtrim($form['app_url'], '/'),
            'APP_LOCALE' => 'fa',
            'APP_FALLBACK_LOCALE' => 'fa',
            'DB_CONNECTION' => $form['driver'],
            'DB_DATABASE' => $form['database'],
            'DB_HOST' => $form['host'],
            'DB_PORT' => $form['port'],
            'DB_USERNAME' => $form['username'],
            'DB_PASSWORD' => $form['db_password'],
            'SESSION_DRIVER' => 'file',
            'SESSION_SECURE_COOKIE' => $isHttps ? 'true' : 'false',
            'CACHE_STORE' => 'file',
            'QUEUE_CONNECTION' => 'database',
            'FILESYSTEM_DISK' => 'local',
            'ALLOW_LEGACY_PUBLIC_DOWNLOADS' => 'false',
        ];
        foreach ($values as $key => $value) {
            $envContents = putEnvValue($envContents, $key, $value);
        }

        if (! is_writable($root) && ! (file_exists($envPath) && is_writable($envPath))) {
            $errors[] = 'ریشه پروژه یا فایل .env قابل نوشتن نیست.';
        } elseif (@file_put_contents($envPath, $envContents, LOCK_EX) === false) {
            $errors[] = 'ذخیره .env انجام نشد. مجوز نوشتن ریشه پروژه را بررسی کنید.';
        } else {
            [$exitCode, $commandOutput] = installInProcess($root, [
                'admin_name' => $form['admin_name'],
                'admin_phone' => $form['admin_phone'],
                'admin_password' => $form['admin_password'],
                'admin_email' => $form['admin_email'],
            ]);

            if ($exitCode === 0) {
                $lockDirectory = dirname($lockPath);
                @mkdir($lockDirectory, 0755, true);
                $lockWritten = @file_put_contents($lockPath, json_encode([
                    'installed_at' => gmdate(DATE_ATOM),
                    'app_url' => rtrim($form['app_url'], '/'),
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
                if ($lockWritten === false) {
                    $errors[] = 'نصب انجام شد اما قفل نصب ذخیره نشد؛ storage/app را قابل نوشتن کنید و دوباره بررسی کنید.';
                } else {
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
                        'driver' => $form['driver'],
                        'database' => $form['database'],
                        'host' => $form['host'],
                        'port' => $form['port'],
                        'username' => $form['username'],
                        'password' => $form['db_password'],
                    ]);
                    $success = true;
                }
            } else {
                $errors[] = str_contains($commandOutput, 'vendor')
                    ? 'پوشه vendor روی هاست موجود نیست. راهنمای زیر را انجام دهید و دوباره نصب کنید.'
                    : 'نصب پایگاه‌داده یا ساخت مدیر کامل نشد. خروجی فنی را بررسی کنید.';
            }
        }
    }
}

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
];
$hasRequirements = ! in_array(false, array_column($requirements, 'ok'), true);
?>
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
        @media (max-width:680px) { main { width:min(100% - 20px,920px); margin:20px auto; } .card { padding:18px; border-radius:18px; } .grid,.checks { grid-template-columns:1fr; } .full { grid-column:auto; } }
    </style>
</head>
<body>
<main>
    <div class="brand"><div class="mark">ر</div><div><h1>نصب سریع سایت</h1><p style="margin:2px 0 0">پیکربندی امن هاست، دیتابیس و مدیر اصلی</p></div></div>

    <?php if ($success): ?>
        <section class="card success">
            <h2>نصب با موفقیت انجام شد</h2>
            <p>فایل قفل نصب ایجاد شده است و این صفحه دیگر امکان اجرای دوباره ندارد. اکنون می‌توانید وارد سایت شوید و تنظیمات پیامک، پرداخت و محتوای سایت را از پنل مدیریت کامل کنید.</p>
            <p><a href="<?= h(rtrim((string) ($form['app_url'] ?? ''), '/')) ?>" style="color:var(--brand-dark);font-weight:800">ورود به سایت</a></p>
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
                <div class="check"><b class="<?= $ok ? '' : 'bad' ?>"><?= $ok ? '✓' : '×' ?></b><?= h($label) ?><?= $ok && $label === 'جدول‌های دیتابیس' ? ' ('.$tableCount.' جدول)' : '' ?></div>
                <?php endforeach; ?>
                <?php foreach ($htaccessReports as $name => $error): ?>
                    <?php if ($error !== null): ?><div class="check"><b class="bad">×</b><?= h($name).' — '.h($error) ?></div><?php endif; ?>
                <?php endforeach; ?>
            </div>
            <?php if ($layout === 'root'): ?>
                <p>فایل <code>.htaccess</code> ریشه ساخته شد تا دامنه به‌صورت خودکار از پوشه <code>public</code> سرو شود؛ ریشه دامنه حالا باید کار کند.</p>
            <?php elseif ($layout === 'parent'): ?>
                <p style="color:var(--danger)"><b>ریشه دامنه روی پوشه‌ای بالاتر از پروژه تنظیم شده است.</b> برای اینکه <code><?= h(rtrim((string) $form['app_url'], '/')) ?></code> کار کند، یا محتوای پوشه <code>public</code> را مستقیماً در ریشه دامنه آپلود کنید، یا در پنل هاست Document Root را روی پوشه <code>public</code> پروژه تنظیم کنید.</p>
            <?php elseif ($layout === 'unknown'): ?>
                <p>اگر ریشه دامنه خطای ۴۰۴ داد، مطمئن شوید Document Root هاست روی پوشه <code>public</code> پروژه تنظیم شده است.</p>
            <?php endif; ?>
            <?php if (stripos((string) ($_SERVER['SERVER_SOFTWARE'] ?? ''), 'nginx') !== false): ?>
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
        <form method="post" class="card" onsubmit="this.querySelector('button').disabled=true">
            <input type="hidden" name="_token" value="<?= h($_SESSION['installer_csrf']) ?>">
            <section>
                <h2>اطلاعات سایت</h2>
                <div class="grid">
                    <div><label for="app_name">نام سایت</label><input id="app_name" name="app_name" required value="<?= h($form['app_name']) ?>"></div>
                    <div><label for="app_url">آدرس کامل سایت</label><input id="app_url" name="app_url" type="url" required value="<?= h($form['app_url']) ?>"></div>
                </div>
            </section>
            <section style="border-top:1px solid var(--line);margin-top:24px;padding-top:24px">
                <h2>دیتابیس</h2>
                <div class="grid">
                    <div class="full"><label for="driver">نوع دیتابیس</label><select id="driver" name="driver" onchange="toggleDb()"><option value="mysql" <?= $form['driver'] === 'mysql' ? 'selected' : '' ?>>MySQL / MariaDB برای هاست</option><option value="sqlite" <?= $form['driver'] === 'sqlite' ? 'selected' : '' ?>>SQLite برای نصب سبک</option></select></div>
                    <div class="mysql"><label>Host</label><input name="host" value="<?= h($form['host']) ?>"></div><div class="mysql"><label>Port</label><input name="port" value="<?= h($form['port']) ?>"></div>
                    <div class="mysql"><label>نام دیتابیس</label><input name="database" value="<?= h($form['database']) ?>"></div><div class="mysql"><label>نام کاربری دیتابیس</label><input name="username" value="<?= h($form['username']) ?>"></div>
                    <div class="mysql full"><label>رمز دیتابیس</label><input name="db_password" type="password" autocomplete="new-password"></div>
                </div>
                <p class="hint">نصب‌کننده ابتدا اتصال را تست می‌کند و فقط در صورت موفقیت فایل <code>.env</code> را ذخیره و migrationها را اجرا می‌کند.</p>
            </section>
            <section style="border-top:1px solid var(--line);margin-top:24px;padding-top:24px">
                <h2>مدیر اصلی</h2>
                <div class="grid">
                    <div><label>نام مدیر</label><input name="admin_name" required value="<?= h($form['admin_name']) ?>"></div><div><label>شماره موبایل ورود</label><input name="admin_phone" required inputmode="tel" value="<?= h($form['admin_phone']) ?>"></div>
                    <div><label>رمز عبور</label><input name="admin_password" required type="password" minlength="10" autocomplete="new-password"></div><div><label>ایمیل اختیاری</label><input name="admin_email" type="email" value="<?= h($form['admin_email']) ?>"></div>
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
</script>
</body>
</html>
