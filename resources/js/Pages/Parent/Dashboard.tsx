import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Award, BookOpen, CalendarDays, ClipboardList, HeartHandshake, TrendingUp, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import ProfessionalLayout from '@/Layouts/ProfessionalLayout';
import { formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface ChildStats { courses: number; average_progress: number; pending_assignments: number; certificates: number; upcoming_sessions: number; active_goals: number; }
interface Child { id: number; name?: string | null; avatar?: string | null; grade?: string | null; school?: string | null; stats: ChildStats; url: string; }

export default function ParentDashboard() {
    const { profile, children, stats } = usePage<PageProps & { profile: { name: string; relation?: string | null }; children: Child[]; stats: { children_count: number; courses_count: number; average_progress: number; pending_assignments: number; certificates: number; upcoming_sessions: number } }>().props;

    return <ProfessionalLayout role="parent"><div className="mx-auto flex max-w-7xl flex-col gap-7">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-7 text-white shadow-lift md:p-9">
            <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
                <div><span className="text-xs font-bold text-brand-200">فضای والدین</span><h2 className="mt-3 text-3xl font-black">سلام {profile.name.split(' ')[0]}، مسیر فرزندتان را دنبال کنید</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">پیشرفت دوره‌ها، تکالیف، آزمون‌ها، جلسات کوچینگ و گواهینامه‌های فرزندتان را یکجا ببینید و همراه مسیر رشدش باشید.</p></div>
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-deep-green hover:bg-brand-100"><HeartHandshake className="size-4" /> گفتگو با مرکز</Link>
            </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
                { label: 'فرزندان', value: stats.children_count, icon: Users },
                { label: 'دوره‌های در حال پیگیری', value: stats.courses_count, icon: BookOpen },
                { label: 'میانگین پیشرفت فرزندان', value: `${formatNumber(stats.average_progress)}٪`, icon: TrendingUp },
                { label: 'تکالیف در انتظار تصحیح', value: stats.pending_assignments, icon: ClipboardList },
                { label: 'گواهینامه‌های اخذشده', value: stats.certificates, icon: Award },
                { label: 'جلسات کوچینگ پیش‌رو', value: stats.upcoming_sessions, icon: CalendarDays },
            ].map((item) => <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft"><span className="panel-stat-icon"><item.icon className="size-5" /></span><div><strong className="block text-2xl font-black text-navy">{typeof item.value === 'number' ? formatNumber(item.value) : item.value}</strong><span className="text-xs font-bold text-navy/45">{item.label}</span></div></div>)}
        </section>

        <section id="children" className="scroll-mt-24">
            <div className="mb-4"><div className="dashboard-eyebrow"><span /> فرزندان من</div><h2 className="mt-2 text-xl font-black text-navy">فرزندانی که به حساب شما متصل‌اند</h2><p className="mt-2 text-sm text-navy/50">برای دیدن جزئیات پیشرفت و گزارش‌ها، روی فرزند موردنظر کلیک کنید. اگر حساب فرزند ساخته شده، با شماره موبایلش او را وصل کنید.</p></div>
            <LinkChildForm />
            <div className="grid gap-5 md:grid-cols-2">
                {children.length > 0 ? children.map((child) => <Link key={child.id} href={child.url} className="group flex flex-col gap-5 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
                    <div className="flex items-center gap-4">
                        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-deep-green text-lg font-black text-white">{child.avatar ? <img src={child.avatar} alt={child.name ?? ''} className="size-full object-cover" /> : (child.name?.slice(0, 1) ?? '؟')}</span>
                        <div className="min-w-0 flex-1"><h3 className="text-base font-black text-navy group-hover:text-brand-700">{child.name ?? 'فرزند'}</h3><p className="mt-1 text-xs font-bold text-navy/45">{[child.grade, child.school].filter(Boolean).join(' · ') || '—'}</p></div>
                        <ArrowLeft className="size-4 shrink-0 text-navy/25 transition-transform group-hover:-translate-x-1 group-hover:text-brand-600" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-soft-gray/70 py-3"><div className="text-lg font-black text-brand-700">{formatNumber(child.stats.average_progress)}٪</div><div className="text-[0.62rem] font-bold text-navy/40">میانگین پیشرفت</div></div>
                        <div className="rounded-xl bg-soft-gray/70 py-3"><div className="text-lg font-black text-navy">{formatNumber(child.stats.pending_assignments)}</div><div className="text-[0.62rem] font-bold text-navy/40">تکلیف در انتظار</div></div>
                        <div className="rounded-xl bg-soft-gray/70 py-3"><div className="text-lg font-black text-navy">{formatNumber(child.stats.certificates)}</div><div className="text-[0.62rem] font-bold text-navy/40">گواهینامه</div></div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[0.68rem] font-black">
                        <span className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-brand-700">{formatNumber(child.stats.courses)} دوره</span>
                        <span className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-brand-700">{formatNumber(child.stats.upcoming_sessions)} جلسه پیش‌رو</span>
                        <span className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-brand-700">{formatNumber(child.stats.active_goals)} هدف فعال</span>
                    </div>
                </Link>) : <div className="col-span-full rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-16 text-center">
                    <Users className="mx-auto size-10 text-brand-500" />
                    <h3 className="mt-4 text-base font-black text-navy">هنوز فرزندی به حساب شما متصل نشده است</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-navy/50">مرکز رشد، حساب فرزند شما را به این حساب والد متصل می‌کند. برای اتصال، کافی است با مرکز تماس بگیرید یا در زمان ثبت‌نام، شماره همین حساب را اعلام کنید.</p>
                    <Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-black text-white shadow-glow hover:bg-brand-600">تماس با مرکز <ArrowLeft className="size-4" /></Link>
                </div>}
            </div>
        </section>
    </div></ProfessionalLayout>;
}

function LinkChildForm() {
    const form = useForm({ phone: '', grade: '', school: '' });
    return (
        <form className="mb-5 grid gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft md:grid-cols-[1fr_8rem_1fr_auto]" onSubmit={(event) => { event.preventDefault(); form.post('/panel/parent/children', { preserveScroll: true, onSuccess: () => form.reset() }); }}>
            <input dir="ltr" value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} placeholder="09xxxxxxxxx" className="rounded-xl border border-navy/10 px-3 py-2 text-sm" />
            <input value={form.data.grade} onChange={(event) => form.setData('grade', event.target.value)} placeholder="پایه" className="rounded-xl border border-navy/10 px-3 py-2 text-sm" />
            <input value={form.data.school} onChange={(event) => form.setData('school', event.target.value)} placeholder="مدرسه" className="rounded-xl border border-navy/10 px-3 py-2 text-sm" />
            <button type="submit" disabled={form.processing} className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white">اتصال فرزند</button>
            {form.errors.phone && <p className="md:col-span-4 text-xs font-bold text-red-600">{form.errors.phone}</p>}
        </form>
    );
}

ParentDashboard.layout = (page: ReactNode) => page;
