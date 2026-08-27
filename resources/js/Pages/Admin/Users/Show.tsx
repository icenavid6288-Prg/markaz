import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Check, GraduationCap, Mail, Pencil, Phone, Save, ShieldCheck, ShoppingBag, UserCog, UsersRound, X } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import { formatDate, formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface RoleOption {
    value: string;
    label: string;
}

interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    is_active: boolean;
    created_at?: string | null;
    roles: string[];
    enrollments_count: number;
    orders_count: number;
    student?: {
        grade?: string | null;
        school?: string | null;
        birth_date?: string | null;
        talents: string[];
        interests: string[];
        parent?: { name: string; email: string } | null;
    } | null;
    parent_profile?: {
        relation?: string | null;
        children: Array<{ name?: string | null; email?: string | null; grade?: string | null }>;
    } | null;
    instructor?: {
        specialty?: string | null;
        bio?: string | null;
        experience_years?: number | null;
        is_featured: boolean;
    } | null;
    coach?: {
        specialty?: string | null;
        bio?: string | null;
        experience_years?: number | null;
        rating?: number | null;
        is_available: boolean;
    } | null;
    recent_enrollments: Array<{ id: number; course?: string | null; status: string; progress_percent: number; enrolled_at?: string | null }>;
    recent_orders: Array<{ id: number; order_number: string; status: string; total: number; paid_at?: string | null; created_at?: string | null }>;
}

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

const enrollmentStatus: Record<string, string> = { active: 'در حال یادگیری', completed: 'تکمیل‌شده', cancelled: 'لغوشده' };
const orderStatus: Record<string, string> = { cart: 'سبد خرید', pending: 'در انتظار پرداخت', paid: 'پرداخت موفق', failed: 'ناموفق', cancelled: 'لغوشده', refunded: 'مرجوع‌شده' };

