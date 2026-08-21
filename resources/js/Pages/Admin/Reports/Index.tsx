import { Link, router, usePage } from '@inertiajs/react';
import { Download, Printer, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface Summary {
    orders: number; paid_orders: number; refunded_orders: number; pending_refunds?: number; revenue: number;
    refunded_amount: number; enrollments: number; sessions: number; users: number;
}
interface ExportLink { key: string; title: string; href: string }
interface PendingRefund { id: number; order_number: string; user?: string | null; total: number; refund_reason?: string | null }

export default function ReportsIndex() {
    const { summary, exports, pending_refunds = [] } = usePage<PageProps & { summary: Summary; exports: ExportLink[]; pending_refunds?: PendingRefund[] }>().props;

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="mb-2 text-xs font-black text-brand-200">مرکز گزارش</div>
                    <h1 className="text-2xl font-black md:text-3xl">خروجی CSV و نسخه چاپی</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">فایل‌های CSV با BOM یونیکد برای اکسل آماده هستند. نسخه چاپی را می‌توانید از مرورگر به PDF ذخیره کنید.</p>
                </div>
                <Link href="/admin/reports/print" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-deep-green"><Printer className="size-4" /> چاپ / PDF</Link>
            </div>
        </section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
                ['سفارش موفق', summary.paid_orders],
                ['درآمد خالص', summary.revenue],
                ['بازگشت وجه', summary.refunded_amount],
                ['در انتظار درگاه', summary.pending_refunds ?? 0],
            ].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><strong className="block text-2xl font-black text-navy">{formatNumber(Number(value))}</strong><span className="text-xs font-bold text-navy/45">{label}</span></div>)}
        </div>
        {pending_refunds.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <h2 className="text-sm font-black text-amber-900">بازگشت وجه ناتمام درگاه</h2>
            <p className="mt-1 text-xs text-amber-900/70">این سفارش‌ها در سیستم لغو شده‌اند اما درگاه هنوز مبلغ را برنگردانده است.</p>
            <div className="mt-3 flex flex-col gap-2">
                {pending_refunds.map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-navy">
                        <span>{order.order_number} · {order.user ?? '—'} · {formatNumber(order.total)}</span>
                        <button type="button" onClick={() => router.post(`/admin/orders/${order.id}/refund`)} className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 font-black text-white"><RotateCcw className="size-3.5" /> تلاش دوباره</button>
                    </div>
                ))}
            </div>
        </section>}
        <section className="grid gap-3 md:grid-cols-2">
            {exports.map((item) => (
                <a key={item.key} href={item.href} className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/85 px-5 py-4 text-sm font-black text-navy shadow-soft hover:bg-brand-50">
                    خروجی {item.title}
                    <Download className="size-4 text-brand-700" />
                </a>
            ))}
        </section>
    </div>;
}

ReportsIndex.layout = (page: ReactNode) => <AdminLayout title="گزارش‌ها">{page}</AdminLayout>;
