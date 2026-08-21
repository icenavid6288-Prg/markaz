import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Activity, BarChart3, ChevronLeft, Clock3, FileSpreadsheet, Mail, Pause, Play, Plus, Send, Smartphone, Trash2, Users, Zap, Upload, type LucideIcon } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface Campaign {
    id: number;
    name: string;
    channel: 'sms' | 'email' | 'in_app';
    trigger: string;
    audience: string;
    subject?: string | null;
    message: string;
    status: 'draft' | 'active' | 'paused' | 'running';
    scheduled_at?: string | null;
    last_run_at?: string | null;
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    last_run?: { status: string; recipients_count: number; sent_count: number; failed_count: number; completed_at?: string | null } | null;
    imported_count?: number;
}
interface Paginator { data: Campaign[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }

const channelLabels: Record<string, string> = { sms: 'پیامک', email: 'ایمیل', in_app: 'داخل پنل' };
const triggerLabels: Record<string, string> = { manual: 'اجرای دستی', lead_created: 'ثبت لید جدید', course_purchased: 'خرید دوره', inactive_user: 'کاربر غیرفعال' };
const audienceLabels: Record<string, string> = { all_users: 'همه کاربران', leads: 'لیدها', students: 'دانش‌آموزان', parents: 'والدین', customers: 'مشتریان', inactive_users: 'کاربران غیرفعال' };
const statusLabels: Record<string, string> = { draft: 'پیش‌نویس', active: 'فعال', paused: 'متوقف', running: 'در حال اجرا' };
const channelIcons = { sms: Smartphone, email: Mail, in_app: Activity };

export default function MarketingIndex() {
    const { campaigns, stats, audienceCounts, options } = usePage<PageProps & {
        campaigns: Paginator;
        stats: { total: number; active: number; running: number; sent: number; runs: number };
        audienceCounts: Record<string, number>;
        options: { channels: Record<string, string>; triggers: Record<string, string>; audiences: Record<string, string>; statuses: Record<string, string> };
    }>().props;

    const runCampaign = (campaign: Campaign) => {
        if (confirm(`اجرای کمپین «${campaign.name}» در صف قرار بگیرد؟`)) router.post(`/admin/marketing/${campaign.id}/run`);
    };
    const toggleCampaign = (campaign: Campaign) => router.post(`/admin/marketing/${campaign.id}/toggle`);
    const deleteCampaign = (campaign: Campaign) => {
        if (confirm(`کمپین «${campaign.name}» حذف شود؟`)) router.delete(`/admin/marketing/${campaign.id}`);
    };

    const audienceCards = Object.entries(options.audiences).map(([key, label]) => ({ key, label, count: audienceCounts[key] ?? 0 }));
    const summaryCards: Array<{ label: string; value: number; icon: LucideIcon }> = [
        { label: 'کل کمپین‌ها', value: stats.total, icon: Zap },
        { label: 'کمپین‌های فعال', value: stats.active, icon: Play },
        { label: 'در حال اجرا', value: stats.running, icon: Activity },
        { label: 'پیام ارسال‌شده', value: stats.sent, icon: Send },
        { label: 'اجراهای موفق', value: stats.runs, icon: BarChart3 },
    ];

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-20 size-72 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-xs font-black text-brand-200"><Zap className="size-4" /> رشد خودکار و ارتباط هوشمند</div>
                    <h1 className="mt-3 text-2xl font-black md:text-3xl">اتومارکتینگ مجموعه</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">کمپین‌های پیامکی، ایمیلی و اعلان‌های داخل پنل را بر اساس مخاطب و رویداد واقعی مدیریت کنید.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/marketing/bulk-sms" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/20"><Upload className="size-4" /> ارسال پیامک انبوه</Link>
                    <Link href="/admin/marketing/create" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-deep-green shadow-soft hover:bg-brand-100"><Plus className="size-4" /> کمپین جدید</Link>
                </div>
            </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-navy/5"><span className="panel-inline-icon text-brand-600"><Icon className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{formatNumber(value)}</strong><span className="text-xs font-bold text-navy/45">{label}</span></div></div>)}
        </section>

        <section className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
            <div className="flex items-start gap-3"><span className="panel-inline-icon text-brand-700"><Zap className="size-5" /></span><div><h2 className="text-sm font-black text-brand-900">چطور از اتومارکتینگ استفاده کنم؟</h2><p className="mt-1 text-xs leading-7 text-brand-900/65">یک کمپین بسازید، کانال و مخاطب را انتخاب کنید، پیام را با متغیرهایی مثل <code className="rounded bg-white/70 px-1.5 py-0.5">{'{name}'}</code> شخصی‌سازی کنید و بعد آن را فعال یا اجرا کنید. برای لیست اختصاصی، فایل CSV یا XLSX شامل ستون‌های <strong>موبایل</strong>، <strong>نام</strong> و <strong>ایمیل</strong> وارد کنید؛ مخاطبان اعتبارسنجی می‌شوند و در صورت انتخاب شما کمپین بلافاصله وارد صف ارسال می‌شود.</p></div></div>
        </section>

        <section>
            <div className="mb-3 flex items-center justify-between"><div><span className="dashboard-eyebrow"><span /> مخاطبان قابل هدف‌گیری</span><h2 className="mt-2 text-xl font-black text-navy">انتخاب دقیق‌تر، پیام مرتبط‌تر</h2></div></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {audienceCards.map((item) => <div key={item.key} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-black text-navy"><Users className="size-4 text-brand-600" /> {item.label}</span><strong className="text-lg font-black text-brand-700">{formatNumber(item.count)}</strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-100"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, Math.max(4, item.count / Math.max(1, audienceCounts.all_users) * 100))}%` }} /></div></div>)}
            </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/5 px-5 py-4"><div><div className="text-sm font-black text-navy">فهرست کمپین‌ها</div><div className="mt-1 text-xs text-navy/40">{formatNumber(campaigns.total)} کمپین ثبت شده</div></div><Link href="/admin/marketing/create" className="inline-flex items-center gap-2 rounded-xl bg-deep-green px-4 py-2.5 text-xs font-black text-white hover:bg-brand-700"><Plus className="size-3.5" /> ساخت کمپین</Link></div>
            <div className="flex flex-col divide-y divide-navy/5">
                {campaigns.data.map((campaign) => { const ChannelIcon = channelIcons[campaign.channel]; return <article key={campaign.id} className="flex flex-col gap-4 p-5 transition-colors hover:bg-soft-gray/40 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3"><span className="panel-inline-icon shrink-0 text-brand-600"><ChannelIcon className="size-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-black text-navy">{campaign.name}</h3><span className={`rounded-lg px-2 py-1 text-[0.65rem] font-black ${campaign.status === 'active' ? 'bg-emerald-50 text-emerald-700' : campaign.status === 'running' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{statusLabels[campaign.status]}</span></div><p className="mt-1 text-xs text-navy/45">{channelLabels[campaign.channel]} · {triggerLabels[campaign.trigger]} · {audienceLabels[campaign.audience]}</p><p className="mt-2 line-clamp-1 text-xs text-navy/55">{campaign.message}</p></div></div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-navy/50"><span className="flex items-center gap-1"><Users className="size-3.5" /> {formatNumber(campaign.total_recipients)} مخاطب</span><span className="flex items-center gap-1 text-brand-700"><Send className="size-3.5" /> {formatNumber(campaign.sent_count)} ارسال</span>{campaign.last_run_at && <span className="flex items-center gap-1"><Clock3 className="size-3.5" /> اجرا شده</span>}</div>
                    <div className="border-t border-navy/5 pt-3 lg:border-t-0 lg:pt-0"><ImportRecipients campaign={campaign} /></div><div className="flex items-center gap-1.5"><button type="button" onClick={() => runCampaign(campaign)} disabled={campaign.status === 'running'} className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-40" title="اجرای کمپین"><Send className="size-3.5" /></button><button type="button" onClick={() => toggleCampaign(campaign)} disabled={campaign.status === 'running'} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40" title={campaign.status === 'active' ? 'توقف کمپین' : 'فعال‌سازی'}>{campaign.status === 'active' ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}</button><Link href={`/admin/marketing/${campaign.id}/edit`} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-50 hover:text-brand-700" title="ویرایش"><ChevronLeft className="size-3.5" /></Link><button type="button" onClick={() => deleteCampaign(campaign)} disabled={campaign.status === 'running'} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-red-50 hover:text-red-600 disabled:opacity-40" title="حذف"><Trash2 className="size-3.5" /></button></div>
                </article>; })}
                {campaigns.data.length === 0 && <div className="px-5 py-16 text-center"><Zap className="mx-auto size-8 text-brand-500" /><p className="mt-3 text-sm font-bold text-navy/50">هنوز کمپینی نساخته‌اید.</p><Link href="/admin/marketing/create" className="mt-3 inline-flex text-xs font-black text-brand-700">ساخت اولین کمپین ←</Link></div>}
            </div>
            {campaigns.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">{campaigns.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
    </div>;
}

