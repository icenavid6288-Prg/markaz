import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, BarChart3, ChevronDown, Download, Search, UserRound, Users } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { formatNumber } from '@/lib/format';

interface Question { id: number; title: string; type: string }
interface Answer { question_id: number; title: string; type: string; value: string }
interface Respondent {
    id: number;
    status: string;
    answered_count: number;
    user: { id: number; name: string; phone?: string | null } | null;
    created_at: string | null;
    completed_at?: string | null;
    answers: Answer[];
}
interface OptionStat { label: string; count: number; percent: number }
interface QuestionSummary { id: number; title: string; type: string; answered: number; options: OptionStat[] }
interface Paginator {
    data: Respondent[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
    from: number | null;
    to: number | null;
}

const statusLabels: Record<string, string> = { completed: 'کامل‌شده', registered: 'ثبت‌نام‌شده', in_progress: 'نیمه‌کاره' };
const statusClass: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700',
    registered: 'bg-brand-50 text-brand-700',
    in_progress: 'bg-amber-50 text-amber-800',
};

export default function SurveyResponses() {
    const { kind, survey, questions, responses, summary, filters } = usePage<PageProps & {
        kind: 'persline' | 'survey';
        survey: { title: string; share_token: string; status: string; questions_count: number; responses_count: number; completed_responses_count: number };
        questions: Question[];
        responses: Paginator;
        summary: { total: number; completed: number; registered: number; in_progress: number; questions: QuestionSummary[] };
        filters: { status: string; q: string };
    }>().props;

    const base = kind === 'persline' ? '/admin/persline' : '/admin/surveys';
    const listLabel = kind === 'persline' ? 'فرم‌های پرسلاین' : 'نظرسنجی‌ها';
    const [query, setQuery] = useState(filters.q ?? '');
    const [openId, setOpenId] = useState<number | null>(responses.data[0]?.id ?? null);

    const applyFilters = (event?: FormEvent) => {
        event?.preventDefault();
        router.get(`${base}/${survey.share_token}/responses`, { q: query || undefined, status: filters.status || undefined }, { preserveState: true, replace: true });
    };
    const setStatus = (status: string) => {
        router.get(`${base}/${survey.share_token}/responses`, { q: query || undefined, status: status || undefined }, { preserveState: true, replace: true });
    };

    const cards = useMemo(() => [
        ['همه پاسخ‌ها', summary.total],
        ['کامل‌شده', summary.completed],
        ['ثبت‌نام‌شده', summary.registered],
        ['نیمه‌کاره', summary.in_progress],
    ] as const, [summary]);

    return <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href={base} className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به {listLabel}</Link>
            <div className="flex flex-wrap gap-2">
                <Link href={`${base}/${survey.share_token}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-navy ring-1 ring-navy/10 hover:bg-soft-gray">ویرایش فرم</Link>
                <a href={`${base}/${survey.share_token}/responses.csv`} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700"><Download className="size-4" /> خروجی CSV</a>
            </div>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-20 size-72 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative">
                <div className="flex items-center gap-2 text-xs font-black text-brand-200"><Users className="size-4" /> نتایج پاسخ‌ها</div>
                <h1 className="mt-3 text-2xl font-black md:text-3xl">{survey.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">اینجا می‌بینید هر کاربر چه پاسخی داده، وضعیت ثبت‌نامش چیست و جمع‌بندی گزینه‌ها چطور توزیع شده است.</p>
            </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft">
                    <div className="text-2xl font-black text-navy">{formatNumber(value)}</div>
                    <div className="mt-1 text-xs font-bold text-navy/45">{label}</div>
                </div>
            ))}
        </section>

        {summary.questions.some((item) => item.options.length > 0) && (
            <section className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-soft">
                <div className="mb-5 flex items-center gap-2 text-sm font-black text-navy"><BarChart3 className="size-4 text-indigo-600" /> جمع‌بندی گزینه‌ها (پاسخ‌های کامل)</div>
                <div className="grid gap-5 md:grid-cols-2">
                    {summary.questions.filter((item) => item.options.length > 0).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-navy/5 bg-soft-gray/40 p-4">
                            <div className="text-sm font-black text-navy">{item.title}</div>
                            <div className="mt-1 text-[0.68rem] font-bold text-navy/40">{formatNumber(item.answered)} پاسخ</div>
                            <div className="mt-3 flex flex-col gap-2">
                                {item.options.map((option) => (
                                    <div key={option.label}>
                                        <div className="mb-1 flex items-center justify-between text-xs font-bold text-navy/60">
                                            <span>{option.label}</span>
                                            <span>{formatNumber(option.count)} · {formatNumber(option.percent)}٪</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-white">
                                            <div className="h-full rounded-full bg-brand-600" style={{ width: `${option.percent}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/5 px-5 py-4">
                <div className="text-sm font-black text-navy">پاسخ هر کاربر</div>
                <form onSubmit={applyFilters} className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-navy/30" />
                        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی نام یا موبایل" className="w-56 rounded-xl border border-navy/10 bg-white py-2 pl-3 pr-9 text-xs font-bold text-navy outline-none focus:border-brand-500" />
                    </div>
                    <button type="submit" className="rounded-xl bg-soft-gray px-3 py-2 text-xs font-black text-navy hover:bg-brand-50">جستجو</button>
                </form>
            </div>
            <div className="flex flex-wrap gap-2 border-b border-navy/5 px-5 py-3">
                {[['همه', ''], ['کامل‌شده', 'completed'], ['ثبت‌نام‌شده', 'registered'], ['نیمه‌کاره', 'in_progress']].map(([label, value]) => (
                    <button key={label} type="button" onClick={() => setStatus(value)} className={`rounded-lg px-3 py-1.5 text-[0.68rem] font-black ${filters.status === value ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/55 hover:bg-brand-50'}`}>{label}</button>
                ))}
            </div>

            <div className="divide-y divide-navy/5">
                {responses.data.map((response) => {
                    const open = openId === response.id;
                    return <article key={response.id} className="px-5 py-4">
                        <button type="button" onClick={() => setOpenId(open ? null : response.id)} className="flex w-full items-start justify-between gap-4 text-right">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><UserRound className="size-4" /></span>
                                <div>
                                    <div className="text-sm font-black text-navy">{response.user?.name ?? 'مهمان قبل از ثبت‌نام'}</div>
                                    <div className="mt-1 text-xs font-bold text-navy/45" dir="ltr">{response.user?.phone || '—'}</div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className={`rounded-lg px-2 py-0.5 text-[0.65rem] font-black ${statusClass[response.status] ?? 'bg-soft-gray text-navy/50'}`}>{statusLabels[response.status] ?? response.status}</span>
                                        <span className="text-[0.65rem] font-bold text-navy/40">{formatNumber(response.answered_count)} از {formatNumber(questions.length)} پاسخ</span>
                                        <span className="text-[0.65rem] font-bold text-navy/35">{response.completed_at ? `تکمیل ${response.completed_at}` : `شروع ${response.created_at ?? '—'}`}</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronDown className={`size-4 shrink-0 text-navy/35 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                        {open && (
                            <dl className="mt-4 grid gap-3 rounded-2xl bg-soft-gray/50 p-4 sm:grid-cols-2">
                                {response.answers.map((answer) => (
                                    <div key={answer.question_id} className="rounded-xl bg-white p-3 ring-1 ring-navy/5">
                                        <dt className="text-[0.68rem] font-black text-navy/45">{answer.title}</dt>
                                        <dd className="mt-1 text-sm font-bold leading-7 text-navy">{answer.value || <span className="font-bold text-navy/30">بدون پاسخ</span>}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </article>;
                })}
                {responses.data.length === 0 && (
                    <div className="px-5 py-16 text-center text-sm font-bold text-navy/40">هنوز پاسخی با این فیلتر ثبت نشده است.</div>
                )}
            </div>

            {responses.links.length > 3 && (
                <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">
                    {responses.links.map((link, index) => (
                        <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                    ))}
                </div>
            )}
        </section>
    </div>;
}

SurveyResponses.layout = (page: ReactNode) => <AdminLayout title="نتایج فرم">{page}</AdminLayout>;
