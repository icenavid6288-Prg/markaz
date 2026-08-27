import { Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, FileText, Send, Smartphone, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface Run {
    id: number;
    message: string;
    status: string;
    recipients_count: number;
    sent_count: number;
    failed_count: number;
    started_at?: string | null;
    completed_at?: string | null;
    recipients?: Recipient[];
}

interface Recipient {
    id: number;
    name?: string | null;
    phone: string;
    status: string;
    error?: string | null;
    sent_at?: string | null;
}

interface Paginator { data: Run[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }

const statusLabels: Record<string, string> = { completed: 'تکمیل‌شده', running: 'در حال اجرا', failed: 'ناموفق', queued: 'در صف' };

function date(value?: string | null) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export default function BulkSmsReports() {
    const { runs, selectedRun, stats, filters } = usePage<PageProps & {
        runs: Paginator;
        selectedRun?: Run | null;
        stats: { runs: number; sent: number; failed: number; recipients: number };
        filters: { status: string };
    }>().props;

    const selectRun = (run: Run) => router.get('/admin/marketing/bulk-sms/reports', { run: run.id, status: filters.status || undefined }, { preserveState: true, preserveScroll: true });
    const filter = (status: string) => router.get('/admin/marketing/bulk-sms/reports', { status: status || undefined }, { preserveState: true, preserveScroll: true });

    return <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin/marketing/bulk-sms" className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به ارسال پیامک</Link>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div><div className="flex items-center gap-2 text-xs font-black text-brand-200"><FileText className="size-4" /> گزارش ارسال پیامک</div><h1 className="mt-3 text-2xl font-black md:text-3xl">گزارش وضعیت پیامک‌های انبوه</h1><p className="mt-2 text-sm leading-7 text-white/65">جزئیات ارسال‌های موفق و ناموفق هر فایل را بررسی کنید.</p></div>
                <Link href="/admin/marketing/bulk-sms" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-deep-green hover:bg-brand-100"><Send className="size-4" /> ارسال جدید</Link>
            </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={FileText} label="تعداد ارسال‌ها" value={stats.runs} />
            <Stat icon={Smartphone} label="کل مخاطبان" value={stats.recipients} />
            <Stat icon={CheckCircle2} label="ارسال موفق" value={stats.sent} color="text-emerald-600" />
            <Stat icon={XCircle} label="ارسال ناموفق" value={stats.failed} color="text-red-600" />
        </section>

        <section className="flex flex-wrap items-center gap-2">
            {[['', 'همه'], ['completed', 'تکمیل‌شده'], ['running', 'در حال اجرا'], ['failed', 'ناموفق']].map(([value, label]) => <button key={value} type="button" onClick={() => filter(value)} className={`rounded-xl px-4 py-2 text-xs font-black ${filters.status === value ? 'bg-deep-green text-white' : 'bg-white text-navy/55 ring-1 ring-navy/5 hover:bg-brand-50'}`}>{label}</button>)}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
            <div className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
                <div className="border-b border-navy/5 px-5 py-4"><h2 className="text-sm font-black text-navy">تاریخچه ارسال‌ها</h2><p className="mt-1 text-xs text-navy/40">{formatNumber(runs.total)} ارسال ثبت شده</p></div>
                <div className="divide-y divide-navy/5">
                    {runs.data.map((run) => <button key={run.id} type="button" onClick={() => selectRun(run)} className={`block w-full p-5 text-right transition-colors hover:bg-soft-gray/60 ${selectedRun?.id === run.id ? 'bg-brand-50' : ''}`}>
                        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><strong className="text-sm font-black text-navy">ارسال شماره {formatNumber(run.id)}</strong><Status status={run.status} /></div><p className="mt-2 line-clamp-2 text-xs leading-6 text-navy/55">{run.message}</p></div><Clock3 className="size-4 shrink-0 text-navy/35" /></div>
                        <div className="mt-3 flex flex-wrap gap-3 text-[0.68rem] font-bold"><span className="text-navy/50">{date(run.started_at)}</span><span className="text-emerald-700">موفق: {formatNumber(run.sent_count)}</span><span className="text-red-600">خطا: {formatNumber(run.failed_count)}</span></div>
                    </button>)}
                    {runs.data.length === 0 && <div className="p-10 text-center text-sm font-bold text-navy/45">هنوز گزارشی ثبت نشده است.</div>}
                </div>
                {runs.links.length > 3 && <div className="flex justify-center gap-1 border-t border-navy/5 p-4">{runs.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
            </div>

            <div className="rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
                {selectedRun ? <>
                    <div className="border-b border-navy/5 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-black text-navy">جزئیات ارسال شماره {formatNumber(selectedRun.id)}</h2><p className="mt-1 text-xs text-navy/45">شروع: {date(selectedRun.started_at)} · پایان: {date(selectedRun.completed_at)}</p></div><Status status={selectedRun.status} /></div><div className="mt-4 rounded-xl bg-soft-gray p-3 text-xs leading-6 text-navy/65">{selectedRun.message}</div></div>
                    <div className="max-h-[560px] overflow-y-auto divide-y divide-navy/5">
                        {(selectedRun.recipients ?? []).map((recipient) => <div key={recipient.id} className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><div className="flex items-center gap-2"><strong className="truncate text-xs font-black text-navy">{recipient.name || 'مخاطب'}</strong><span className="font-mono text-[0.68rem] text-navy/45">{recipient.phone}</span></div>{recipient.error && <p className="mt-1 flex items-start gap-1 text-[0.68rem] leading-5 text-red-600"><AlertCircle className="mt-0.5 size-3 shrink-0" /> {recipient.error}</p>}</div><Status status={recipient.status} /></div>)}
                    </div>
                </> : <div className="flex min-h-[360px] items-center justify-center p-8 text-center"><div><FileText className="mx-auto size-10 text-brand-400" /><p className="mt-3 text-sm font-black text-navy">یک ارسال را انتخاب کنید</p><p className="mt-1 text-xs text-navy/45">جزئیات موفقیت و خطا در این بخش نمایش داده می‌شود.</p></div></div>}
            </div>
        </section>
    </div>;
}

function Stat({ icon: Icon, label, value, color = 'text-brand-600' }: { icon: typeof FileText; label: string; value: number; color?: string }) { return <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-navy/5"><span className={`panel-inline-icon ${color}`}><Icon className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{formatNumber(value)}</strong><span className="text-xs font-bold text-navy/45">{label}</span></div></div>; }
function Status({ status }: { status: string }) { const failed = status === 'failed'; const success = status === 'sent' || status === 'completed'; return <span className={`rounded-lg px-2 py-1 text-[0.63rem] font-black ${failed ? 'bg-red-50 text-red-700' : success ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{statusLabels[status] ?? status}</span>; }

BulkSmsReports.layout = (page: ReactNode) => <AdminLayout title="گزارش ارسال پیامک">{page}</AdminLayout>;
