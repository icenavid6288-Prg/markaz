import { Link, usePage } from '@inertiajs/react';
import { CreditCard, MessageSquare, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/Components/ui/Button';

interface ServiceStatus {
    state: 'ok' | 'error' | 'not_configured';
    message: string;
}
type ServiceStatusMap = Record<string, ServiceStatus>;

interface HealthSummary {
    state: 'ok' | 'error' | 'not_configured' | 'loading';
    message: string;
}

function summarize(map: ServiceStatusMap | null, pseudoKeys: string[]): HealthSummary {
    if (!map) return { state: 'loading', message: 'در حال بررسی…' };

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

const meta: Record<HealthSummary['state'], { dot: string; pill: string; text: string }> = {
    ok: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700', text: 'متصل' },
    error: { dot: 'bg-red-500', pill: 'bg-red-50 text-red-600', text: 'خطا' },
    not_configured: { dot: 'bg-navy/35', pill: 'bg-navy/10 text-navy/55', text: 'تنظیم نشده' },
    loading: { dot: 'bg-navy/25 animate-pulse', pill: 'bg-navy/10 text-navy/55', text: 'در حال بررسی…' },
};

export default function ServicesHealthWidget() {
    const { auth } = usePage().props as { auth: { user: { permissions?: string[] } | null } };
    const canViewSettings = auth?.user?.permissions?.includes('view settings') ?? false;

    const [sms, setSms] = useState<ServiceStatusMap | null>(null);
    const [payment, setPayment] = useState<ServiceStatusMap | null>(null);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);

    const load = () => {
        if (!canViewSettings) return;
        setLoading(true);
        setFailed(false);
        Promise.all([
            fetch('/admin/settings/sms/status', { headers: { Accept: 'application/json' } }),
            fetch('/admin/settings/payment/status', { headers: { Accept: 'application/json' } }),
        ])
            .then(([smsResponse, paymentResponse]) => Promise.all([smsResponse.json(), paymentResponse.json()]))
            .then(([smsData, paymentData]) => {
                setSms(smsData as ServiceStatusMap);
                setPayment(paymentData as ServiceStatusMap);
            })
            .catch(() => setFailed(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    if (!canViewSettings) return null;

    const rows: Array<{
        key: 'sms' | 'payment';
        title: string;
        href: string;
        icon: typeof MessageSquare;
        map: ServiceStatusMap | null;
        pseudoKeys: string[];
        providers: Array<{ key: string; label: string }>;
    }> = [
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

    return (
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-black text-navy">سلامت سرویس‌ها</h2>
                <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> به‌روزرسانی
                </Button>
            </div>

            {failed && (
                <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">
                    دریافت وضعیت سرویس‌ها ناموفق بود؛ دوباره امتحان کنید.
                </p>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
                {rows.map((row) => {
                    const summary = summarize(row.map, row.pseudoKeys);
                    const rowMeta = meta[summary.state];

                    return (
                        <div key={row.key} className="rounded-2xl border border-navy/5 bg-soft-gray/60 p-4">
                            <div className="flex items-center gap-2.5">
                                <span className="glass-tile"><row.icon className="size-4" /></span>
                                <span className="truncate text-xs font-black text-navy">{row.title}</span>
                                <span className={`mr-auto shrink-0 rounded-md px-2 py-0.5 text-[0.62rem] font-black ${rowMeta.pill}`}>
                                    {rowMeta.text}
                                </span>
                            </div>
                            <p className="mt-2 text-[0.68rem] leading-5 text-navy/55" title={summary.message}>{summary.message}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {row.providers.map((provider) => {
                                    const status = row.map?.[provider.key];
                                    const dot = status
                                        ? (status.state === 'ok' ? 'bg-emerald-500' : status.state === 'error' ? 'bg-red-500' : 'bg-navy/30')
                                        : 'bg-navy/25 animate-pulse';

                                    return (
                                        <span key={provider.key} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[0.62rem] font-bold text-navy/65 ring-1 ring-navy/5">
                                            <span className={`size-1.5 rounded-full ${dot}`} aria-hidden />
                                            {provider.label}
                                        </span>
                                    );
                                })}
                            </div>
                            <Link href={row.href} className="mt-3 inline-flex items-center gap-1 text-[0.68rem] font-black text-brand-700 hover:text-brand-800">
                                مشاهده تنظیمات <span aria-hidden>←</span>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
