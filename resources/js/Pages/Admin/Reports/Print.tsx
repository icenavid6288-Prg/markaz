import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface PrintProps {
    generated_at: string;
    summary: {
        revenue: number; refunded_amount: number; paid_orders: number; refunded_orders: number;
        enrollments: number; completed_sessions: number; cancelled_sessions: number; users: number;
    };
    recent_orders: Array<{ order_number: string; user?: string | null; status: string; total: number; created_at?: string | null }>;
}

const statusLabels: Record<string, string> = { paid: 'پرداخت‌شده', refunded: 'بازگشت وجه', pending: 'در انتظار', cancelled: 'لغو', failed: 'ناموفق' };

export default function ReportsPrint() {
    const { generated_at, summary, recent_orders } = usePage<PageProps & PrintProps>().props;
    useEffect(() => { window.print(); }, []);

    return <div className="mx-auto max-w-4xl bg-white p-8 text-navy" dir="rtl">
        <header className="mb-8 flex items-end justify-between border-b border-navy/10 pb-4">
            <div>
                <h1 className="text-2xl font-black">گزارش مدیریتی مرکز رشد</h1>
                <p className="mt-1 text-xs text-navy/50">تولید شده در {new Date(generated_at).toLocaleString('fa-IR')}</p>
            </div>
            <button type="button" onClick={() => window.print()} className="rounded-lg bg-navy px-3 py-2 text-xs font-black text-white print:hidden">چاپ / ذخیره PDF</button>
        </header>
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
                ['درآمد', summary.revenue],
                ['بازگشت وجه', summary.refunded_amount],
                ['سفارش موفق', summary.paid_orders],
                ['کاربران', summary.users],
                ['ثبت‌نام دوره', summary.enrollments],
                ['جلسه انجام‌شده', summary.completed_sessions],
                ['جلسه لغو شده', summary.cancelled_sessions],
                ['سفارش مسترد', summary.refunded_orders],
            ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-navy/10 p-3"><div className="text-lg font-black">{formatNumber(Number(value))}</div><div className="text-[0.7rem] text-navy/50">{label}</div></div>)}
        </section>
        <h2 className="mb-3 text-sm font-black">آخرین سفارش‌ها</h2>
        <table className="w-full text-right text-xs">
            <thead><tr className="border-b border-navy/10 text-navy/50"><th className="py-2">شماره</th><th>کاربر</th><th>وضعیت</th><th>مبلغ</th><th>تاریخ</th></tr></thead>
            <tbody>
                {recent_orders.map((order) => <tr key={order.order_number} className="border-b border-navy/5"><td className="py-2 font-bold">{order.order_number}</td><td>{order.user ?? '—'}</td><td>{statusLabels[order.status] ?? order.status}</td><td>{formatNumber(order.total)}</td><td>{order.created_at}</td></tr>)}
            </tbody>
        </table>
    </div>;
}

