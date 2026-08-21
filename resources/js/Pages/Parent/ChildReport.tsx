import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Award, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Clock3, GraduationCap, Printer, Route, Target, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import ProfessionalLayout from '@/Layouts/ProfessionalLayout';
import { formatDate, formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface ChildCourse { id: number; title?: string | null; slug?: string | null; thumbnail?: string | null; duration_minutes: number; progress_percent: number; status: string; completed_at?: string | null; certificate?: { number: string; url: string } | null; }
interface ChildAssignment { id: number; course?: string | null; lesson?: string | null; title?: string | null; status: string; score?: number | null; max_score?: number | null; feedback?: string | null; submitted_at?: string | null; }
interface ChildQuiz { id: number; course?: string | null; lesson?: string | null; title?: string | null; score: number; passed: boolean; submitted_at?: string | null; }
interface ChildSession { id: number; coach?: string | null; scheduled_at?: string | null; duration_minutes?: number | null; status: string; }
interface ChildGoal { id: number; title: string; status: string; due_date?: string | null; total_tasks: number; completed_tasks: number; }
interface ChildCertificate { id: number; number: string; issued_at?: string | null; course?: string | null; url: string; }

interface ChildData {
    id: number; name?: string | null; avatar?: string | null; grade?: string | null; school?: string | null; birth_date?: string | null; talents?: string[]; interests?: string[];
    stats: { courses: number; completed_courses: number; average_progress: number; pending_assignments: number; certificates: number; upcoming_sessions: number; active_goals: number };
    courses: ChildCourse[]; assignments: ChildAssignment[]; quizzes: ChildQuiz[]; sessions: ChildSession[]; goals: ChildGoal[]; certificates: ChildCertificate[];
}

const goalStatus: Record<string, string> = { in_progress: 'در حال انجام', pending: 'در انتظار', done: 'انجام‌شده' };
const sessionStatus: Record<string, string> = { pending: 'در انتظار', confirmed: 'تأیید شده', completed: 'انجام‌شده', cancelled: 'لغو شده' };

export default function ChildReport() {
    const { child } = usePage<PageProps & { child: ChildData }>().props;

    return <ProfessionalLayout role="parent"><div className="mx-auto flex max-w-7xl flex-col gap-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/panel/parent" className="inline-flex items-center gap-2 text-xs font-black text-brand-700"><ArrowRight className="size-4" /> بازگشت به فرزندان من</Link></div>

        <section className="flex flex-wrap items-center gap-5 rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white/15 text-2xl font-black ring-1 ring-white/20">{child.avatar ? <img src={child.avatar} alt={child.name ?? ''} className="size-full object-cover" /> : (child.name?.slice(0, 1) ?? '؟')}</span>
            <div className="min-w-0 flex-1"><h2 className="text-2xl font-black">{child.name ?? 'فرزند'}</h2><p className="mt-1 text-sm text-white/60">{[child.grade, child.school].filter(Boolean).join(' · ') || '—'}{child.birth_date ? ` · متولد ${formatDate(child.birth_date)}` : ''}</p>{(child.talents?.length ?? 0) > 0 && <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-black">{child.talents?.map((talent) => <span key={talent} className="rounded-lg bg-white/10 px-2.5 py-1.5 text-brand-200 ring-1 ring-white/15">{talent}</span>)}</div>}</div>
            <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold text-white/75 ring-1 ring-white/15"><GraduationCap className="size-4 text-brand-300" /> گزارش کامل پیشرفت</div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
                { label: 'دوره‌ها', value: `${formatNumber(child.stats.courses)} (${formatNumber(child.stats.completed_courses)} تکمیل)`, icon: BookOpen },
                { label: 'میانگین پیشرفت', value: `${formatNumber(child.stats.average_progress)}٪`, icon: TrendingUp },
                { label: 'تکالیف در انتظار تصحیح', value: child.stats.pending_assignments, icon: ClipboardList },
                { label: 'گواهینامه‌ها', value: child.stats.certificates, icon: Award },
                { label: 'جلسات پیش‌رو', value: child.stats.upcoming_sessions, icon: CalendarDays },
                { label: 'هدف‌های فعال', value: child.stats.active_goals, icon: Target },
            ].map((item) => <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft"><span className="panel-stat-icon"><item.icon className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{typeof item.value === 'number' ? formatNumber(item.value) : item.value}</strong><span className="text-xs font-bold text-navy/45">{item.label}</span></div></div>)}
        </section>

        <section id="reports" className="scroll-mt-24">
            <div className="mb-4"><div className="dashboard-eyebrow"><span /> دوره‌ها و پیشرفت</div><h2 className="mt-2 text-xl font-black text-navy">پیشرفت دوره‌های {child.name?.split(' ')[0] ?? 'فرزند'}</h2></div>
            <div className="grid gap-4 lg:grid-cols-2">
                {child.courses.length > 0 ? child.courses.map((course) => <div key={course.id} className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft">
                    <div className="flex items-center gap-4"><span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-brand-300 text-brand-700">{course.thumbnail ? <img src={course.thumbnail} alt={course.title ?? ''} className="size-full object-cover" /> : <BookOpen className="size-7" />}</span><div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-sm font-black leading-6 text-navy">{course.title}</h3><div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-navy/45"><span className="flex items-center gap-1"><Clock3 className="size-3.5" /> {formatNumber(course.duration_minutes)} دقیقه</span><span className={`rounded-lg px-2 py-0.5 ${course.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-50 text-brand-700'}`}>{course.status === 'completed' ? 'تکمیل شده' : 'در حال یادگیری'}</span></div></div><div className="shrink-0 text-left"><div className="text-lg font-black text-brand-700">{formatNumber(course.progress_percent)}٪</div></div></div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-navy/5"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${course.progress_percent}%` }} /></div>
                    {course.certificate ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gold/10 px-4 py-3"><div className="flex items-center gap-2 text-xs font-black text-deep-green"><Award className="size-4 text-gold" /> گواهینامه صادر شد — {course.certificate.number}</div><Link href={course.certificate.url} className="inline-flex items-center gap-1 text-xs font-black text-brand-700 hover:underline">مشاهده <ArrowLeft className="size-3.5" /></Link></div> : course.status === 'completed' ? <div className="mt-4 flex items-center gap-2 text-xs font-black text-emerald-700"><CheckCircle2 className="size-4" /> دوره کامل شد</div> : null}
                </div>) : <div className="col-span-full rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-12 text-center text-sm font-bold text-navy/45">هنوز در دوره‌ای ثبت‌نام نکرده است.</div>}
            </div>
        </section>

        <section>
            <div className="mb-4"><div className="dashboard-eyebrow"><span /> تکالیف</div><h2 className="mt-2 text-xl font-black text-navy">تکالیف و نمرات</h2></div>
            <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[44rem] text-right text-sm"><thead className="border-b border-navy/5 bg-soft-gray/60 text-xs font-black text-navy/45"><tr><th className="px-5 py-4">تکلیف</th><th className="px-5 py-4">دوره</th><th className="px-5 py-4">وضعیت</th><th className="px-5 py-4">نمره</th><th className="px-5 py-4">بازخورد</th></tr></thead><tbody>
                {child.assignments.length > 0 ? child.assignments.map((assignment) => <tr key={assignment.id} className="border-b border-navy/5 last:border-0"><td className="px-5 py-4"><strong className="block max-w-[14rem] truncate text-sm text-navy">{assignment.title ?? assignment.lesson ?? 'تکلیف'}</strong><span className="text-[0.65rem] text-navy/35">ارسال {assignment.submitted_at ? formatDate(assignment.submitted_at) : '—'}</span></td><td className="max-w-[12rem] truncate px-5 py-4 text-xs font-bold text-navy/55">{assignment.course ?? '—'}</td><td className="px-5 py-4"><span className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-black ${assignment.status === 'graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{assignment.status === 'graded' ? 'تصحیح شده' : 'در انتظار تصحیح'}</span></td><td className="px-5 py-4 text-sm font-black text-navy/70">{assignment.score !== null && assignment.score !== undefined ? `${formatNumber(assignment.score)} از ${formatNumber(assignment.max_score ?? 100)}` : '—'}</td><td className="max-w-[16rem] px-5 py-4 text-xs leading-6 text-navy/55">{assignment.feedback ?? '—'}</td></tr>) : <tr><td colSpan={5} className="px-5 py-10 text-center text-sm font-bold text-navy/40">هنوز تکلیفی ارسال نشده است.</td></tr>}
            </tbody></table></div></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
            <div>
                <div className="mb-4"><div className="dashboard-eyebrow"><span /> آزمون‌ها</div><h2 className="mt-2 text-xl font-black text-navy">نتایج آزمون‌ها</h2></div>
                <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft"><div className="overflow-x-auto"><table className="w-full min-w-[24rem] text-right text-sm"><thead className="border-b border-navy/5 bg-soft-gray/60 text-xs font-black text-navy/45"><tr><th className="px-5 py-4">آزمون</th><th className="px-5 py-4">نمره</th><th className="px-5 py-4">نتیجه</th></tr></thead><tbody>
                    {child.quizzes.length > 0 ? child.quizzes.map((quiz) => <tr key={quiz.id} className="border-b border-navy/5 last:border-0"><td className="px-5 py-4"><strong className="block max-w-[12rem] truncate text-sm text-navy">{quiz.title ?? quiz.lesson ?? 'آزمون'}</strong><span className="text-[0.65rem] text-navy/35">{quiz.course ?? ''}</span></td><td className="px-5 py-4 text-sm font-black text-navy/70">{formatNumber(quiz.score)} از ۱۰۰</td><td className="px-5 py-4"><span className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-black ${quiz.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{quiz.passed ? 'قبول' : 'نیاز به تلاش مجدد'}</span></td></tr>) : <tr><td colSpan={3} className="px-5 py-10 text-center text-sm font-bold text-navy/40">هنوز آزمونی ثبت نشده است.</td></tr>}
                </tbody></table></div></div>
            </div>
            <div>
                <div className="mb-4"><div className="dashboard-eyebrow"><span /> جلسات کوچینگ</div><h2 className="mt-2 text-xl font-black text-navy">جلسات و هدف‌ها</h2></div>
                <div className="flex flex-col gap-3">
                    {child.sessions.length > 0 ? child.sessions.map((session) => <div key={session.id} className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><CalendarDays className="size-5" /></span><div className="min-w-0 flex-1"><div className="text-sm font-black text-navy">{session.coach ? `جلسه با ${session.coach}` : 'جلسه کوچینگ'}</div><div className="mt-0.5 text-xs font-bold text-navy/45">{session.scheduled_at ? formatDate(session.scheduled_at) : '—'}{session.duration_minutes ? ` · ${formatNumber(session.duration_minutes)} دقیقه` : ''}</div></div><span className="shrink-0 rounded-lg bg-soft-gray px-2.5 py-1 text-[0.68rem] font-black text-navy/55">{sessionStatus[session.status] ?? session.status}</span></div>) : <div className="rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-8 text-center text-sm font-bold text-navy/45">جلسه‌ای ثبت نشده است.</div>}
                    {child.goals.length > 0 && <div className="mt-2 flex flex-col gap-3">{child.goals.map((goal) => <div key={goal.id} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Route className="size-4 shrink-0 text-brand-600" /><span className="truncate text-sm font-black text-navy">{goal.title}</span></div><span className="shrink-0 rounded-lg bg-soft-gray px-2.5 py-1 text-[0.68rem] font-black text-navy/55">{goalStatus[goal.status] ?? goal.status}</span></div>{goal.total_tasks > 0 && <div className="mt-3 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-navy/5"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.round((goal.completed_tasks / goal.total_tasks) * 100)}%` }} /></div><span className="text-[0.68rem] font-black text-navy/45">{formatNumber(goal.completed_tasks)} از {formatNumber(goal.total_tasks)}</span></div>}</div>)}</div>}
                </div>
            </div>
        </section>

        {child.certificates.length > 0 && <section>
            <div className="mb-4"><div className="dashboard-eyebrow"><span /> گواهینامه‌ها</div><h2 className="mt-2 text-xl font-black text-navy">گواهینامه‌های اخذشده</h2></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{child.certificates.map((certificate) => <Link key={certificate.id} href={certificate.url} className="group flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/90 to-gold/60 text-white"><Award className="size-6" /></span><div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-sm font-black leading-6 text-navy group-hover:text-brand-700">{certificate.course ?? 'دوره'}</h3><p className="mt-1 text-[0.68rem] font-bold text-navy/45">صدور {certificate.issued_at ? formatDate(certificate.issued_at) : '—'}</p></div><Printer className="size-4 shrink-0 text-navy/30 group-hover:text-brand-600" /></Link>)}</div>
        </section>}
    </div></ProfessionalLayout>;
}

ChildReport.layout = (page: ReactNode) => page;
