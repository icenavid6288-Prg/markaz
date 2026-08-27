import { useForm, usePage } from '@inertiajs/react';
import { Check, LockKeyhole, Pencil, Save, ShieldCheck, UserPlus, UsersRound } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

interface Role { id: number; name: string; label: string; description: string; users_count: number; permissions: string[]; }
interface Permission { id: number; name: string; label: string; }
interface UserOption { id: number; name: string; email: string; }
const actionLabels: Record<string, string> = { view: 'مشاهده', create: 'ایجاد', update: 'ویرایش', delete: 'حذف' };
const roleLabels: Record<string, string> = { 'super-admin': 'مدیر ارشد', admin: 'مدیر اجرایی', editor: 'ویرایشگر محتوا', instructor: 'مدرس', coach: 'کوچ', student: 'دانش‌آموز', parent: 'والد', customer: 'مشتری' };
const moduleLabels: Record<string, string> = { users: 'کاربران', roles: 'نقش‌ها', permissions: 'مجوزها', students: 'دانش‌آموزان', parents: 'والدین', instructors: 'مدرسین', coaches: 'کوچ‌ها', courses: 'دوره‌ها', lessons: 'درس‌ها', categories: 'دسته‌بندی‌ها', services: 'خدمات', products: 'محصولات', podcasts: 'پادکست‌ها', banners: 'بنرها', orders: 'سفارش‌ها', payments: 'پرداخت‌ها', coupons: 'کدهای تخفیف', blog: 'بلاگ', tags: 'برچسب‌ها', media: 'رسانه‌ها', comments: 'نظرات', reviews: 'امتیازها', testimonials: 'تجربه‌ها', faqs: 'سؤالات متداول', tickets: 'تیکت‌ها', leads: 'لیدها', pages: 'صفحات', menus: 'منوها', settings: 'تنظیمات', notifications: 'اعلان‌ها', reports: 'گزارش‌ها', coaching: 'کوچینگ', certificates: 'گواهی‌ها' };

