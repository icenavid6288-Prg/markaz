<?php

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\Request;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$kernel->handle(Request::create('/up', 'GET'));

$config = $app['config'];
$config->set('database.connections.probe', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => false]);
$config->set('database.default', 'probe');
\Artisan::call('migrate', ['--force' => true]);
\Artisan::call('db:seed', ['--class' => 'RoleAndPermissionSeeder', '--force' => true]);

$admin = User::factory()->create()->assignRole('admin');
$user = User::factory()->create(['name' => 'دانش‌آموز گزارش']);
Enrollment::create([
    'user_id' => $user->id,
    'course_id' => App\Models\Course::factory()->create(['title' => 'دوره گزارش'])->id,
    'status' => 'active',
    'enrolled_at' => now(),
]);

auth()->login($admin);
$response = $kernel->handle(Request::create('/admin/reports/enrollments.csv', 'GET'));

echo 'STATUS: '.$response->getStatusCode()."\n";
echo 'CLASS: '.get_class($response)."\n";
echo 'CONTENT-TYPE: '.$response->headers->get('content-type')."\n";
$content = method_exists($response, 'sendContent') && $response instanceof Illuminate\Http\Response ? $response->getContent() : '';
echo 'IS_STREAMED: '.($response instanceof Symfony\Component\HttpFoundation\StreamedResponse ? 'yes' : 'no')."\n";
if ($response instanceof Symfony\Component\HttpFoundation\StreamedResponse) {
    ob_start(function (string $buffer): string {
        $GLOBALS['captured'] = ($GLOBALS['captured'] ?? '').$buffer;
        return '';
    });
    try {
        $response->sendContent();
        ob_end_clean();
    } catch (Throwable $e) {
        ob_end_clean();
        echo 'THREW: '.get_class($e).': '.$e->getMessage().' @ '.$e->getFile().':'.$e->getLine()."\n";
    }
}
$captured = $GLOBALS['captured'] ?? '';
echo 'CAPTURED_LEN: '.strlen($captured)."\n";
echo 'CAPTURED_HEAD: '.substr($captured, 0, 200)."\n";
