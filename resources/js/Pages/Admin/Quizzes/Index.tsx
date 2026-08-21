import { Link, router, usePage } from '@inertiajs/react';
import { Edit3, HelpCircle, ListChecks, Plus, Search, Trash2, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface QuizRow { id: number; title: string; description: string | null; lesson: { id: number; title: string } | null; course: { id: number; title: string } | null; passing_score: number; time_limit_minutes: number | null; questions_count: number; attempts_count: number; created_at: string; }
interface Paginator { data: QuizRow[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }

export default function QuizzesIndex() {
    const { quizzes, filters } = usePage<PageProps & { quizzes: Paginator; filters: { search?: string } }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = () => router.get('/admin/quizzes', { search }, { preserveState: true, replace: true });
    const destroy = (quiz: QuizRow) => {
        if (confirm(`آزمون «${quiz.title}» و سؤال‌های آن حذف شود؟`)) router.delete(`/admin/quizzes/${quiz.id}`);
    };

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-12 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div><div className="mb-2 flex items-center gap-2 text-xs font-black text-brand-200"><ListChecks className="size-4" /> یادگیری / آزمون‌ها</div><h1 className="text-2xl font-black md:text-3xl">آزمون‌های دوره‌ها</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">آزمون به یک درس متصل می‌شود؛ نمره‌دهی سمت سرور انجام می‌شود و قبولی در آزمون، درس را کامل می‌کند.</p></div>
                <Link href="/admin/quizzes/create" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-deep-green shadow-soft hover:bg-brand-100"><Plus className="size-4" /> ساخت آزمون</Link>
            </div>
        </section>
        <section className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl sm:flex-row">
            <div className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="جستجو در عنوان آزمون، درس یا دوره..." className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></div><button type="button" onClick={apply} className="rounded-xl bg-deep-green px-5 py-3 text-sm font-black text-white hover:bg-brand-700">اعمال جستجو</button>
        </section>
        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4"><div className="text-sm font-black text-navy">فهرست آزمون‌ها</div><div className="text-xs font-bold text-navy/40">{quizzes.total} آزمون</div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-right"><thead className="border-b border-navy/5 bg-soft-gray/60 text-xs font-black text-navy/45"><tr><th className="px-5 py-4">آزمون</th><th className="px-5 py-4">دوره / درس</th><th className="px-5 py-4">سؤال‌ها</th><th className="px-5 py-4">تلاش‌ها</th><th className="px-5 py-4">نمره قبولی</th><th className="px-5 py-4">عملیات</th></tr></thead><tbody>
                {quizzes.data.map((quiz) => <tr key={quiz.id} className="border-b border-navy/5 last:border-0 hover:bg-soft-gray/40">
                    <td className="px-5 py-4"><strong className="block max-w-[16rem] truncate text-sm text-navy">{quiz.title}</strong><span className="text-[0.65rem] text-navy/35">شناسه #{quiz.id} · {quiz.created_at}</span></td>
                    <td className="max-w-[20rem] px-5 py-4 text-xs font-bold leading-5 text-navy/55"><div className="truncate">{quiz.course?.title ?? '—'}</div><div className="truncate text-navy/40">{quiz.lesson?.title ?? '—'}</div></td>
                    <td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[0.68rem] font-black text-brand-700"><HelpCircle className="size-3" /> {quiz.questions_count}</span></td>
                    <td className="px-5 py-4"><span className="inline-flex items-center gap-1 rounded-lg bg-soft-gray px-2 py-1 text-[0.68rem] font-black text-navy/55"><Users className="size-3" /> {quiz.attempts_count}</span></td>
                    <td className="px-5 py-4 text-sm font-black text-navy/60">{quiz.passing_score}٪</td>
                    <td className="px-5 py-4"><div className="flex items-center gap-1.5"><Link href={`/admin/quizzes/${quiz.id}/edit`} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-100 hover:text-brand-700" aria-label="ویرایش"><Edit3 className="size-3.5" /></Link><button type="button" onClick={() => destroy(quiz)} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><Trash2 className="size-3.5" /></button></div></td>
                </tr>)}
                {quizzes.data.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center text-sm font-bold text-navy/40">هنوز آزمونی ساخته نشده است. آزمون به یک درس از نوع «آزمون» متصل می‌شود.</td></tr>}
            </tbody></table></div>
            {quizzes.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">{quizzes.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
    </div>;
}

QuizzesIndex.layout = (page: ReactNode) => <AdminLayout title="آزمون‌های دوره‌ها">{page}</AdminLayout>;
