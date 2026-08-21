import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, HeartHandshake } from 'lucide-react';
import type { ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDate, formatDuration } from '@/lib/format';
import type { PageProps } from '@/types';

interface Session { id: number; scheduled_at?: string | null; duration_minutes: number; status: string; meeting_link?: string | null; coach?: string | null; }
const statusLabels: Record<string, string> = { pending: 'در انتظار تأیید', confirmed: 'تأیید شده' };

export default function DashboardSessions() {
    const { sessions } = usePage<PageProps & { sessions: Session[] }>().props;

    return <UserDashboardLayout>
        <div className="mx-auto flex max-w-5xl flex-col gap-7">
            <header className="flex flex-wrap items-end justify-between gap-4"><div><span className="dashboard-eyebrow"><span /> همراهی تخصصی</span><h2 className="mt-2 text-2xl font-black text-navy">جلسات کوچینگ من</h2><p className="mt-2 text-sm leading-7 text-navy/50">جلسه‌های پیش‌رو و زمان همراهی کوچ خود را مدیریت کنید.</p></div><Link href="/coaching" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-black text-white shadow-glow hover:bg-brand-600">انتخاب کوچ <ArrowLeft className="size-4" /></Link></header>
            <section className="flex flex-col gap-4">{sessions.length > 0 ? sessions.map((session) => <article key={session.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft"><span className="panel-inline-icon flex-col"><CalendarDays className="size-6" /><span className="mt-1 text-[0.6rem] font-black">جلسه</span></span><div className="min-w-0 flex-1"><h3 className="text-base font-black text-navy">جلسه با {session.coach ?? 'کوچ شما'}</h3><p className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-navy/45"><span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {formatDate(session.scheduled_at)}</span><span className="flex items-center gap-1"><Clock3 className="size-3.5" /> {formatDuration(session.duration_minutes)}</span></p></div><span className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[0.68rem] font-black text-brand-700"><CheckCircle2 className="size-3.5" /> {statusLabels[session.status] ?? session.status}</span>{session.meeting_link && <a href={session.meeting_link} target="_blank" rel="noreferrer" className="w-full text-xs font-black text-brand-700 sm:w-auto">ورود به جلسه ←</a>}</article>) : <div className="rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-14 text-center"><HeartHandshake className="mx-auto size-8 text-brand-500" /><p className="mt-3 text-sm font-bold text-navy/50">هنوز جلسه‌ای برای شما رزرو نشده است.</p><Link href="/coaching" className="mt-3 inline-flex items-center gap-1 text-xs font-black text-brand-700">مشاهده کوچ‌ها <ArrowLeft className="size-3.5" /></Link></div>}</section>
        </div>
    </UserDashboardLayout>;
}

DashboardSessions.layout = (page: ReactNode) => page;
