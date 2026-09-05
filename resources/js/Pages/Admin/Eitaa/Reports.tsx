import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

type Daily = { day: string; sent: number; failed: number; inbound: number };
type Campaign = { id: number; bot?: string | null; name: string; status: string; total_targets: number; sent_count: number; failed_count: number };

const statusLabels: Record<string, string> = {
    running: 'در حال ارسال', completed: 'تکمیل‌شده', failed: 'ناموفق', paused: 'متوقف',
};
const categoryLabels: Record<string, string> = {
    network: 'خطای شبکه', auth: 'توکن نامعتبر', forbidden: 'دسترسی ندارند', not_found: 'مقصد پیدا نشد',
    rate_limit: 'محدودیت نرخ', invalid: 'داده نامعتبر', unknown: 'نامشخص',
};

export default function EitaaReports() {
    const { summary, daily, campaignStats, range } = usePage<PageProps & {
        range: number;
        summary: { sent: number; failed: number; failure_rate: number; campaigns: number; completed_campaigns: number; by_category: Record<string, number> };
        daily: Daily[];
        campaignStats: Campaign[];
    }>().props;

    const maxDaily = Math.max(1, ...daily.map((d) => d.sent + d.failed));

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><BarChart3 className="size-6 text-brand-600" /> گزارش ارسال‌ها</h1>
            <p className="mt-2 text-sm text-navy/50">عملکرد پیام‌های خروجی در {range} روز گذشته.</p>
        </div>

        <section className="flex flex-wrap gap-2">
            {[1, 7, 30].map((value) => <Link key={value} href={`/admin/eitaa/reports?range=${value}`} preserveState className={`rounded-xl px-4 py-2 text-xs font-black ${range === value ? 'bg-brand-600 text-white' : 'bg-white text-navy/60 shadow-soft ring-1 ring-navy/5 hover:bg-brand-50'}`}>
                {value === 1 ? 'امروز' : `${value} روز`}
            </Link>)}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><div className="text-2xl font-black text-emerald-600">{summary.sent}</div><div className="mt-1 text-xs font-bold text-navy/45">ارسال‌شده</div></div>
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><div className="text-2xl font-black text-red-600">{summary.failed}</div><div className="mt-1 text-xs font-bold text-navy/45">ناموفق</div></div>
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><div className="text-2xl font-black text-navy">{summary.failure_rate}٪</div><div className="mt-1 text-xs font-bold text-navy/45">نرخ خطا</div></div>
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><div className="text-2xl font-black text-navy">{summary.campaigns}</div><div className="mt-1 text-xs font-bold text-navy/45">کمپین ساخته‌شده</div></div>
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><div className="text-2xl font-black text-brand-700">{summary.completed_campaigns}</div><div className="mt-1 text-xs font-bold text-navy/45">تکمیل‌شده</div></div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5">
            <h2 className="text-sm font-black text-navy">روند روزانه</h2>
            {daily.length === 0 ? <p className="mt-6 text-center text-xs font-bold text-navy/40">در این بازه داده‌ای نیست.</p> : <div className="mt-5 flex items-end gap-2 overflow-x-auto pb-2" dir="ltr">
                {daily.map((d) => <div key={d.day} className="flex min-w-10 flex-col items-center gap-1">
                    <div className="flex h-32 w-6 flex-col justify-end gap-0.5">
                        <div className="w-full rounded-t bg-red-400" style={{ height: `${(d.failed / maxDaily) * 100}%` }} />
                        <div className="w-full rounded-b bg-brand-500" style={{ height: `${(d.sent / maxDaily) * 100}%` }} />
                    </div>
                    <span className="text-[0.55rem] font-bold text-navy/40">{d.day.slice(5)}</span>
                </div>)}
            </div>}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5">
                <h2 className="text-sm font-black text-navy">خطاها بر اساس دسته</h2>
                <div className="mt-4 space-y-2">
                    {Object.entries(summary.by_category).length === 0 && <p className="text-xs font-bold text-navy/40">خطایی ثبت نشده است. 🎉</p>}
                    {Object.entries(summary.by_category).map(([category, count]) => <div key={category} className="flex items-center justify-between rounded-xl bg-soft-gray px-4 py-2.5 text-xs font-bold text-navy/70">
                        <span>{categoryLabels[category] ?? category}</span><span className="font-black text-red-600">{count}</span>
                    </div>)}
                </div>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5">
                <h2 className="text-sm font-black text-navy">عملکرد کمپین‌های اخیر</h2>
                <div className="mt-4 space-y-2">
                    {campaignStats.length === 0 && <p className="text-xs font-bold text-navy/40">کمپین اجراشده‌ای نیست.</p>}
                    {campaignStats.map((campaign) => <div key={campaign.id} className="flex items-center justify-between rounded-xl bg-soft-gray px-4 py-2.5 text-xs font-bold text-navy/70">
                        <span className="min-w-0 truncate">{campaign.name}</span>
                        <span className="flex shrink-0 items-center gap-2">
                            <span className="text-emerald-600">{campaign.sent_count}/{campaign.total_targets}</span>
                            <span className="rounded bg-white px-1.5 py-0.5 text-[0.6rem] font-black text-navy/50">{statusLabels[campaign.status] ?? campaign.status}</span>
                        </span>
                    </div>)}
                </div>
            </div>
        </section>
    </div>;
}

EitaaReports.layout = (page: ReactNode) => <AdminLayout title="گزارش ایتا">{page}</AdminLayout>;
