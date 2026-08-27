import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Route, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDate, formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface Goal { id: number; title: string; description?: string | null; status: string; due_date?: string | null; total_tasks: number; completed_tasks: number; }
const statusLabels: Record<string, string> = { pending: 'در انتظار شروع', in_progress: 'در حال اجرا', completed: 'تکمیل شده' };

export default function DashboardGoals() {
    const { goals } = usePage<PageProps & { goals: Goal[] }>().props;

    return <UserDashboardLayout>
        <div className="mx-auto flex max-w-5xl flex-col gap-7">
            <header className="flex flex-wrap items-end justify-between gap-4"><div><span className="dashboard-eyebrow"><span /> هدف‌گذاری</span><h2 className="mt-2 text-2xl font-black text-navy">مسیر رشد من</h2><p className="mt-2 text-sm leading-7 text-navy/50">هدف‌ها را به قدم‌های کوچک تبدیل کنید و پیشرفت خود را ببینید.</p></div><Link href="/coaching" className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-xs font-black text-brand-700 hover:bg-brand-50">رزرو جلسه کوچینگ <ArrowLeft className="size-4" /></Link></header>
            <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-7 text-white shadow-lift"><div className="pointer-events-none absolute -left-16 -top-20 size-60 rounded-full bg-brand-400/20" /><div className="relative flex items-center gap-4"><span className="panel-inline-icon text-brand-300"><Route className="size-8" /></span><div><span className="text-xs font-bold text-brand-200">نقشه مسیر</span><h3 className="mt-1 text-xl font-black">هر هدف، یک ایستگاه تازه برای رشد است.</h3></div></div></section>
            <section className="flex flex-col gap-4">{goals.length > 0 ? goals.map((goal) => { const percent = goal.total_tasks ? Math.round((goal.completed_tasks / goal.total_tasks) * 100) : 0; return <article key={goal.id} className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-black text-navy">{goal.title}</h3>{goal.description && <p className="mt-1 text-sm leading-7 text-navy/50">{goal.description}</p>}</div><span className="rounded-lg bg-brand-50 px-2.5 py-1 text-[0.68rem] font-black text-brand-700">{statusLabels[goal.status] ?? goal.status}</span></div><div className="mt-5 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-navy/5"><span className="block h-full rounded-full bg-gradient-to-l from-brand-500 to-brand-300" style={{ width: `${percent}%` }} /></div><strong className="text-xs font-black text-brand-700">{formatNumber(percent)}٪</strong></div><div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-navy/45"><span className="flex items-center gap-1"><ClipboardCheck className="size-3.5" /> {formatNumber(goal.completed_tasks)} از {formatNumber(goal.total_tasks)} کار انجام شده</span>{goal.due_date && <span>مهلت: {formatDate(goal.due_date)}</span>}</div></article>; }) : <div className="rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-14 text-center"><Target className="mx-auto size-8 text-brand-500" /><p className="mt-3 text-sm font-bold text-navy/50">هنوز هدف فعالی برای شما ثبت نشده است.</p><Link href="/coaching" className="mt-3 inline-flex items-center gap-1 text-xs font-black text-brand-700">شروع هدف‌گذاری <ArrowLeft className="size-3.5" /></Link></div>}</section>
        </div>
    </UserDashboardLayout>;
}

DashboardGoals.layout = (page: ReactNode) => page;