function ImportRecipients({ campaign }: { campaign: Campaign }) {
    const form = useForm<{ file: File | null; replace: boolean; start_campaign: boolean }>({ file: null, replace: true, start_campaign: true });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!form.data.file) return;
        form.post(`/admin/marketing/${campaign.id}/import`, { forceFormData: true, preserveScroll: true, onSuccess: () => form.reset('file') });
    };

    return <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-2 text-[0.68rem] font-black text-brand-700 hover:bg-brand-100">
            <FileSpreadsheet className="size-3.5" /> انتخاب Excel/CSV
            <input type="file" accept=".xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)} />
        </label>
        <label className="flex items-center gap-1 text-[0.62rem] font-bold text-navy/55"><input type="checkbox" checked={form.data.replace} onChange={(event) => form.setData('replace', event.target.checked)} className="rounded border-navy/20 text-brand-600 focus:ring-brand-500" /> جایگزینی لیست قبلی</label>
        <label className="flex items-center gap-1 text-[0.62rem] font-bold text-navy/55"><input type="checkbox" checked={form.data.start_campaign} onChange={(event) => form.setData('start_campaign', event.target.checked)} className="rounded border-navy/20 text-brand-600 focus:ring-brand-500" /> شروع فوری کمپین</label>
        <button type="submit" disabled={!form.data.file || form.processing} className="rounded-lg bg-deep-green px-2.5 py-2 text-[0.68rem] font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{form.processing ? 'در حال ورود...' : 'ورود و اجرا'}</button>
        <span className="text-[0.62rem] font-bold text-navy/45">{campaign.imported_count ?? 0} مخاطب در صف</span>
        {form.errors.file && <span className="basis-full text-[0.62rem] font-bold text-red-600">{form.errors.file}</span>}
    </form>;
}

MarketingIndex.layout = (page: ReactNode) => <AdminLayout title="اتومارکتینگ">{page}</AdminLayout>;
