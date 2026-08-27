import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { formatNumber } from '@/lib/format';
const statusLabels = { paid: 'پرداخت‌شده', refunded: 'بازگشت وجه', pending: 'در انتظار', cancelled: 'لغو', failed: 'ناموفق' };
export default function ReportsPrint() {
    const { generated_at, summary, recent_orders } = usePage().props;
    useEffect(() => { window.print(); }, []);
    return _jsxs("div", { className: "mx-auto max-w-4xl bg-white p-8 text-navy", dir: "rtl", children: [_jsxs("header", { className: "mb-8 flex items-end justify-between border-b border-navy/10 pb-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-black", children: "\u06AF\u0632\u0627\u0631\u0634 \u0645\u062F\u06CC\u0631\u06CC\u062A\u06CC \u0645\u0631\u06A9\u0632 \u0631\u0634\u062F" }), _jsxs("p", { className: "mt-1 text-xs text-navy/50", children: ["\u062A\u0648\u0644\u06CC\u062F \u0634\u062F\u0647 \u062F\u0631 ", new Date(generated_at).toLocaleString('fa-IR')] })] }), _jsx("button", { type: "button", onClick: () => window.print(), className: "rounded-lg bg-navy px-3 py-2 text-xs font-black text-white print:hidden", children: "\u0686\u0627\u067E / \u0630\u062E\u06CC\u0631\u0647 PDF" })] }), _jsx("section", { className: "mb-8 grid grid-cols-2 gap-3 md:grid-cols-4", children: [
                    ['درآمد', summary.revenue],
                    ['بازگشت وجه', summary.refunded_amount],
                    ['سفارش موفق', summary.paid_orders],
                    ['کاربران', summary.users],
                    ['ثبت‌نام دوره', summary.enrollments],
                    ['جلسه انجام‌شده', summary.completed_sessions],
                    ['جلسه لغو شده', summary.cancelled_sessions],
                    ['سفارش مسترد', summary.refunded_orders],
                ].map(([label, value]) => _jsxs("div", { className: "rounded-xl border border-navy/10 p-3", children: [_jsx("div", { className: "text-lg font-black", children: formatNumber(Number(value)) }), _jsx("div", { className: "text-[0.7rem] text-navy/50", children: label })] }, String(label))) }), _jsx("h2", { className: "mb-3 text-sm font-black", children: "\u0622\u062E\u0631\u06CC\u0646 \u0633\u0641\u0627\u0631\u0634\u200C\u0647\u0627" }), _jsxs("table", { className: "w-full text-right text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-navy/10 text-navy/50", children: [_jsx("th", { className: "py-2", children: "\u0634\u0645\u0627\u0631\u0647" }), _jsx("th", { children: "\u06A9\u0627\u0631\u0628\u0631" }), _jsx("th", { children: "\u0648\u0636\u0639\u06CC\u062A" }), _jsx("th", { children: "\u0645\u0628\u0644\u063A" }), _jsx("th", { children: "\u062A\u0627\u0631\u06CC\u062E" })] }) }), _jsx("tbody", { children: recent_orders.map((order) => _jsxs("tr", { className: "border-b border-navy/5", children: [_jsx("td", { className: "py-2 font-bold", children: order.order_number }), _jsx("td", { children: order.user ?? '—' }), _jsx("td", { children: statusLabels[order.status] ?? order.status }), _jsx("td", { children: formatNumber(order.total) }), _jsx("td", { children: order.created_at })] }, order.order_number)) })] })] });
}
ReportsPrint.layout = (page) => page;