export default function UserShow() {
    const { user, roleOptions, canUpdate } = usePage<PageProps & { user: UserProfile; roleOptions: RoleOption[]; canUpdate: boolean }>().props;
    const form = useForm({ name: user.name, email: user.email, phone: user.phone ?? '', role: user.roles[0] ?? '' });
    const roleValue = (item: RoleOption | string) => typeof item === 'string' ? item : item.value;
    const roleDisplay = (item: RoleOption | string) => typeof item === 'string' ? roleLabels[item] ?? item : item.label;

    const submit = () => form.patch(`/admin/users/${user.id}`, { preserveScroll: true });
    const toggle = () => {
        if (confirm(`${user.is_active ? 'غیرفعال کردن' : 'فعال کردن'} حساب «${user.name}»؟`)) {
            router.patch(`/admin/users/${user.id}/toggle-active`, {}, { preserveScroll: true });
        }
    };

    return <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 transition hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به مدیریت کاربران</Link>
            <div className="flex gap-2"><button type="button" onClick={toggle} className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${user.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}><UserCog className="ml-1 inline size-4" />{user.is_active ? 'غیرفعال کردن حساب' : 'فعال کردن حساب'}</button></div>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-center gap-5">
                <span className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-deep-green text-3xl font-black shadow-lift">{user.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black md:text-3xl">{user.name}</h1><span className={`rounded-lg px-2.5 py-1 text-[0.65rem] font-black ${user.is_active ? 'bg-emerald-400/15 text-emerald-200' : 'bg-red-400/15 text-red-200'}`}>{user.is_active ? 'فعال' : 'غیرفعال'}</span></div><p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/60"><span dir="ltr">{user.email}</span>{user.phone && <span dir="ltr">{user.phone}</span>}</p><div className="mt-3 flex flex-wrap gap-1.5">{user.roles.length > 0 ? user.roles.map((role) => <span key={role} className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-black text-brand-100">{roleLabels[role] ?? role}</span>) : <span className="text-xs text-white/50">بدون نقش</span>}</div></div>
                <div className="text-left text-xs text-white/45"><span className="block">شناسه کاربر</span><strong className="mt-1 block text-lg text-white" dir="ltr">#{user.id}</strong></div>
            </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3"><div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"><span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><GraduationCap className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{formatNumber(user.enrollments_count)}</strong><span className="text-xs font-bold text-navy/45">دوره ثبت‌نام‌شده</span></div></div><div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"><span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><ShoppingBag className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{formatNumber(user.orders_count)}</strong><span className="text-xs font-bold text-navy/45">سفارش</span></div></div><div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"><span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><UsersRound className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{formatDate(user.created_at)}</strong><span className="text-xs font-bold text-navy/45">تاریخ عضویت</span></div></div></section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5 md:p-6"><div className="mb-5 flex items-center justify-between border-b border-navy/5 pb-4"><div><div className="text-xs font-bold text-brand-700">اطلاعات حساب</div><h2 className="mt-1 text-lg font-black text-navy">مشخصات کاربر و نقش</h2></div><Pencil className="size-5 text-brand-600" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="profile-name" className="mb-1.5 block text-xs font-black text-navy/70">نام و نام خانوادگی</label><input id="profile-name" disabled={!canUpdate} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none disabled:bg-soft-gray/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />{form.errors.name && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.name}</p>}</div><div><label htmlFor="profile-email" className="mb-1.5 block text-xs font-black text-navy/70">ایمیل</label><input id="profile-email" type="email" dir="ltr" disabled={!canUpdate} value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none disabled:bg-soft-gray/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />{form.errors.email && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.email}</p>}</div><div><label htmlFor="profile-phone" className="mb-1.5 block text-xs font-black text-navy/70">شماره تلفن</label><input id="profile-phone" dir="ltr" disabled={!canUpdate} value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none disabled:bg-soft-gray/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />{form.errors.phone && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.phone}</p>}</div><div><label htmlFor="profile-role" className="mb-1.5 block text-xs font-black text-navy/70">نقش کاربر</label><select id="profile-role" disabled={!canUpdate} value={form.data.role} onChange={(e) => form.setData('role', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm outline-none disabled:bg-soft-gray/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"><option value="">انتخاب نقش</option>{roleOptions.map((item) => <option key={roleValue(item)} value={roleValue(item)}>{roleDisplay(item)}</option>)}</select>{form.errors.role && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.role}</p>}</div></div>{canUpdate && <div className="mt-5 flex justify-end"><Button type="button" onClick={submit} loading={form.processing}><Save className="size-4" />ذخیره مشخصات و نقش</Button></div>}</section>

            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5 md:p-6"><div className="mb-5 border-b border-navy/5 pb-4"><div className="text-xs font-bold text-brand-700">ارتباطات و پروفایل</div><h2 className="mt-1 text-lg font-black text-navy">داده‌های تکمیلی</h2></div>{user.student && <div className="rounded-xl bg-brand-50/60 p-4 text-sm"><strong className="block text-brand-800">پروفایل دانش‌آموز</strong><div className="mt-3 grid gap-2 text-xs font-bold text-navy/60 sm:grid-cols-2"><span>پایه: {user.student.grade || 'ثبت نشده'}</span><span>مدرسه: {user.student.school || 'ثبت نشده'}</span><span>تولد: {user.student.birth_date || 'ثبت نشده'}</span>{user.student.parent && <span>والد: {user.student.parent.name}</span>}</div>{(user.student.talents.length > 0 || user.student.interests.length > 0) && <div className="mt-3 flex flex-wrap gap-1.5">{[...user.student.talents, ...user.student.interests].map((item) => <span key={item} className="rounded-lg bg-white px-2 py-1 text-[0.65rem] font-black text-brand-700">{item}</span>)}</div>}</div>}{user.parent_profile && <div className="rounded-xl bg-amber-50 p-4 text-sm"><strong className="block text-amber-800">پروفایل والد</strong><p className="mt-2 text-xs font-bold text-navy/60">نسبت: {user.parent_profile.relation || 'ثبت نشده'} — {user.parent_profile.children.length} فرزند</p>{user.parent_profile.children.map((child) => <div key={child.email ?? child.name} className="mt-2 rounded-lg bg-white/70 p-2 text-xs font-bold text-navy/60">{child.name} {child.grade ? `— ${child.grade}` : ''}</div>)}</div>}{user.instructor && <div className="rounded-xl bg-indigo-50 p-4 text-sm"><strong className="block text-indigo-800">پروفایل مدرس</strong><p className="mt-2 text-xs font-bold text-navy/60">{user.instructor.specialty || 'تخصص ثبت نشده'} — {user.instructor.experience_years ?? 0} سال تجربه</p>{user.instructor.bio && <p className="mt-2 text-xs leading-6 text-navy/55">{user.instructor.bio}</p>}</div>}{user.coach && <div className="rounded-xl bg-emerald-50 p-4 text-sm"><strong className="block text-emerald-800">پروفایل کوچ</strong><p className="mt-2 text-xs font-bold text-navy/60">{user.coach.specialty || 'تخصص ثبت نشده'} — {user.coach.experience_years ?? 0} سال تجربه</p><p className="mt-2 text-xs font-bold text-navy/55">امتیاز: {user.coach.rating ?? 0} — {user.coach.is_available ? 'در دسترس' : 'خارج از دسترس'}</p></div>}{!user.student && !user.parent_profile && !user.instructor && !user.coach && <p className="rounded-xl bg-soft-gray p-4 text-sm font-bold text-navy/45">برای این کاربر پروفایل تکمیلی ثبت نشده است.</p>}</section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2"><section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5"><div className="flex items-center gap-2 border-b border-navy/5 p-5"><GraduationCap className="size-5 text-brand-700" /><h2 className="text-base font-black text-navy">آخرین دوره‌ها</h2></div>{user.recent_enrollments.length > 0 ? <div className="divide-y divide-navy/5">{user.recent_enrollments.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><strong className="block truncate text-sm font-black text-navy">{item.course || 'دوره حذف‌شده'}</strong><span className="mt-1 block text-xs text-navy/40">{formatDate(item.enrolled_at)}</span></div><div className="shrink-0 text-left"><span className="text-xs font-black text-brand-700">{item.progress_percent}%</span><span className="mt-1 block text-[0.65rem] font-bold text-navy/45">{enrollmentStatus[item.status] ?? item.status}</span></div></div>)}</div> : <p className="p-8 text-center text-sm font-bold text-navy/40">هنوز در دوره‌ای ثبت‌نام نشده است.</p>}</section><section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5"><div className="flex items-center gap-2 border-b border-navy/5 p-5"><ShoppingBag className="size-5 text-brand-700" /><h2 className="text-base font-black text-navy">آخرین سفارش‌ها</h2></div>{user.recent_orders.length > 0 ? <div className="divide-y divide-navy/5">{user.recent_orders.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-4"><div><strong className="block text-sm font-black text-navy" dir="ltr">{item.order_number}</strong><span className="mt-1 block text-xs text-navy/40">{formatDate(item.created_at)}</span></div><div className="shrink-0 text-left"><strong className="block text-sm font-black text-navy">{formatNumber(item.total)} تومان</strong><span className="mt-1 block text-[0.65rem] font-bold text-navy/45">{orderStatus[item.status] ?? item.status}</span></div></div>)}</div> : <p className="p-8 text-center text-sm font-bold text-navy/40">هنوز سفارشی ثبت نشده است.</p>}</section></div>
    </div>;
}

UserShow.layout = (page: ReactNode) => <AdminLayout title="پرونده کاربر">{page}</AdminLayout>;
