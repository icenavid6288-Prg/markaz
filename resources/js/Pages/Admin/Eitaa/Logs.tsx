import { router, usePage } from '@inertiajs/react';
import { ArrowRight, FileClock } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

type Log = { id: number; bot?: { id: number; name: string } | null; event: string; level: string; message: string; created_at: string };
type Paginator = { data: Log[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number };

const levelTone: Record<string, string> = {
    info: 'bg-sky-50 text-sky-700',
    error: 'bg-red-50 text-red-600',
    warning: 'bg-amber-50 text-amber-700',
};

export default function EitaaLogs() {
    const { logs, filters } = usePage<PageProps & {
        logs: Paginator; filters: { level: string; event: string };
    }>().props;

    const applyFilter = (key: 'level' | 'event', value: string) =>
        router.get('/admin/eitaa/logs', { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><FileClock className="size-6 text-brand-600" /> لاگ رویدادها</h1>
            <p className="mt-2 text-sm text-navy/50">تاریخچه رویدادهای ماژول ایتا: اتصال، ارسال، خطا و تغییرات.</p>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/5 px-5 py-4">
                <h2 className="text-sm font-black text-navy">رویدادها ({logs.total})</h2>
                <div className="flex flex-wrap gap-2">
                    <input defaultValue={filters.event} onKeyDown={(e) => { if (e.key === 'Enter') applyFilter('event', e.currentTarget.value); }} placeholder="جستجوی رویداد (مثلاً message)" className="w-48 rounded-lg border border-navy/10 px-3 py-2 text-xs outline-none focus:border-brand-500" />
                    <select value={filters.level} onChange={(e) => applyFilter('level', e.target.value)} className="rounded-lg border border-navy/10 px-3 py-2 text-xs outline-none">
                        <option value="">همه سطوح</option>
                        <option value="info">اطلاعات</option>
                        <option value="warning">هشدار</option>
                        <option value="error">خطا</option>
                    </select>
                </div>
            </div>
            <div className="divide-y divide-navy/5">
                {logs.data.map((log) => <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-md px-2 py-1 text-[0.62rem] font-black ${levelTone[log.level] ?? 'bg-soft-gray text-navy/50'}`}>
                                {log.level === 'error' ? 'خطا' : log.level === 'warning' ? 'هشدار' : 'اطلاعات'}
                            </span>
                            <strong className="font-mono text-xs font-black text-navy" dir="ltr">{log.event}</strong>
                            <span className="text-[0.65rem] text-navy/40">{log.bot?.name ?? '—'}</span>
                        </div>
                        <p className="mt-1 text-xs text-navy/60">{log.message}</p>
                    </div>
                    <span className="shrink-0 text-[0.65rem] font-bold text-navy/40">{log.created_at}</span>
                </div>)}
                {logs.data.length === 0 && <div className="p-10 text-center"><FileClock className="mx-auto size-8 text-navy/25" /><p className="mt-3 text-sm font-bold text-navy/45">رویدادی ثبت نشده است.</p></div>}
            </div>
            {logs.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">
                {logs.links.map((link, index) => <a key={index} href={link.url || '#'} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}
            </div>}
        </section>
    </div>;
}

EitaaLogs.layout = (page: ReactNode) => <AdminLayout title="لاگ ایتا">{page}</AdminLayout>;
