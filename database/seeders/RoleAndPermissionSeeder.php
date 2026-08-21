<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $modules = [
            'users', 'roles', 'permissions', 'students', 'parents', 'instructors', 'coaches',
            'courses', 'lessons', 'categories', 'services', 'products', 'podcasts', 'banners',
            'orders', 'payments', 'coupons', 'blog', 'tags', 'media', 'comments', 'reviews',
            'testimonials', 'faqs', 'tickets', 'leads', 'pages', 'menus', 'settings',
            'notifications', 'reports', 'coaching', 'certificates', 'marketing', 'surveys', 'team',
        ];

        $permissions = [];
        foreach ($modules as $module) {
            $permissions[] = "view {$module}";
            $permissions[] = "create {$module}";
            $permissions[] = "update {$module}";
            $permissions[] = "delete {$module}";
        }
        $permissions[] = 'manage all';
        $permissions[] = 'run marketing';

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        $superAdmin = Role::findOrCreate('super-admin');
        $superAdmin->syncPermissions(Permission::all());

        $admin = Role::findOrCreate('admin');
        $admin->syncPermissions(array_filter($permissions, fn ($p) => ! in_array($p, [
            'manage all',
            'delete roles', 'delete permissions',
        ])));

        $editor = Role::findOrCreate('editor');
        $editor->syncPermissions([
            'view blog', 'create blog', 'update blog',
            'view categories', 'create categories', 'update categories',
            'view tags', 'create tags', 'update tags',
            'view media', 'create media', 'update media', 'delete media',
            'view pages', 'create pages', 'update pages',
            'view menus', 'create menus', 'update menus',
            'view testimonials', 'create testimonials', 'update testimonials',
            'view faqs', 'create faqs', 'update faqs',
            'view banners', 'create banners', 'update banners',
            'view comments', 'update comments',
            'view reviews', 'update reviews',
            'view reports', 'view surveys', 'create surveys', 'update surveys',
        ]);

        $instructor = Role::findOrCreate('instructor');
        $instructor->syncPermissions([
            'view courses', 'create courses', 'update courses',
            'view lessons', 'create lessons', 'update lessons',
            'view students', 'view reviews', 'view reports',
        ]);

        $coach = Role::findOrCreate('coach');
        $coach->syncPermissions([
            'view coaching', 'create coaching', 'update coaching',
            'view students', 'view reports',
        ]);

        $student = Role::findOrCreate('student');
        $student->syncPermissions(['view courses']);

        $parent = Role::findOrCreate('parent');
        $parent->syncPermissions(['view courses']);

        $customer = Role::findOrCreate('customer');
        $customer->syncPermissions(['view courses']);
    }
}
