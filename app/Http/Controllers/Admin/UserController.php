<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Inertia\Response;

class UserController extends Controller
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

    public function index(Request $request): Response
    {
        $users = User::query()
            ->with('roles:id,name')
            ->withCount(['enrollments', 'orders'])
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = trim((string) $request->string('search'));
                $query->where(function ($nested) use ($search) {
                    $nested->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->role, fn ($query, $role) => $query->whereHas('roles', fn ($roles) => $roles->where('name', $role)))
            ->when($request->status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($request->status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at?->toISOString(),
                'roles' => $user->roles->pluck('name')->values(),
                'enrollments_count' => (int) $user->enrollments_count,
                'orders_count' => (int) $user->orders_count,
            ]),
            'filters' => $request->only(['search', 'role', 'status']),
            'roleOptions' => Role::query()
                ->where('guard_name', 'web')
                ->orderBy('id')
                ->pluck('name')
                ->values(),
            'summary' => [
                'total' => User::count(),
                'active' => User::where('is_active', true)->count(),
                'staff' => User::whereHas('roles', fn ($query) => $query->whereIn('name', ['super-admin', 'admin', 'editor', 'instructor', 'coach']))->count(),
            ],
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        $user->load([
            'roles:id,name',
            'student.parent:id,name,email',
            'parentProfile.children.user:id,name,email',
            'instructor',
            'coach',
            'enrollments' => fn ($query) => $query->with('course:id,title')->latest('enrolled_at')->limit(8),
            'orders' => fn ($query) => $query->latest()->limit(8),
        ])->loadCount(['enrollments', 'orders']);

        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'is_active' => (bool) $user->is_active,
                'created_at' => $user->created_at?->toISOString(),
                'roles' => $user->roles->pluck('name')->values(),
                'enrollments_count' => (int) $user->enrollments_count,
                'orders_count' => (int) $user->orders_count,
                'student' => $user->student ? [
                    'grade' => $user->student->grade,
                    'school' => $user->student->school,
                    'birth_date' => $user->student->birth_date?->toDateString(),
                    'talents' => $user->student->talents ?? [],
                    'interests' => $user->student->interests ?? [],
                    'parent' => $user->student->parent ? [
                        'name' => $user->student->parent->name,
                        'email' => $user->student->parent->email,
                    ] : null,
                ] : null,
                'parent_profile' => $user->parentProfile ? [
                    'relation' => $user->parentProfile->relation,
                    'children' => $user->parentProfile->children->map(fn ($child) => [
                        'name' => $child->user?->name,
                        'email' => $child->user?->email,
                        'grade' => $child->grade,
                    ])->values(),
                ] : null,
                'instructor' => $user->instructor ? [
                    'specialty' => $user->instructor->specialty,
                    'bio' => $user->instructor->bio,
                    'experience_years' => $user->instructor->experience_years,
                    'is_featured' => (bool) $user->instructor->is_featured,
                ] : null,
                'coach' => $user->coach ? [
                    'specialty' => $user->coach->specialty,
                    'bio' => $user->coach->bio,
                    'experience_years' => $user->coach->experience_years,
                    'rating' => $user->coach->rating,
                    'is_available' => (bool) $user->coach->is_available,
                ] : null,
                'recent_enrollments' => $user->enrollments->map(fn ($enrollment) => [
                    'id' => $enrollment->id,
                    'course' => $enrollment->course?->title,
                    'status' => $enrollment->status,
                    'progress_percent' => (int) $enrollment->progress_percent,
                    'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                ])->values(),
                'recent_orders' => $user->orders->map(fn ($order) => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'status' => $order->status,
                    'total' => (int) $order->total,
                    'paid_at' => $order->paid_at?->toISOString(),
                    'created_at' => $order->created_at?->toISOString(),
                ])->values(),
            ],
            'roleOptions' => Role::query()
                ->where('guard_name', 'web')
                ->orderBy('id')
                ->pluck('name')
                ->values(),
            'canUpdate' => (bool) ($request->user()?->can('manage all') || $request->user()?->can('update users')),
        ]);
    }

    public function toggleActive(User $user): RedirectResponse
    {
        abort_if($user->is(request()->user()), 422, 'حساب کاربری خودتان را نمی‌توانید غیرفعال کنید.');

        $user->update(['is_active' => ! $user->is_active]);

        return back()->with('success', $user->is_active ? 'حساب کاربر فعال شد.' : 'حساب کاربر غیرفعال شد.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:40'],
            'role' => ['required', 'string', $this->roleRule()],
        ], [
            'name.required' => 'نام کاربر الزامی است.',
            'email.required' => 'ایمیل کاربر الزامی است.',
            'email.email' => 'ایمیل واردشده معتبر نیست.',
            'email.unique' => 'این ایمیل قبلاً ثبت شده است.',
            'role.required' => 'لطفاً یک نقش انتخاب کنید.',
            'role.exists' => 'نقش انتخاب‌شده معتبر نیست.',
        ]);

        $roleChanged = $user->getRoleNames()->count() !== 1 || ! $user->hasRole($validated['role']);
        if ($roleChanged) {
            $this->assertRoleChangeAllowed($user, $validated['role']);
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ]);
        if ($roleChanged) {
            $user->syncRoles([$validated['role']]);
        }

        return back()->with('success', 'مشخصات و نقش کاربر به‌روزرسانی شد.');
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        abort_if($user->is(request()->user()), 422, 'نقش حساب کاربری خودتان را نمی‌توانید تغییر دهید.');

        $validated = $request->validate([
            'role' => ['required', 'string', $this->roleRule()],
        ], [
            'role.required' => 'لطفاً یک نقش انتخاب کنید.',
            'role.exists' => 'نقش انتخاب‌شده معتبر نیست.',
        ]);

        $this->assertRoleChangeAllowed($user, $validated['role']);
        $user->syncRoles([$validated['role']]);

        return back()->with('success', 'نقش کاربر به‌روزرسانی شد.');
    }

    private function roleRule()
    {
        return Rule::exists('roles', 'name')->where(fn ($query) => $query->where('guard_name', 'web'));
    }

    private function assertRoleChangeAllowed(User $user, string $role): void
    {
        $actor = request()->user();
        $actorIsSuperAdmin = $actor?->hasRole('super-admin') ?? false;

        abort_if($user->is($actor), 422, 'نقش حساب کاربری خودتان را نمی‌توانید تغییر دهید.');
        abort_if(($role === 'super-admin' || $user->hasRole('super-admin')) && ! $actorIsSuperAdmin, 403, 'فقط مدیر ارشد می‌تواند نقش مدیر ارشد را تغییر دهد یا اختصاص دهد.');
    }
}
