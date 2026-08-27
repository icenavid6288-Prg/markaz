import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Check, Pencil, Search, ShieldCheck, UserCog, UsersRound, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import Modal from '@/Components/Modal';
import { formatDate, formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface UserRow {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    is_active: boolean;
    created_at?: string | null;
    roles: string[];
    enrollments_count: number;
    orders_count: number;
}

interface Paginator<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
}

type RoleOption = string | { value: string; label: string };

const roleLabels: Record<string, string> = {
    'super-admin': 'مدیر ارشد',
    admin: 'مدیر اجرایی',
    editor: 'ویرایشگر محتوا',
    instructor: 'مدرس',
    coach: 'کوچ',
    student: 'دانش‌آموز',
    parent: 'والد',
    customer: 'مشتری',
};

export default function UsersIndex() {
    const { users, filters, roleOptions, summary } = usePage<PageProps & {
        users: Paginator<UserRow>;
        filters: { search?: string; role?: string; status?: string };
        roleOptions: RoleOption[];
        summary: { total: number; active: number; staff: number };
    }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState(filters.role ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [userModal, setUserModal] = useState<UserRow | null>(null);
    const userForm = useForm({ name: '', email: '', phone: '', role: '' });
    const roleValue = (item: RoleOption) => typeof item === 'string' ? item : item.value;
    const roleDisplay = (item: RoleOption) => typeof item === 'string' ? roleLabels[item] ?? item : item.label;
    const roleLabel = (name: string) => {
        const option = roleOptions.find((item) => roleValue(item) === name);
        return option ? roleDisplay(option) : roleLabels[name] ?? name;
    };

    const openUserModal = (user: UserRow) => {
        setUserModal(user);
        userForm.clearErrors();
        userForm.setData({ name: user.name, email: user.email, phone: user.phone ?? '', role: user.roles[0] ?? '' });
    };

    const closeUserModal = () => {
        setUserModal(null);
        userForm.reset();
        userForm.clearErrors();
    };

    const submitUser = () => {
        if (!userModal) return;
        userForm.patch(`/admin/users/${userModal.id}`, {
            preserveScroll: true,
            onSuccess: closeUserModal,
        });
    };

    const apply = (next = { search, role, status }) => {
        router.get('/admin/users', next, { preserveState: true, replace: true, preserveScroll: true });
    };

    const toggle = (user: UserRow) => {
        if (confirm(`${user.is_active ? 'غیرفعال کردن' : 'فعال کردن'} حساب «${user.name}»؟`)) {
            router.patch(`/admin/users/${user.id}/toggle-active`, {}, { preserveScroll: true });
        }
    };

    return <div className="flex flex-col gap-6">
        <Modal show={userModal !== null} onClose={closeUserModal} maxWidth="lg">
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-xs font-bold text-brand-700">پرونده کاربر</div>
                        <h2 className="mt-1 text-xl font-black text-navy">مشاهده و ویرایش مشخصات</h2>
                    </div>
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-lg font-black text-brand-700">{userModal?.name.slice(0, 1)}</span>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="user-name" className="mb-1.5 block text-xs font-black text-navy/70">نام و نام خانوادگی</label>
                        <input id="user-name" value={userForm.data.name} onChange={(e) => userForm.setData('name', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                        {userForm.errors.name && <p className="mt-1 text-xs font-bold text-red-600">{userForm.errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="user-email" className="mb-1.5 block text-xs font-black text-navy/70">ایمیل</label>
                        <input id="user-email" type="email" dir="ltr" value={userForm.data.email} onChange={(e) => userForm.setData('email', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                        {userForm.errors.email && <p className="mt-1 text-xs font-bold text-red-600">{userForm.errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="user-phone" className="mb-1.5 block text-xs font-black text-navy/70">شماره تلفن</label>
                        <input id="user-phone" dir="ltr" value={userForm.data.phone} onChange={(e) => userForm.setData('phone', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                        {userForm.errors.phone && <p className="mt-1 text-xs font-bold text-red-600">{userForm.errors.phone}</p>}
                    </div>
                    <div>
                        <label htmlFor="user-role" className="mb-1.5 block text-xs font-black text-navy/70">نقش کاربر</label>
                        <select id="user-role" value={userForm.data.role} onChange={(e) => userForm.setData('role', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                            <option value="">انتخاب کنید</option>
                            {roleOptions.map((item) => <option key={roleValue(item)} value={roleValue(item)}>{roleDisplay(item)}</option>)}
                        </select>
                        {userForm.errors.role && <p className="mt-1 text-xs font-bold text-red-600">{userForm.errors.role}</p>}
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-soft-gray/70 p-3 text-center text-xs font-bold text-navy/50">
                    <div><strong className="block text-base font-black text-navy">{formatNumber(userModal?.enrollments_count ?? 0)}</strong>دوره</div>
                    <div><strong className="block text-base font-black text-navy">{formatNumber(userModal?.orders_count ?? 0)}</strong>سفارش</div>
                    <div><strong className="block text-base font-black text-navy">{userModal?.is_active ? 'فعال' : 'غیرفعال'}</strong>وضعیت</div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <Button variant="secondary" type="button" onClick={closeUserModal}>انصراف</Button>
                    <Button type="button" onClick={submitUser} loading={userForm.processing}><Pencil className="size-4" />ذخیره تغییرات</Button>
                </div>
            </div>
        </Modal>
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-24 size-64 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div><span className="inline-flex items-center gap-2 text-xs font-bold text-brand-200"><UsersRound className="size-4" /> مرکز مدیریت کاربران</span><h1 className="mt-3 text-2xl font-black md:text-3xl">هر رابطه، بخشی از مسیر رشد است.</h1><p className="mt-2 text-sm text-white/60">کاربران، نقش‌ها و وضعیت دسترسی را از یک نمای زنده مدیریت کنید.</p></div>
                <div className="flex gap-2 text-center"><div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"><strong className="block text-xl font-black">{formatNumber(summary.total)}</strong><span className="text-[0.65rem] text-white/55">کل کاربران</span></div><div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"><strong className="block text-xl font-black text-brand-200">{formatNumber(summary.active)}</strong><span className="text-[0.65rem] text-white/55">فعال</span></div></div>
            </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
            {[{ label: 'کل کاربران', value: summary.total, icon: UsersRound }, { label: 'حساب‌های فعال', value: summary.active, icon: Check }, { label: 'اعضای تیم', value: summary.staff, icon: ShieldCheck }].map((item) => <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"><span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><item.icon className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{formatNumber(item.value)}</strong><span className="text-xs font-bold text-navy/45">{item.label}</span></div></div>)}
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="نام، ایمیل یا شماره تلفن..." className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></div>
                <select value={role} onChange={(e) => { setRole(e.target.value); apply({ search, role: e.target.value, status }); }} className="rounded-xl border border-navy/10 bg-white px-3 py-3 text-sm outline-none"><option value="">همه نقش‌ها</option>{roleOptions.map((item) => <option key={roleValue(item)} value={roleValue(item)}>{roleDisplay(item)}</option>)}</select>
                <select value={status} onChange={(e) => { setStatus(e.target.value); apply({ search, role, status: e.target.value }); }} className="rounded-xl border border-navy/10 bg-white px-3 py-3 text-sm outline-none"><option value="">همه وضعیت‌ها</option><option value="active">فعال</option><option value="inactive">غیرفعال</option></select>
                <button type="button" onClick={() => apply()} className="rounded-xl bg-deep-green px-5 py-3 text-sm font-black text-white transition hover:bg-brand-700">اعمال فیلتر</button>
            </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right"><thead className="border-b border-navy/5 bg-soft-gray/60 text-xs font-black text-navy/45"><tr><th className="px-5 py-4">کاربر</th><th className="px-5 py-4">نقش</th><th className="px-5 py-4">یادگیری</th><th className="px-5 py-4">خرید</th><th className="px-5 py-4">عضویت</th><th className="px-5 py-4">وضعیت</th><th className="px-5 py-4">عملیات</th></tr></thead><tbody>{users.data.map((user) => <tr key={user.id} className="border-b border-navy/5 last:border-0 hover:bg-soft-gray/40"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">{user.name.slice(0, 1)}</span><div><strong className="block text-sm font-black text-navy">{user.name}</strong><span className="block text-xs text-navy/40" dir="ltr">{user.email}</span>{user.phone && <span className="block text-[0.65rem] text-navy/35" dir="ltr">{user.phone}</span>}</div></div></td><td className="px-5 py-4"><div className="flex flex-wrap gap-1">{user.roles.map((item) => <span key={item} className="rounded-lg bg-brand-50 px-2 py-1 text-[0.65rem] font-black text-brand-700">{roleLabel(item)}</span>)}</div></td><td className="px-5 py-4 text-sm font-bold text-navy/60">{formatNumber(user.enrollments_count)} دوره</td><td className="px-5 py-4 text-sm font-bold text-navy/60">{formatNumber(user.orders_count)} سفارش</td><td className="px-5 py-4 text-xs font-bold text-navy/45">{formatDate(user.created_at)}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.65rem] font-black ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{user.is_active ? <Check className="size-3" /> : <X className="size-3" />}{user.is_active ? 'فعال' : 'غیرفعال'}</span></td><td className="px-5 py-4"><div className="flex gap-1.5"><Link href={`/admin/users/${user.id}`} className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-black text-brand-700 transition hover:bg-brand-100"><Pencil className="ml-1 inline size-3.5" />مشاهده و ویرایش</Link><button type="button" onClick={() => toggle(user)} className={`rounded-lg px-3 py-2 text-xs font-black transition ${user.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}><UserCog className="ml-1 inline size-3.5" />{user.is_active ? 'غیرفعال کردن' : 'فعال کردن'}</button></div></td></tr>)}{users.data.length === 0 && <tr><td colSpan={7} className="px-5 py-14 text-center text-sm font-bold text-navy/40">کاربری با این فیلترها پیدا نشد.</td></tr>}</tbody></table></div>
            {users.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">{users.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
    </div>;
}

UsersIndex.layout = (page: ReactNode) => <AdminLayout title="مدیریت کاربران">{page}</AdminLayout>;
