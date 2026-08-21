import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Headphones, Package, ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDate, formatNumber, formatPrice } from '@/lib/format';
import type { PageProps } from '@/types';

interface Order { id: number; order_number: string; status: string; total: number; created_at?: string | null; items_count: number; first_item?: string | null; downloads?: Array<{ title: string; url: string }> }
const statusLabels: Record<string, string> = { pending: 'در انتظار پرداخت', paid: 'پرداخت موفق', completed: 'تکمیل شده', failed: 'ناموفق', cancelled: 'لغو شده' };

export default function DashboardOrders() {
    const { orders } = usePage<PageProps & { orders: Order[] }>().props;

    return <UserDashboardLayout>
        <div className="mx-auto flex max-w-6xl flex-col gap-7">
            <header className="flex flex-wrap items-end justify-between gap-4"><div><span className="dashboard-eyebrow"><span /> خریدها</span><h2 className="mt-2 text-2xl font-black text-navy">سفارش‌های من</h2><p className="mt-2 text-sm leading-7 text-navy/50">تاریخچه خرید دوره‌ها و محصولات آموزشی شما.</p></div><div className="flex flex-wrap gap-2"><Link href="/dashboard/library" className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-xs font-black text-brand-700 hover:bg-brand-100"><Headphones className="size-4" /> کتابخانه من</Link><Link href="/shop" className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-xs font-black text-brand-700 hover:bg-brand-50">بازگشت به فروشگاه <ArrowLeft className="size-4" /></Link></div></header>
            <section className="overflow-x-auto rounded-2xl border border-white/80 bg-white/80 shadow-soft">{orders.length > 0 ? <table className="w-full min-w-[42rem] text-right text-sm"><thead className="border-b border-navy/5 text-xs text-navy/40"><tr><th className="px-5 py-4 font-bold">شماره سفارش</th><th className="px-5 py-4 font-bold">محصول</th><th className="px-5 py-4 font-bold">تاریخ</th><th className="px-5 py-4 font-bold">مبلغ</th><th className="px-5 py-4 font-bold">وضعیت</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id} className="border-b border-navy/5 last:border-0"><td className="px-5 py-4 font-black text-brand-700">{order.order_number}</td><td className="px-5 py-4"><span className="flex items-center gap-2 font-bold text-navy/70"><Package className="size-4 text-brand-600" /> {order.first_item ?? `${formatNumber(order.items_count)} آیتم`}</span>{order.downloads && order.downloads.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{order.downloads.map((download) => <a key={download.url} href={download.url} className="text-[0.65rem] font-black text-brand-700 hover:text-brand-900">دانلود فایل ←</a>)}</div>}</td><td className="px-5 py-4 text-xs text-navy/45">{formatDate(order.created_at)}</td><td className="px-5 py-4 font-black text-navy">{formatPrice(order.total)}</td><td className="px-5 py-4"><span className="rounded-lg bg-brand-50 px-2 py-1 text-[0.65rem] font-black text-brand-700">{statusLabels[order.status] ?? order.status}</span>{order.status === 'paid' && <a href={`/dashboard/orders/${order.order_number}/invoice`} className="mr-2 text-[0.65rem] font-black text-brand-700 hover:text-brand-900">فاکتور</a>}</td></tr>)}</tbody></table> : <div className="px-5 py-14 text-center"><ShoppingBag className="mx-auto size-8 text-brand-500" /><p className="mt-3 text-sm font-bold text-navy/50">هنوز سفارشی ثبت نکرده‌اید.</p><Link href="/shop" className="mt-3 inline-flex items-center gap-1 text-xs font-black text-brand-700">مشاهده فروشگاه <ArrowLeft className="size-3.5" /></Link></div>}</section>
        </div>
    </UserDashboardLayout>;
}

DashboardOrders.layout = (page: ReactNode) => page;
