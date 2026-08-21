<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = collect(['view team', 'create team', 'update team', 'delete team'])
            ->map(fn (string $name) => Permission::findOrCreate($name, 'web'));

        $role = Role::where('name', 'admin')->where('guard_name', 'web')->first();
        $role?->givePermissionTo($permissions->all());

        // Ensure a stale Spatie permission cache can never hide the new section.
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        $permissions = Permission::whereIn('name', ['view team', 'create team', 'update team', 'delete team'])
            ->where('guard_name', 'web')
            ->get();

        $role = Role::where('name', 'admin')->where('guard_name', 'web')->first();
        if ($role) {
            $role->revokePermissionTo($permissions->all());
        }

        $permissions->each->delete();
    }
};
