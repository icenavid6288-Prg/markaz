<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = collect(['view marketing', 'create marketing', 'update marketing', 'delete marketing', 'run marketing'])
            ->map(fn (string $name) => Permission::findOrCreate($name, 'web'));

        $role = Role::where('name', 'admin')->where('guard_name', 'web')->first();
        $role?->givePermissionTo($permissions->all());

        // A stale Spatie permission cache (24h TTL) can keep hiding the
        // اتومارکتینگ menu item from admins even after this migration ran.
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $permissions = Permission::whereIn('name', ['view marketing', 'create marketing', 'update marketing', 'delete marketing', 'run marketing'])
            ->where('guard_name', 'web')
            ->get();

        $role = Role::where('name', 'admin')->where('guard_name', 'web')->first();
        if ($role) {
            $role->revokePermissionTo($permissions->all());
        }

        $permissions->each->delete();
    }
};
