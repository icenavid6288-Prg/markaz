<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionController extends Controller
{
    private const ROLE_LABELS = [
        'super-admin' => 'مدیر ارشد',
        'admin' => 'مدیر اجرایی',
        'editor' => 'ویرایشگر محتوا',
        'instructor' => 'مدرس',
        'coach' => 'کوچ',
        'student' => 'دانش‌آموز',
        'parent' => 'والد',
        'customer' => 'مشتری',
    ];

    private const ROLE_DESCRIPTIONS = [
        'super-admin' => 'دسترسی کامل به همه بخش‌های سامانه.',
        'admin' => 'مدیریت اجرایی کاربران، محتوا و عملیات روزانه.',
        'editor' => 'مدیریت محتوای سایت و ارتباطات محتوایی.',
        'instructor' => 'مدیریت دوره‌ها و محتوای آموزشی مدرس.',
        'coach' => 'مدیریت جلسات کوچینگ و همراهی نوجوانان.',
        'student' => 'دسترسی کاربر دانش‌آموز به مسیرهای یادگیری.',
        'parent' => 'دسترسی والد به دوره‌ها و گزارش‌های فرزند.',
        'customer' => 'دسترسی پایه مشتری به دوره‌ها و خریدها.',
    ];

    public function index(Request $request): Response
    {
        $this->authorizeAccess($request);

        $permissions = Permission::query()->orderBy('name')->get(['id', 'name']);
        $groups = $permissions->groupBy(fn (Permission $permission) => explode(' ', $permission->name, 2)[1] ?? 'سایر')
            ->map(fn ($items) => $items->values()->map(fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'label' => $this->permissionLabel($permission->name),
            ])->values())
            ->sortKeys();

        return Inertia::render('Admin/Access/Index', [
            'roles' => Role::with('permissions:id,name')->withCount('users')->orderBy('id')->get()->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $role->label ?: (self::ROLE_LABELS[$role->name] ?? $role->name),
                'description' => $role->description ?: (self::ROLE_DESCRIPTIONS[$role->name] ?? 'برای این نقش توضیحی ثبت نشده است.'),
                'users_count' => (int) $role->users_count,
                'permissions' => $role->permissions->pluck('name')->values(),
            ]),
            'permissionGroups' => $groups,
            'userOptions' => User::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'email'])
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ])
                ->values(),
            'canUpdate' => $this->canUpdate($request),
        ]);
    }

    public function update(Request $request, string $role): RedirectResponse
    {
        abort_unless($this->canUpdate($request), 403);
        $roleModel = ctype_digit($role) ? Role::findOrFail((int) $role) : Role::findByName($role);

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ], [
            'label.required' => 'عنوان نقش الزامی است.',
            'label.max' => 'عنوان نقش نباید بیشتر از ۱۲۰ کاراکتر باشد.',
            'description.max' => 'توضیحات نقش نباید بیشتر از ۱۰۰۰ کاراکتر باشد.',
        ]);

        $roleModel->forceFill([
            'label' => trim($validated['label']),
            'description' => filled($validated['description'] ?? null) ? trim($validated['description']) : null,
        ])->save();

        if ($roleModel->name !== 'super-admin') {
            $roleModel->syncPermissions($validated['permissions'] ?? []);
        }

        return back()->with('success', "مشخصات و دسترسی‌های نقش «{$roleModel->label}» به‌روزرسانی شد.");
    }

    public function assignUser(Request $request, string $role): RedirectResponse
    {
        abort_unless($this->canUpdate($request), 403);
        $roleModel = ctype_digit($role) ? Role::findOrFail((int) $role) : Role::findByName($role);

        abort_if($roleModel->name === 'super-admin' && ! $request->user()?->hasRole('super-admin'), 403, 'فقط مدیر ارشد می‌تواند نقش مدیر ارشد را اختصاص دهد.');

        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ], [
            'user_id.required' => 'لطفاً یک کاربر انتخاب کنید.',
            'user_id.exists' => 'کاربر انتخاب‌شده معتبر نیست.',
        ]);

        $user = User::findOrFail($validated['user_id']);
        abort_if(! $user->is_active, 422, 'نقش فقط به کاربران فعال اختصاص داده می‌شود.');
        $user->syncRoles([$roleModel->name]);

        $roleLabel = $roleModel->label ?: (self::ROLE_LABELS[$roleModel->name] ?? $roleModel->name);

        return back()->with('success', "نقش «{$roleLabel}» به کاربر «{$user->name}» اختصاص داده شد.");
    }

    private function authorizeAccess(Request $request): void
    {
        abort_unless($request->user()?->can('manage all') || $request->user()?->can('view roles') || $request->user()?->can('view permissions'), 403);
    }

    private function canUpdate(Request $request): bool
    {
        return (bool) ($request->user()?->can('manage all') || $request->user()?->can('update roles'));
    }

    private function permissionLabel(string $permission): string
    {
        [$action, $module] = array_pad(explode(' ', $permission, 2), 2, '');
        $actions = [
            'view' => 'مشاهده',
            'create' => 'ایجاد',
            'update' => 'ویرایش',
            'delete' => 'حذف',
        ];

        return ($actions[$action] ?? $action).' '.$module;
    }
}
