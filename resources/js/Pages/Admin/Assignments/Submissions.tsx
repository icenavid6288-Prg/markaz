import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, Paperclip, Save, Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

interface SubmissionRow { id: number; user: { id: number; name: string; email: string } | null; content: string | null; attachment: string | null; attachment_url: string | null; status: string; score: number | null; feedback: string | null; submitted_at: string; }
interface AssignmentInfo { id: number; title: string; description: string | null; lesson: { id: number; title: string } | null; course: { id: number; title: string } | null; max_score: number; due_days: number | null; submissions_count: number; graded_count: number; pending_count: number; }
interface Paginator { data: SubmissionRow[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }

export default function Submissions() {
    const { assignment, submissions, filters } = usePage<PageProps & { assignment: AssignmentInfo; submissions: Paginator; filters: { status: string; search: string } }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = (status: string) => router.get(`/admin/assignments/${assignment.id}/submissions`, { status, search }, { preserveState: true, replace: true });

    return <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/assignments" className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به تکلیف‌ها</Link></div>
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-12 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative"><div className="mb-2 flex items-center gap-2 text-xs font-black text-brand-200"><ClipboardList className="size-4" /> تصحیح تکلیف</div><h1 className="text-2xl font-black md:text-3xl">{assignment.title}</h1><p className="mt-2 text-sm leading-7 text-white/60">{assignment.course?.title ?? '—'} · درس «{assignment.lesson?.title ?? '—'}» · حداکثر نمره {assignment.max_score}{assignment.due_days ? ` · مهلت ${assignment.due_days} روز` : ''}</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-black">{['کل ارسال‌ها: '+assignment.submissions_count, 'در انتظار: '+assignment.pending_count, 'تصحیح‌شده: '+assignment.graded_count].map((stat) => <span key={stat} className="rounded-xl bg-white/10 px-3 py-2 text-white/80 ring-1 ring-white/15">{stat}</span>)}</div></div>
        </section>
        <section className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1.5">{[['', 'همه'], ['submitted', 'در انتظار تصحیح'], ['graded', 'تصحیح‌شده']].map(([value, label]) => <button key={value} type="button" onClick={() => apply(value)} className={`rounded-xl px-4 py-2.5 text-xs font-black transition-colors ${(filters.status ?? '') === value ? 'bg-deep-green text-white' : 'bg-soft-gray text-navy/55 hover:bg-brand-100'}`}>{label}</button>)}</div>
            <div className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply(filters.status ?? '')} placeholder="جستجو در نام یا ایمیل هنرجو..." className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></div>
        </section>
        <section className="flex flex-col gap-4">
            {submissions.data.map((submission) => <SubmissionCard key={submission.id} submission={submission} assignment={assignment} />)}
            {submissions.data.length === 0 && <div className="rounded-2xl border border-dashed border-navy/15 bg-white/60 p-12 text-center text-sm font-bold text-navy/40">هنوز ارسالی برای این تکلیف وجود ندارد.</div>}
            {submissions.links.length > 3 && <div className="flex items-center justify-center gap-1.5">{submissions.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
    </div>;
}

function SubmissionCard({ submission, assignment }: { submission: SubmissionRow; assignment: AssignmentInfo }) {
    const graded = submission.status === 'graded';
    const form = useForm({ score: submission.score ?? '', feedback: submission.feedback ?? '' });
    const save = () => {
        form.post(`/admin/assignments/${assignment.id}/submissions/${submission.id}/grade`, { preserveScroll: true });
    };

    return <article className="rounded-2xl border border-white/80 bg-white/85 p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-deep-green text-sm font-black text-white">{submission.user?.name?.slice(0, 1) ?? '؟'}</span><div><div className="text-sm font-black text-navy">{submission.user?.name ?? 'کاربر ناشناس'}</div><div className="text-[0.68rem] font-bold text-navy/40">{submission.user?.email ?? ''} · ارسال در {submission.submitted_at}</div></div></div>
            {graded ? <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700"><CheckCircle2 className="size-3.5" /> تصحیح‌شده — نمره {submission.score} از {assignment.max_score}</span> : <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-700"><Clock3 className="size-3.5" /> در انتظار تصحیح</span>}
        </div>
        {submission.content && <div className="mt-4 rounded-xl bg-soft-gray/50 p-4"><div className="text-[0.65rem] font-black text-navy/40">پاسخ هنرجو</div><p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-navy/70">{submission.content}</p></div>}
        {submission.attachment_url && <a href={submission.attachment_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs font-black text-brand-700 hover:bg-brand-100"><Paperclip className="size-3.5" /> دریافت فایل ارسال‌شده</a>}
        {graded && submission.feedback && <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><div className="text-[0.65rem] font-black text-emerald-700">بازخورد ثبت‌شده</div><p className="mt-1.5 whitespace-pre-line text-sm leading-7 text-navy/70">{submission.feedback}</p></div>}
        <div className="mt-5 rounded-xl border border-navy/10 bg-white p-4">
            <div className="mb-3 text-xs font-black text-navy/60">{graded ? 'ویرایش نمره و بازخورد' : 'ثبت نمره و بازخورد'}</div>
            <div className="grid gap-4 lg:grid-cols-[10rem_1fr_auto] lg:items-start">
                <div><label className="mb-1.5 block text-[0.68rem] font-black text-navy/50">نمره (از {assignment.max_score})</label><input type="number" min={0} max={assignment.max_score} value={form.data.score} onChange={(e) => form.setData('score', e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />{form.errors.score && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.score}</p>}</div>
                <div><label className="mb-1.5 block text-[0.68rem] font-black text-navy/50">بازخورد برای هنرجو</label><textarea rows={2} value={form.data.feedback} onChange={(e) => form.setData('feedback', e.target.value)} className="w-full resize-y rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200" placeholder="نکته‌های اصلاحی یا تشویقی..." />{form.errors.feedback && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.feedback}</p>}</div>
                <Button type="button" onClick={save} loading={form.processing} className="lg:mt-5"><Save className="size-4" /> {graded ? 'ذخیره تغییرات' : 'ثبت نمره'}</Button>
            </div>
        </div>
    </article>;
}

Submissions.layout = (page: ReactNode) => <AdminLayout title="تصحیح تکلیف‌ها">{page}</AdminLayout>;
