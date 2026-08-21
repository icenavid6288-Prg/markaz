<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = collect(['view surveys', 'create surveys', 'update surveys', 'delete surveys'])
            ->map(fn (string $name) => Permission::findOrCreate($name, 'web'));

        foreach (['admin', 'editor'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            $role?->givePermissionTo($permissions->all());
        }
    }

    public function down(): void
    {
        $permissions = Permission::whereIn('name', ['view surveys', 'create surveys', 'update surveys', 'delete surveys'])
            ->where('guard_name', 'web')
            ->get();

        foreach (['admin', 'editor'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            if ($role) {
                $role->revokePermissionTo($permissions->all());
            }
        }

        $permissions->each->delete();
    }
};
