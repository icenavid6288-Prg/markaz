import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDuration, formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface Course { id: number; title: string; slug: string; thumbnail?: string | null; duration_minutes: number; progress_percent: number; status: string; enrolled_at?: string | null; }
interface Recommendation { id: number; title: string; slug: string; thumbnail?: string | null; level: string; price: number; discount_price?: number | null; }

const statusLabels: Record<string, string> = { active: 'در حال یادگیری', completed: 'تکمیل شده', pending: 'در انتظار تأیید' };

export default function DashboardCourses() {
    const { courses, recommendations, stats } = usePage<PageProps & { courses: Course[]; recommendations: Recommendation[]; stats: { courses_count: number; average_progress: number } }>().props;

    return <UserDashboardLayout>
        <div className="mx-auto flex max-w-7xl flex-col gap-7">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div><span className="dashboard-eyebrow"><span /> یادگیری</span><h2 className="mt-2 text-2xl font-black text-navy">دوره‌های من</h2><p className="mt-2 text-sm leading-7 text-navy/50">تمام دوره‌های ثبت‌نام‌شده و مسیر پیشرفت خود را یکجا دنبال کنید.</p></div>
                <Link href="/courses" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-black text-white shadow-glow hover:bg-brand-600">کشف دوره جدید <ArrowLeft className="size-4" /></Link>
            </header>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/75 p-5 shadow-soft"><span className="panel-stat-icon"><BookOpen className="size-5" /></span><div><strong className="block text-2xl font-black text-navy">{formatNumber(stats.courses_count)}</strong><span className="text-xs font-bold text-navy/45">دوره ثبت‌نام‌شده</span></div></div>
                <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/75 p-5 shadow-soft"><span className="panel-stat-icon"><Sparkles className="size-5" /></span><div><strong className="block text-2xl font-black text-navy">{formatNumber(stats.average_progress)}٪</strong><span className="text-xs font-bold text-navy/45">میانگین پیشرفت</span></div></div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
                {courses.length > 0 ? courses.map((course) => <Link key={course.id} href={`/courses/${course.slug}`} className="group flex gap-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"><div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-brand-300 text-brand-700">{course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="size-full object-cover" /> : <BookOpen className="size-9" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 text-base font-black leading-7 text-navy group-hover:text-brand-700">{course.title}</h3><span className="shrink-0 text-xs font-black text-brand-700">{formatNumber(course.progress_percent)}٪</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-navy/5"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${course.progress_percent}%` }} /></div><div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-navy/45"><span className="flex items-center gap-1"><Clock3 className="size-3.5" /> {formatDuration(course.duration_minutes)}</span><span className="flex items-center gap-1 text-brand-700"><CheckCircle2 className="size-3.5" /> {statusLabels[course.status] ?? course.status}</span></div></div></Link>) : <div className="col-span-full rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-14 text-center"><BookOpen className="mx-auto size-8 text-brand-500" /><p className="mt-3 text-sm font-bold text-navy/50">هنوز در دوره‌ای ثبت‌نام نکرده‌اید.</p><Link href="/courses" className="mt-3 inline-block text-xs font-black text-brand-700">مشاهده دوره‌ها ←</Link></div>}
            </section>

            {recommendations.length > 0 && <section><div className="mb-4 flex items-end justify-between"><div><span className="dashboard-eyebrow"><span /> پیشنهاد برای شما</span><h2 className="mt-2 text-xl font-black text-navy">قدم بعدی یادگیری</h2></div><Link href="/courses" className="text-xs font-bold text-brand-700">همه دوره‌ها ←</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recommendations.map((course) => <Link key={course.id} href={`/courses/${course.slug}`} className="group rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft hover:-translate-y-1"><div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-brand-300 text-brand-700">{course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="size-full object-cover" /> : <BookOpen className="size-8" />}</div><h3 className="mt-3 line-clamp-2 text-sm font-black leading-6 text-navy group-hover:text-brand-700">{course.title}</h3><span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-navy/45">{course.level}</span></Link>)}</div></section>}
        </div>
    </UserDashboardLayout>;
}

DashboardCourses.layout = (page: ReactNode) => page;
