import { Link, usePage } from '@inertiajs/react';
import { BarChart3, Bot, Crosshair, FileText, ListChecks, Megaphone, SendHorizontal, Settings, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

type Bot = { id: number; name: string; username?: string | null; status: string; test_mode: boolean };
type Campaign = { id: number; bot?: string | null; name: string; status: string; total_targets: number; sent_count: number; failed_count: number; scheduled_at?: string | null };
type Daily = { day: string; sent: number; failed: number; inbound: number };

const statusLabels: Record<string, string> = {
    draft: 'پیش‌نویس', scheduled: 'زمان‌بندی‌شده', running: 'در حال ارسال', paused: 'متوقف',
    completed: 'تکمیل‌شده', cancelled: 'لغوشده', failed: 'ناموفق',
};

export default function EitaaDashboard() {
    const { bot, stats, daily, campaigns, range } = usePage<PageProps & {
        bot: Bot | null;
        stats: Record<string, number | boolean>;
        daily: Daily[];
        campaigns: Campaign[];
        range: number;
    }>().props;

    const cards: Array<[string, string | number, string]> = [
        ['ربات‌ها', Number(stats.bots), 'bg-brand-50 text-brand-700'],
        ['مقاصد فعال', Number(stats.targets), 'bg-emerald-50 text-emerald-700'],
        ['پیام خروجی', Number(stats.messages_out), 'bg-sky-50 text-sky-700'],
        ['ارسال‌شده', Number(stats.sent), 'bg-emerald-50 text-emerald-700'],
        ['ناموفق', Number(stats.failed), 'bg-red-50 text-red-600'],
        ['کمپین فعال', Number(stats.campaigns_active), 'bg-amber-50 text-amber-700'],
        ['قالب‌های فعال', Number(stats.templates), 'bg-soft-gray text-navy'],
        ['کلمات کلیدی', Number(stats.keywords), 'bg-soft-gray text-navy'],
    ];

    const maxDaily = Math.max(1, ...daily.map((d) => d.sent + d.failed + d.inbound));

    const quickLinks: Array<[string, string, typeof Bot]> = [
        ['ربات‌ها', '/admin/eitaa/bots', Bot],
        ['مقاصد', '/admin/eitaa/targets', Crosshair],
        ['کمپین‌ها', '/admin/eitaa/campaigns', Megaphone],
        ['ارسال سریع', '/admin/eitaa/send', SendHorizontal],
        ['گزارش‌ها', '/admin/eitaa/reports', BarChart3],
        ['لاگ رویدادها', '/admin/eitaa/logs', FileText],
    ];

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-black text-brand-200"><Bot className="size-4" /> ربات ایتا</div>
                    <h1 className="mt-3 text-2xl font-black md:text-3xl">داشبورد اتوماسیون ایتا</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
                        ارسال انبوه، کمپین زمان‌بندی‌شده و پاسخ خودکار را از همین پنل مدیریت کنید.
                        {bot && <> ربات فعلی: <strong className="text-white">{bot.username ? `@${bot.username}` : bot.name}</strong></>}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/admin/eitaa/send" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-deep-green hover:bg-brand-100"><SendHorizontal className="size-4" /> ارسال پیام</Link>
                    <Link href={`/admin/eitaa?range=${range === 7 ? 30 : 7}`} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20">بازه {range} روزه</Link>
                </div>
            </div>
        </section>

        {(!bot || stats.test_mode) && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <strong className="text-sm font-black">{!bot ? 'هنوز رباتی ثبت نشده است.' : 'حالت آزمایشی فعال است.'}</strong>
            <p className="mt-1 text-xs leading-6 text-amber-900/70">
                {!bot
                    ? 'برای شروع، در صفحه «ربات‌ها» یک ربات با توکن ایتا اضافه و اتصال را تست کنید.'
                    : 'تا وقتی حالت آزمایشی روشن است، پیام‌ها شبیه‌سازی می‌شوند و چیزی واقعاً ارسال نمی‌شود. بعد از تست اتصال، آن را خاموش کنید.'}
            </p>
            <Link href="/admin/eitaa/bots" className="mt-3 inline-block rounded-xl bg-amber-900 px-4 py-2 text-xs font-black text-white hover:bg-amber-800">مدیریت ربات‌ها</Link>
        </section>}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(([label, value, tone]) => <div key={label} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft">
                <div className={`inline-flex rounded-lg px-2 py-1 text-[0.62rem] font-black ${tone}`}>{label}</div>
                <div className="mt-2 text-xl font-black text-navy">{value}</div>
            </div>)}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map(([label, href, Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft transition-colors hover:bg-brand-50">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" /></span>
                <span className="text-sm font-black text-navy">{label}</span>
            </Link>)}
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft">
            <div className="flex items-center justify-between"><h2 className="text-sm font-black text-navy">فعالیت روزانه</h2><span className="text-[0.65rem] font-bold text-navy/40">آبی: ارسال‌شده · قرمز: ناموفق · خاکستری: ورودی</span></div>
            {daily.length === 0 ? <p className="mt-6 text-center text-xs font-bold text-navy/40">در این بازه پیامی ثبت نشده است.</p> : <div className="mt-5 flex items-end gap-2 overflow-x-auto pb-2" dir="ltr">
                {daily.map((d) => <div key={d.day} className="flex min-w-10 flex-col items-center gap-1">
                    <div className="flex h-32 w-6 flex-col justify-end gap-0.5">
                        <div className="w-full rounded-t bg-red-400" style={{ height: `${(d.failed / maxDaily) * 100}%` }} />
                        <div className="w-full bg-brand-500" style={{ height: `${(d.sent / maxDaily) * 100}%` }} />
                        <div className="w-full rounded-b bg-navy/20" style={{ height: `${(d.inbound / maxDaily) * 100}%` }} />
                    </div>
                    <span className="text-[0.55rem] font-bold text-navy/40">{d.day.slice(5)}</span>
                </div>)}
            </div>}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-black text-navy"><Megaphone className="size-4 text-brand-600" /> آخرین کمپین‌ها</h2>
                <Link href="/admin/eitaa/campaigns" className="text-xs font-black text-brand-700 hover:underline">همه کمپین‌ها</Link>
            </div>
            <div className="divide-y divide-navy/5">
                {campaigns.map((campaign) => <Link key={campaign.id} href={`/admin/eitaa/campaigns/${campaign.id}`} className="flex flex-col gap-2 p-4 transition-colors hover:bg-soft-gray/40 md:flex-row md:items-center md:justify-between">
                    <div><strong className="text-sm font-black text-navy">{campaign.name}</strong><p className="mt-0.5 text-xs text-navy/45">{campaign.bot || '—'}</p></div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-navy/50">
                        <span className="rounded-md bg-soft-gray px-2 py-1 text-[0.62rem] font-black text-navy/60">{statusLabels[campaign.status] ?? campaign.status}</span>
                        <span>{campaign.sent_count}/{campaign.total_targets} ارسال</span>
                        {campaign.failed_count > 0 && <span className="text-red-600">{campaign.failed_count} ناموفق</span>}
                    </div>
                </Link>)}
                {campaigns.length === 0 && <div className="p-10 text-center text-xs font-bold text-navy/45">هنوز کمپینی ساخته نشده است.</div>}
            </div>
        </section>

        <section className="flex flex-wrap gap-3">
            <Link href="/admin/eitaa/settings" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-navy shadow-soft ring-1 ring-navy/5"><Settings className="size-4 text-brand-600" /> تنظیمات ماژول</Link>
            <Link href="/admin/eitaa/ai" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-navy shadow-soft ring-1 ring-navy/5"><Sparkles className="size-4 text-brand-600" /> پیش‌نویس با هوش مصنوعی</Link>
            <Link href="/admin/eitaa/notifications" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-navy shadow-soft ring-1 ring-navy/5"><ListChecks className="size-4 text-brand-600" /> اعلان‌ها</Link>
        </section>
    </div>;
}

EitaaDashboard.layout = (page: ReactNode) => <AdminLayout title="ربات ایتا">{page}</AdminLayout>;