export default function AccessIndex() {
    const { roles, permissionGroups, userOptions, canUpdate } = usePage<PageProps & { roles: Role[]; permissionGroups: Record<string, Permission[]>; userOptions: UserOption[]; canUpdate: boolean }>().props;
    const [selected, setSelected] = useState(roles[0]?.name ?? '');
    const role = roles.find((item) => item.name === selected);
    const form = useForm({ label: role?.label ?? '', description: role?.description ?? '', permissions: role?.permissions ?? [] });
    const assignForm = useForm({ user_id: '' });
    const isLocked = role?.name === 'super-admin';

    const chooseRole = (name: string) => {
        setSelected(name);
        const next = roles.find((item) => item.name === name);
        form.setData({ label: next?.label ?? '', description: next?.description ?? '', permissions: next?.permissions ?? [] });
        form.clearErrors();
    };
    const toggle = (name: string) => form.setData('permissions', form.data.permissions.includes(name) ? form.data.permissions.filter((item) => item !== name) : [...form.data.permissions, name]);
    const toggleGroup = (permissions: Permission[]) => {
        const names = permissions.map((permission) => permission.name);
        const all = names.every((name) => form.data.permissions.includes(name));
        form.setData('permissions', all ? form.data.permissions.filter((name) => !names.includes(name)) : Array.from(new Set([...form.data.permissions, ...names])));
    };
    const submit = () => form.put(`/admin/access/roles/${role?.id}`, { preserveScroll: true });
    const assignUser = () => {
        if (!role) return;
        assignForm.patch(`/admin/access/roles/${role.id}/users`, {
            preserveScroll: true,
            onSuccess: () => assignForm.reset(),
        });
    };

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8"><div className="pointer-events-none absolute -left-12 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-xs font-black text-brand-200"><ShieldCheck className="size-4" /> حاکمیت دسترسی</div><h1 className="mt-3 text-2xl font-black md:text-3xl">چه کسی، به چه چیزی دسترسی دارد؟</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">مجوزها را بر اساس نقش تنظیم کنید؛ هر عملیات حساس در سمت سرور نیز دوباره بررسی می‌شود.</p></div></section>
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
            <section className="h-fit rounded-2xl bg-white p-3 shadow-soft ring-1 ring-navy/5"><div className="px-3 pb-3 text-xs font-black text-navy/40">نقش‌های سیستم</div>{roles.map((item) => <button key={item.id} type="button" onClick={() => chooseRole(item.name)} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-right transition ${selected === item.name ? 'bg-brand-50 text-brand-700' : 'text-navy/60 hover:bg-soft-gray'}`}><span className="min-w-0"><strong className="block truncate text-sm font-black">{item.label || roleLabels[item.name] || item.name}</strong><small className="mt-0.5 block truncate text-[0.62rem] text-navy/35" dir="ltr">{item.name}</small></span><span className="mr-2 shrink-0 text-[0.65rem] text-navy/35">{item.permissions.length}</span></button>)}</section>
            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5 md:p-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-navy/5 pb-5"><div><div className="text-xs font-bold text-brand-700">مشخصات نقش</div><h2 className="mt-1 text-xl font-black text-navy">{role?.label || roleLabels[role?.name ?? ''] || role?.name}</h2><div className="mt-1 text-xs text-navy/40" dir="ltr">{role?.name}</div></div><div className="flex items-center gap-2">{role && <span className="inline-flex items-center gap-1 rounded-xl bg-soft-gray px-3 py-2 text-xs font-black text-navy/55"><UsersRound className="size-4" />{role.users_count} کاربر</span>}{isLocked && <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700"><LockKeyhole className="size-4" /> مجوزها قفل است</div>}</div></div>
                {role && <div className="mb-6 grid gap-4 md:grid-cols-2"><div><label htmlFor="role-label" className="mb-1.5 block text-xs font-black text-navy/70">عنوان نمایشی نقش</label><input id="role-label" disabled={!canUpdate} value={form.data.label} onChange={(e) => form.setData('label', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none disabled:bg-soft-gray/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />{form.errors.label && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.label}</p>}</div><div><label htmlFor="role-description" className="mb-1.5 block text-xs font-black text-navy/70">توضیحات نقش</label><textarea id="role-description" rows={3} disabled={!canUpdate} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none disabled:bg-soft-gray/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />{form.errors.description && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.description}</p>}</div></div>}
                {role && <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50/45 p-4"><div className="flex items-center gap-2"><UserPlus className="size-4 text-brand-700" /><div><h3 className="text-sm font-black text-navy">اختصاص این نقش به کاربر</h3><p className="mt-1 text-xs text-navy/45">با انتخاب کاربر، نقش «{role.label}» به او اختصاص داده می‌شود.</p></div></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select disabled={!canUpdate} value={assignForm.data.user_id} onChange={(e) => assignForm.setData('user_id', e.target.value)} className="min-w-0 flex-1 rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-soft-gray/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"><option value="">انتخاب کاربر فعال</option>{userOptions.map((user) => <option key={user.id} value={user.id}>{user.name} — {user.email}</option>)}</select><Button type="button" disabled={!canUpdate || !assignForm.data.user_id || assignForm.processing} onClick={assignUser} loading={assignForm.processing}><UserPlus className="size-4" />اختصاص نقش</Button></div>{assignForm.errors.user_id && <p className="mt-1 text-xs font-bold text-red-600">{assignForm.errors.user_id}</p>}</div>}
                <div className="mb-4 flex items-center justify-between"><div><h3 className="text-base font-black text-navy">مجوزهای نقش</h3><p className="mt-1 text-xs text-navy/45">عملیات قابل انجام توسط کاربران دارای این نقش را مشخص کنید.</p></div>{canUpdate ? <Button type="button" onClick={submit} loading={form.processing}><Pencil className="size-4" />ذخیره تغییرات</Button> : <span className="rounded-xl bg-soft-gray px-3 py-2 text-xs font-black text-navy/45">فقط مشاهده</span>}</div>
                <div className="grid gap-4 md:grid-cols-2">{Object.entries(permissionGroups).map(([module, permissions]) => { const all = permissions.every((permission) => form.data.permissions.includes(permission.name)); return <div key={module} className="rounded-2xl border border-navy/7 bg-soft-gray/45 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-black text-navy">{moduleLabels[module] ?? module}</h3><button type="button" disabled={isLocked || !canUpdate} onClick={() => toggleGroup(permissions)} className="text-[0.68rem] font-black text-brand-700 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-40">{all ? 'لغو همه' : 'انتخاب همه'}</button></div><div className="grid grid-cols-2 gap-2">{permissions.map((permission) => <label key={permission.name} className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold ${isLocked || !canUpdate ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-white'}`}><input type="checkbox" disabled={isLocked || !canUpdate} checked={form.data.permissions.includes(permission.name)} onChange={() => toggle(permission.name)} className="size-3.5 rounded border-navy/20 text-brand-600 focus:ring-brand-500" /><span>{actionLabels[permission.name.split(' ')[0]] ?? permission.name.split(' ')[0]}</span>{form.data.permissions.includes(permission.name) && <Check className="mr-auto size-3 text-brand-600" />}</label>)}</div></div>; })}</div>
            </section>
        </div>
    </div>;
}

AccessIndex.layout = (page: ReactNode) => <AdminLayout title="نقش‌ها و دسترسی‌ها">{page}</AdminLayout>;
