import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ClipboardList, Clock3 } from 'lucide-react';
import type { ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDate, formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface Assignment {
    id: number;
    title: string;
    course: string;
    lesson_id?: number | null;
    course_slug?: string | null;
    status: string;
    score?: number | null;
    max_score: number;
    feedback?: string | null;
    submitted_at?: string | null;
    url?: string | null;
}

export default function DashboardAssignments() {
    const { assignments, stats } = usePage<PageProps & { assignments: Assignment[]; stats: { pending: number; graded: number; average_score: number } }>().props;

    return <UserDashboardLayout>
        <div className="mx-auto flex max-w-7xl flex-col gap-7">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div><span className="dashboard-eyebrow"><span /> یادگیری</span><h2 className="mt-2 text-2xl font-black text-navy">تکلیف‌های من</h2><p className="mt-2 text-sm leading-7 text-navy/50">همه تکالیفی که از دوره‌های مختلف ارسال کرده‌اید؛ وضعیت تصحیح، نمره و بازخورد مدرس را اینجا دنبال کنید.</p></div>
                <Link href="/dashboard/courses" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-black text-white shadow-glow hover:bg-brand-600">دوره‌های من <ArrowLeft className="size-4" /></Link>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/75 p-5 shadow-soft"><span className="panel-stat-icon"><Clock3 className="size-5" /></span><div><strong className="block text-2xl font-black text-navy">{formatNumber(stats.pending)}</strong><span className="text-xs font-bold text-navy/45">در انتظار تصحیح</span></div></div>
                <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/75 p-5 shadow-soft"><span className="panel-stat-icon"><CheckCircle2 className="size-5" /></span><div><strong className="block text-2xl font-black text-navy">{formatNumber(stats.graded)}</strong><span className="text-xs font-bold text-navy/45">تصحیح‌شده</span></div></div>
                <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/75 p-5 shadow-soft"><span className="panel-stat-icon"><ClipboardList className="size-5" /></span><div><strong className="block text-2xl font-black text-navy">{formatNumber(stats.average_score)}</strong><span className="text-xs font-bold text-navy/45">میانگین نمره</span></div></div>
            </section>

            <section className="flex flex-col gap-4">
                {assignments.length > 0 ? assignments.map((assignment) => <Link key={assignment.id} href={assignment.url ?? '/dashboard/assignments'} className="group flex flex-wrap items-start gap-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
                    <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${assignment.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{assignment.status === 'graded' ? <CheckCircle2 className="size-6" /> : <Clock3 className="size-6" />}</span>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3"><h3 className="text-sm font-black text-navy group-hover:text-brand-700">{assignment.title}</h3><span className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-black ${assignment.status === 'graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{assignment.status === 'graded' ? 'تصحیح شده' : 'در انتظار تصحیح'}</span></div>
                        <p className="mt-1.5 text-xs font-bold text-navy/45">{assignment.course}{assignment.submitted_at ? ` · ارسال ${formatDate(assignment.submitted_at)}` : ''}</p>
                        {assignment.status === 'graded' && assignment.feedback && <div className="mt-3 rounded-xl bg-soft-gray/70 px-4 py-3"><div className="text-[0.65rem] font-black text-brand-700">بازخورد مدرس</div><p className="mt-1 whitespace-pre-line text-sm leading-7 text-navy/70">{assignment.feedback}</p></div>}
                    </div>
                    {assignment.status === 'graded' ? <div className="shrink-0 text-left"><div className="text-2xl font-black text-brand-700">{formatNumber(assignment.score ?? 0)}<span className="text-xs font-bold text-navy/40"> از {formatNumber(assignment.max_score)}</span></div><span className="mt-1 block text-[0.65rem] font-bold text-navy/40">نمره نهایی</span></div> : <span className="shrink-0 rounded-xl bg-brand-50 px-3.5 py-2.5 text-xs font-black text-brand-700 group-hover:bg-brand-100">مشاهده تکلیف</span>}
                    <ArrowLeft className="mt-1 size-4 shrink-0 text-navy/25 transition-transform group-hover:-translate-x-1 group-hover:text-brand-600" />
                </Link>) : <div className="rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-16 text-center">
                    <ClipboardList className="mx-auto size-10 text-brand-500" />
                    <h3 className="mt-4 text-base font-black text-navy">هنوز تکلیفی ارسال نکرده‌اید</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-navy/50">تکالیف هر دوره از داخل پلیر دوره قابل ارسال است؛ به محض ارسال، همین‌جا وضعیت تصحیح و نمره آن را می‌بینید.</p>
                    <Link href="/dashboard/courses" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-black text-white shadow-glow hover:bg-brand-600">رفتن به دوره‌های من <ArrowLeft className="size-4" /></Link>
                </div>}
            </section>
        </div>
    </UserDashboardLayout>;
}

DashboardAssignments.layout = (page: ReactNode) => page;
