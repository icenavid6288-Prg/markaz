import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, usePage } from '@inertiajs/react';
import { CreditCard, MessageSquare, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/Components/ui/Button';
function summarize(map, pseudoKeys) {
    if (!map)
        return { state: 'loading', message: 'در حال بررسی…' };
    const entries = Object.entries(map).filter(([key]) => !pseudoKeys.includes(key));
    const errors = entries.filter(([, status]) => status.state === 'error');
    if (errors.length) {
        return { state: 'error', message: errors.map(([, status]) => status.message).join(' · ') };
    }
    const ok = entries.filter(([, status]) => status.state === 'ok');
    const notConfigured = entries.filter(([, status]) => status.state === 'not_configured');
    if (ok.length === 0) {
        return { state: 'not_configured', message: 'هنوز کلیدی برای این سرویس تنظیم نشده است.' };
    }
    return {
        state: 'ok',
        message: notConfigured.length
            ? `${ok.length} سرویس متصل؛ ${notConfigured.length} سرویس هنوز تنظیم نشده است.`
            : 'همه سرویس‌ها متصل هستند.',
    };
}
const meta = {
    ok: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700', text: 'متصل' },
    error: { dot: 'bg-red-500', pill: 'bg-red-50 text-red-600', text: 'خطا' },
    not_configured: { dot: 'bg-navy/35', pill: 'bg-navy/10 text-navy/55', text: 'تنظیم نشده' },
    loading: { dot: 'bg-navy/25 animate-pulse', pill: 'bg-navy/10 text-navy/55', text: 'در حال بررسی…' },
};
export default function ServicesHealthWidget() {
    const { auth } = usePage().props;
    const canViewSettings = auth?.user?.permissions?.includes('view settings') ?? false;
    const [sms, setSms] = useState(null);
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const load = () => {
        if (!canViewSettings)
            return;
        setLoading(true);
        setFailed(false);
        Promise.all([
            fetch('/admin/settings/sms/status', { headers: { Accept: 'application/json' } }),
            fetch('/admin/settings/payment/status', { headers: { Accept: 'application/json' } }),
        ])
            .then(([smsResponse, paymentResponse]) => Promise.all([smsResponse.json(), paymentResponse.json()]))
            .then(([smsData, paymentData]) => {
            setSms(smsData);
            setPayment(paymentData);
        })
            .catch(() => setFailed(true))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);
    if (!canViewSettings)
        return null;
    const rows = [
        {
            key: 'sms',
            title: 'پنل پیامک',
            href: '/admin/settings/sms',
            icon: MessageSquare,
            map: sms,
            pseudoKeys: ['log'],
            providers: [
                { key: 'kavenegar', label: 'کاوه‌نگار' },
                { key: 'smsir', label: 'SMS.ir' },
                { key: 'melipayamak', label: 'ملی‌پیامک' },
            ],
        },
        {
            key: 'payment',
            title: 'درگاه پرداخت',
            href: '/admin/settings/payments',
            icon: CreditCard,
            map: payment,
            pseudoKeys: ['local'],
            providers: [
                { key: 'zarinpal', label: 'زرین‌پال' },
                { key: 'idpay', label: 'آیدی‌پی' },
                { key: 'zibal', label: 'زیبال' },
            ],
        },
    ];
    return (_jsxs("section", { className: "rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5", children: [_jsxs("div", { className: "mb-5 flex flex-wrap items-center justify-between gap-3", children: [_jsx("h2", { className: "text-sm font-black text-navy", children: "\u0633\u0644\u0627\u0645\u062A \u0633\u0631\u0648\u06CC\u0633\u200C\u0647\u0627" }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: load, disabled: loading, children: [_jsx(RefreshCw, { className: `size-3.5 ${loading ? 'animate-spin' : ''}` }), " \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC"] })] }), failed && (_jsx("p", { className: "mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600", children: "\u062F\u0631\u06CC\u0627\u0641\u062A \u0648\u0636\u0639\u06CC\u062A \u0633\u0631\u0648\u06CC\u0633\u200C\u0647\u0627 \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F\u061B \u062F\u0648\u0628\u0627\u0631\u0647 \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646\u06CC\u062F." })), _jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: rows.map((row) => {
                    const summary = summarize(row.map, row.pseudoKeys);
                    const rowMeta = meta[summary.state];
                    return (_jsxs("div", { className: "rounded-2xl border border-navy/5 bg-soft-gray/60 p-4", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("span", { className: "glass-tile", children: _jsx(row.icon, { className: "size-4" }) }), _jsx("span", { className: "truncate text-xs font-black text-navy", children: row.title }), _jsx("span", { className: `mr-auto shrink-0 rounded-md px-2 py-0.5 text-[0.62rem] font-black ${rowMeta.pill}`, children: rowMeta.text })] }), _jsx("p", { className: "mt-2 text-[0.68rem] leading-5 text-navy/55", title: summary.message, children: summary.message }), _jsx("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: row.providers.map((provider) => {
                                    const status = row.map?.[provider.key];
                                    const dot = status
                                        ? (status.state === 'ok' ? 'bg-emerald-500' : status.state === 'error' ? 'bg-red-500' : 'bg-navy/30')
                                        : 'bg-navy/25 animate-pulse';
                                    return (_jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[0.62rem] font-bold text-navy/65 ring-1 ring-navy/5", children: [_jsx("span", { className: `size-1.5 rounded-full ${dot}`, "aria-hidden": true }), provider.label] }, provider.key));
                                }) }), _jsxs(Link, { href: row.href, className: "mt-3 inline-flex items-center gap-1 text-[0.68rem] font-black text-brand-700 hover:text-brand-800", children: ["\u0645\u0634\u0627\u0647\u062F\u0647 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A ", _jsx("span", { "aria-hidden": true, children: "\u2190" })] })] }, row.key));
                }) })] }));
}
