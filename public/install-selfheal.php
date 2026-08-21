<?php

declare(strict_types=1);

/*
 * Self-healing copies of files that older uploads to shared hosts may still
 * carry in a MySQL-incompatible form.
 *
 * The older 2026_08_10_000430_add_production_foundations migration created a
 * UNIQUE index on the TEXT column `endpoint` of notification_subscriptions.
 * MySQL/MariaDB rejects that with error 1170, which breaks the whole install
 * and leaves the database without its tables (users, SMS settings, ...).
 * SQLite allows such an index, which is why the bug only shows on the host.
 *
 * The installer overwrites outdated copies with these canonical versions
 * (keeping a .bak of the old file) so re-running the installer completes even
 * if the fixed files were never re-uploaded.
 */

/**
 * @return array<string, array{marker: string, content: string}> relative path => spec
 */
function installerCanonicalFiles(): array
{
    return [
        'database/migrations/2026_08_10_000430_add_production_foundations.php' => [
            'marker' => 'endpoint_hash',
            'content' => <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->timestamp('reservation_expires_at')->nullable()->after('paid_at');
            $table->index(['status', 'reservation_expires_at']);
        });

        Schema::create('marketing_consents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->boolean('sms')->default(false);
            $table->boolean('email_marketing')->default(false);
            $table->boolean('in_app')->default(true);
            $table->timestamp('consented_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index(['phone', 'revoked_at']);
            $table->index(['email', 'revoked_at']);
            $table->unique('user_id');
        });

        Schema::create('notification_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');
            // MySQL/MariaDB cannot index TEXT columns, so uniqueness is tracked
            // through a sha256 hash of the endpoint (see controller).
            $table->string('endpoint_hash', 64);
            $table->string('public_key')->nullable();
            $table->string('auth_token')->nullable();
            $table->string('content_encoding')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'endpoint_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_subscriptions');
        Schema::dropIfExists('marketing_consents');

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropIndex(['status', 'reservation_expires_at']);
            $table->dropColumn('reservation_expires_at');
        });
    }
};
PHP,
        ],
        'database/migrations/2026_08_11_000600_add_endpoint_hash_to_notification_subscriptions.php' => [
            'marker' => "endpoint_hash', 64",
            'content' => <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('notification_subscriptions')) {
            return;
        }

        Schema::table('notification_subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('notification_subscriptions', 'endpoint_hash')) {
                $table->string('endpoint_hash', 64)->nullable()->after('endpoint');
            }
        });

        // Backfill existing rows (hash computed in PHP so it works on every driver).
        foreach (DB::table('notification_subscriptions')->whereNull('endpoint_hash')->get(['id', 'endpoint']) as $row) {
            DB::table('notification_subscriptions')->where('id', $row->id)->update([
                'endpoint_hash' => hash('sha256', (string) $row->endpoint),
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('notification_subscriptions') && Schema::hasColumn('notification_subscriptions', 'endpoint_hash')) {
            Schema::table('notification_subscriptions', function (Blueprint $table) {
                $table->dropColumn('endpoint_hash');
            });
        }
    }
};
PHP,
        ],
        'app/Models/NotificationSubscription.php' => [
            'marker' => 'hashEndpoint',
            'content' => <<<'PHP'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationSubscription extends Model
{
    protected $fillable = ['user_id', 'endpoint', 'endpoint_hash', 'public_key', 'auth_token', 'content_encoding', 'last_used_at'];

    protected function casts(): array
    {
        return ['last_used_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function hashEndpoint(string $endpoint): string
    {
        return hash('sha256', $endpoint);
    }
}
PHP,
        ],
        'app/Http/Controllers/NotificationSubscriptionController.php' => [
            'marker' => 'endpoint_hash',
            'content' => <<<'PHP'
<?php

namespace App\Http\Controllers;

use App\Models\NotificationSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'url', 'max:2048'],
            'keys.p256dh' => ['nullable', 'string', 'max:255'],
            'keys.auth' => ['nullable', 'string', 'max:255'],
            'content_encoding' => ['nullable', 'string', 'max:40'],
        ]);

        NotificationSubscription::updateOrCreate(
            ['user_id' => $request->user()->id, 'endpoint_hash' => NotificationSubscription::hashEndpoint($data['endpoint'])],
            ['endpoint' => $data['endpoint'], 'public_key' => data_get($data, 'keys.p256dh'), 'auth_token' => data_get($data, 'keys.auth'), 'content_encoding' => $data['content_encoding'] ?? null, 'last_used_at' => now()],
        );

        return response()->json(['message' => 'اشتراک اعلان ثبت شد.'], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['endpoint' => ['required', 'url', 'max:2048']]);
        NotificationSubscription::query()
            ->where('user_id', $request->user()->id)
            ->where('endpoint_hash', NotificationSubscription::hashEndpoint($request->string('endpoint')->toString()))
            ->delete();

        return response()->json(['message' => 'اشتراک اعلان حذف شد.']);
    }
}
PHP,
        ],
    ];
}

/**
 * Rewrites outdated copies of installer-critical files with the canonical
 * versions above. Old copies are kept alongside as <file>.bak and never
 * silently deleted. Returns the list of files that were fixed.
 *
 * @return array<int, string> relative paths of healed files
 */
function selfHealOutdatedFiles(string $root): array
{
    $healed = [];
    foreach (installerCanonicalFiles() as $relative => $spec) {
        $path = $root.'/'.$relative;
        $exists = is_file($path);

        if ($exists && str_contains((string) file_get_contents($path), $spec['marker'])) {
            continue; // already the fixed version
        }

        if ($exists && ! @copy($path, $path.'.bak')) {
            continue; // cannot back up -> do not touch it
        }

        $directory = dirname($path);
        if (! is_dir($directory) && ! @mkdir($directory, 0755, true)) {
            continue;
        }

        if (@file_put_contents($path, $spec['content'], LOCK_EX) !== false) {
            $healed[] = $relative;
        }
    }

    return $healed;
}
