import { router, usePage } from '@inertiajs/react';
import { Activity, Search, ShieldCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface AuditLog {
    id: number;
    action: string;
    route?: string | null;
    method: string;
    ip_address?: string | null;
    status?: number | null;
    created_at?: string | null;
    user?: { name: string; phone?: string | null } | null;
}
interface Paginator { data: AuditLog[]; total: number; links: Array<{ url: string | null; label: string; active: boolean }> }

export default function AuditLogsIndex() {
    const { logs, filters } = usePage<PageProps & { logs: Paginator; filters: { search?: string } }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = () => router.get('/admin/audit-logs', { search }, { preserveState: true, preserveScroll: true });

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="relative flex items-start gap-3"><ShieldCheck className="mt-1 size-6 text-brand-200" /><div><div className="text-xs font-black text-brand-200">امنیت و پاسخ‌گویی</div><h1 className="mt-2 text-2xl font-black">گزارش فعالیت مدیران</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">درخواست‌های تغییردهنده داده‌ها بدون ذخیره‌کردن رمزها و مقادیر حساس ثبت می‌شوند.</p></div></div>
        </section>
        <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
            <div className="flex flex-wrap items-center gap-3 border-b border-navy/5 p-4"><div className="relative min-w-[16rem] flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && apply()} placeholder="جستجوی Route، عملیات یا IP..." className="w-full rounded-xl border border-navy/10 py-3 pl-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></div><button type="button" onClick={apply} className="rounded-xl bg-deep-green px-5 py-3 text-sm font-black text-white hover:bg-brand-700">جستجو</button></div>
            {logs.data.length > 0 ? <div className="overflow-x-auto"><table className="w-full min-w-[50rem] text-right text-sm"><thead className="border-b border-navy/5 text-xs text-navy/40"><tr><th className="px-5 py-4">مدیر</th><th className="px-5 py-4">عملیات</th><th className="px-5 py-4">Method</th><th className="px-5 py-4">IP</th><th className="px-5 py-4">وضعیت</th><th className="px-5 py-4">زمان</th></tr></thead><tbody>{logs.data.map((log) => <tr key={log.id} className="border-b border-navy/5 last:border-0"><td className="px-5 py-4"><div className="font-black text-navy">{log.user?.name ?? 'کاربر حذف‌شده'}</div><div className="text-xs text-navy/40">{log.user?.phone}</div></td><td className="px-5 py-4"><div className="flex items-center gap-2 font-bold text-navy/70"><Activity className="size-4 text-brand-600" /> {log.action}</div><div className="mt-1 text-xs text-navy/40">{log.route}</div></td><td className="px-5 py-4"><span className="rounded-lg bg-brand-50 px-2 py-1 text-[0.65rem] font-black text-brand-700">{log.method}</span></td><td className="px-5 py-4 font-mono text-xs text-navy/55" dir="ltr">{log.ip_address}</td><td className="px-5 py-4 text-xs font-black text-emerald-700">{log.status}</td><td className="px-5 py-4 text-xs text-navy/45">{log.created_at ? new Date(log.created_at).toLocaleString('fa-IR') : '—'}</td></tr>)}</tbody></table></div> : <div className="p-16 text-center text-sm font-bold text-navy/45">هنوز فعالیت تغییردهنده‌ای ثبت نشده است.</div>}
            {logs.links.length > 3 && <div className="flex flex-wrap justify-center gap-1 border-t border-navy/5 p-4">{logs.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
    </div>;
}

AuditLogsIndex.layout = (page: ReactNode) => <AdminLayout title="گزارش فعالیت مدیران">{page}</AdminLayout>;
