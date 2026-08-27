import { Link, usePage } from '@inertiajs/react';
import {
    Activity, ArrowLeft, ArrowUpLeft, BarChart3, Bell, BellRing, CalendarClock, Clock, Filter, Megaphone,
    MessageSquareQuote, PhoneCall, RefreshCw, ShoppingBag, StickyNote, Target, TrendingUp, UserPlus, Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface Stats { total: number; new_this_week: number; customers: number; registered: number; linked: number; conversion_rate: number; registration_rate: number; to_customer_rate: number; }
interface FunnelStage { key: string; count: number; percent_of_total: number; conversion_from_previous: number | null; }
interface CampaignRun { status: string; recipients_count: number; sent_count: number; failed_count: number; started_at: string | null; completed_at: string | null; }
interface Campaign { id: number; name: string; channel: string; trigger: string; status: string; scheduled_at: string | null; total_recipients: number; sent_count: number; failed_count: number; latest_run: CampaignRun | null; }
interface ActivityItem { id: number; type: string; description: string; created_at: string; lead: { id: number; name: string; phone: string; status: string } | null; }
interface AttentionLead { id: number; name: string; phone: string; need?: string | null; status: string; last_activity_at: string; note?: string | null; }
interface Attention { stale: AttentionLead[]; follow_up: AttentionLead[]; consultation: AttentionLead[]; }
interface TrendDay { label: string; new: number; customers: number; }

const statusMeta: Record<string, { label: string; cls: string }> = {
    new: { label: 'جدید', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
    contacted: { label: 'تماس گرفته‌شده', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
    interested: { label: 'علاقه‌مند', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    consultation: { label: 'مشاوره', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    registered: { label: 'ثبت‌نام‌کرده', cls: 'bg-brand-100 text-brand-800 ring-brand-200' },
    customer: { label: 'مشتری', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

const stageColors: Record<string, { bar: string; text: string }> = {
    new: { bar: 'bg-sky-400', text: 'text-sky-600' },
    contacted: { bar: 'bg-violet-400', text: 'text-violet-600' },
    interested: { bar: 'bg-amber-400', text: 'text-amber-600' },
    consultation: { bar: 'bg-blue-400', text: 'text-blue-600' },
    registered: { bar: 'bg-brand-500', text: 'text-brand-600' },
    customer: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
};

const channelMeta: Record<string, string> = { sms: 'پیامک', email: 'ایمیل', in_app: 'اعلان پنل' };
const triggerMeta: Record<string, string> = { manual: 'اجرای دستی', lead_created: 'ثبت لید جدید', course_purchased: 'خرید دوره', inactive_user: 'کاربر غیرفعال' };
const runStatusMeta: Record<string, { label: string; cls: string }> = {
    queued: { label: 'در صف اجرا', cls: 'bg-blue-50 text-blue-700' },
    running: { label: 'در حال اجرا', cls: 'bg-amber-50 text-amber-700' },
    completed: { label: 'آخرین اجرا موفق', cls: 'bg-emerald-50 text-emerald-700' },
    failed: { label: 'آخرین اجرا ناموفق', cls: 'bg-red-50 text-red-700' },
};

const activityMeta: Record<string, { icon: typeof StickyNote; cls: string; label: string }> = {
    note: { icon: StickyNote, cls: 'bg-soft-gray text-navy/60', label: 'یادداشت' },
    call: { icon: PhoneCall, cls: 'bg-violet-50 text-violet-600', label: 'تماس' },
    follow_up: { icon: Bell, cls: 'bg-amber-50 text-amber-600', label: 'پیگیری' },
    status_change: { icon: RefreshCw, cls: 'bg-blue-50 text-blue-600', label: 'تغییر مرحله' },
    registration: { icon: UserPlus, cls: 'bg-brand-100 text-brand-700', label: 'ثبت‌نام' },
    purchase: { icon: ShoppingBag, cls: 'bg-emerald-50 text-emerald-600', label: 'خرید' },
    reminder: { icon: Bell, cls: 'bg-amber-50 text-amber-600', label: 'یادآوری' },
};

export default function CrmDashboard() {
    const { stats, funnel, campaigns, attention, trend, trend_totals, activities } = usePage<PageProps & { stats: Stats; funnel: FunnelStage[]; campaigns: Campaign[]; attention: Attention; trend: TrendDay[]; trend_totals: { new: number; customers: number }; activities: ActivityItem[] }>().props;

    const kpis = [
        { label: 'کل سرنخ‌ها', value: stats.total, sub: `${stats.linked} متصل به حساب`, cls: 'text-navy', icon: Users },
        { label: 'جدید این هفته', value: stats.new_this_week, sub: 'در انتظار اولین تماس', cls: 'text-sky-600', icon: Filter },
        { label: 'مشتری', value: stats.customers, sub: 'خرید موفق داشته‌اند', cls: 'text-emerald-600', icon: ShoppingBag },
        { label: 'نرخ تبدیل', value: `${stats.conversion_rate}٪`, sub: `${stats.registered} ثبت‌نام‌کرده`, cls: 'text-brand-600', icon: TrendingUp },
    ];

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-20 size-72 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-black text-brand-200"><Target className="size-4" /> داشبورد اختصاصی CRM</div>
                    <h1 className="mt-3 text-2xl font-black md:text-3xl">از اولین بازدید تا خرید، همه‌چیز یکجا.</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">قیف سرنخ‌ها، نرخ تبدیل هر مرحله، کمپین‌های در حال اجرا و آخرین فعالیت‌های تیم فروش — همه به‌صورت خودکار از دیتابیس.</p>
                </div>
                <Link href="/admin/leads" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-deep-green shadow-soft hover:bg-brand-100"><Users className="size-4" /> مدیریت سرنخ‌ها</Link>
            </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpis.map((card) => {
                const Icon = card.icon;
                return <div key={card.label} className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl">
                    <div className="flex items-center justify-between"><span className={`flex size-9 items-center justify-center rounded-xl bg-soft-gray ${card.cls}`}><Icon className="size-4" aria-hidden /></span></div>
                    <div className={`mt-3 text-2xl font-black ${card.cls}`}>{card.value}</div>
                    <div className="mt-1 text-[0.68rem] font-black text-navy/45">{card.label}</div>
                    <div className="mt-0.5 text-[0.62rem] font-bold text-navy/35">{card.sub}</div>
                </div>;
            })}
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between">
                <div><h2 className="flex items-center gap-2 text-sm font-black text-navy"><BellRing className="size-4 text-amber-500" /> سرنخ‌های نیازمند توجه</h2><p className="mt-1 text-[0.68rem] text-navy/45">لیدهایی که همین امروز باید پیگیری شوند</p></div>
                <Link href="/admin/leads" className="inline-flex items-center gap-1 text-[0.68rem] font-black text-brand-700 hover:text-brand-800"><ArrowLeft className="size-3.5" /> همه سرنخ‌ها</Link>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <AttentionCard
                    title="بی‌پاسخ بیش از ۳ روز"
                    description="آخرین فعالیتشان قدیمی است"
                    icon={Clock}
                    tone="amber"
                    leads={attention.stale}
                />
                <AttentionCard
                    title="پیگیری باز مانده"
                    description="یادداشت پیگیری هنوز بسته نشده"
                    icon={BellRing}
                    tone="blue"
                    leads={attention.follow_up}
                    showNote
                />
                <AttentionCard
                    title="در مرحله مشاوره"
                    description="آماده تبدیل به ثبت‌نام"
                    icon={PhoneCall}
                    tone="violet"
                    leads={attention.consultation}
                />
            </div>
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-soft backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div><h2 className="flex items-center gap-2 text-sm font-black text-navy"><BarChart3 className="size-4 text-brand-600" /> روند ۳۰ روز اخیر</h2><p className="mt-1 text-[0.68rem] text-navy/45">لیدهای جدید هر روز و مشتریانی که در همان روز تبدیل شدند</p></div>
                <div className="flex items-center gap-3 text-[0.65rem] font-black text-navy/55">
                    <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand-500" /> لید جدید: {trend_totals.new}</span>
                    <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500" /> مشتری: {trend_totals.customers}</span>
                </div>
            </div>
            <div className="crm-trend-chart mt-5 h-64 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
                        <Tooltip cursor={{ fill: 'rgba(44,154,108,0.08)' }} content={<TrendTooltip />} />
                        <Bar dataKey="new" name="لید جدید" fill="#2c9a6c" radius={[3, 3, 0, 0]} maxBarSize={10} />
                        <Bar dataKey="customers" name="مشتری" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={10} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-5">
            <section className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-soft backdrop-blur-xl xl:col-span-3">
                <div className="flex items-center justify-between">
                    <div><h2 className="text-sm font-black text-navy">قیف سرنخ‌ها</h2><p className="mt-1 text-[0.68rem] text-navy/45">تعداد سرنخ‌ها در هر مرحله و نرخ عبور به مرحله بعد</p></div>
                    <span className="rounded-lg bg-soft-gray px-2.5 py-1 text-[0.62rem] font-black text-navy/50">نرخ تبدیل کل: {stats.conversion_rate}٪</span>
                </div>
                <div className="mt-6 space-y-3">
                    {funnel.map((stage, index) => {
                        const color = stageColors[stage.key] ?? stageColors.new;
                        const meta = statusMeta[stage.key] ?? statusMeta.new;
                        const width = stage.count > 0 ? Math.max(8, stage.percent_of_total) : 0;
                        return <div key={stage.key}>
                            {index > 0 && <div className="mb-3 flex items-center justify-center gap-2 text-[0.62rem] font-black text-navy/40"><ArrowUpLeft className="size-3 rotate-90 text-brand-500" aria-hidden />{stage.conversion_from_previous !== null ? `${stage.conversion_from_previous}٪ عبور از مرحله قبل` : 'بدون داده'}</div>}
                            <div className="flex items-center gap-3">
                                <span className={`w-28 shrink-0 rounded-lg px-2 py-1 text-center text-[0.65rem] font-black ring-1 ${meta.cls}`}>{meta.label}</span>
                                <div className="h-7 flex-1 overflow-hidden rounded-lg bg-soft-gray/60">
                                    <div className={`flex h-full items-center rounded-lg px-3 ${color.bar} ${stage.count > 0 ? 'text-white' : ''}`} style={{ width: `${width}%` }}><span className="truncate text-[0.68rem] font-black">{stage.count}</span></div>
                                </div>
                                <span className={`w-16 shrink-0 text-left text-[0.68rem] font-black ${color.text}`}>{stage.percent_of_total}٪</span>
                            </div>
                        </div>;
                    })}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 sm:grid-cols-3">
                    <div><div className="text-[0.62rem] font-black text-brand-900/55">نرخ ثبت‌نام (از کل لیدها)</div><div className="mt-1 text-lg font-black text-brand-700">{stats.registration_rate}٪</div></div>
                    <div><div className="text-[0.62rem] font-black text-brand-900/55">تبدیل ثبت‌نام‌شده به مشتری</div><div className="mt-1 text-lg font-black text-emerald-600">{stats.to_customer_rate}٪</div></div>
                    <div className="col-span-2 sm:col-span-1"><div className="text-[0.62rem] font-black text-brand-900/55">مشتریان فعلی</div><div className="mt-1 text-lg font-black text-navy">{stats.customers}</div></div>
                </div>
            </section>

            <section className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-soft backdrop-blur-xl xl:col-span-2">
                <div className="flex items-center justify-between">
                    <div><h2 className="text-sm font-black text-navy">کمپین‌های در حال اجرا</h2><p className="mt-1 text-[0.68rem] text-navy/45">کمپین‌های فعال و در صف ارسال</p></div>
                    <Link href="/admin/marketing" className="inline-flex items-center gap-1 text-[0.68rem] font-black text-brand-700 hover:text-brand-800"><Megaphone className="size-3.5" /> اتومارکتینگ</Link>
                </div>
                {campaigns.length > 0 ? <div className="mt-5 space-y-4">
                    {campaigns.map((campaign) => {
                        const total = campaign.total_recipients;
                        const progress = total > 0 ? Math.min(100, Math.round(campaign.sent_count / total * 100)) : 0;
                        return <div key={campaign.id} className="rounded-xl border border-navy/5 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="truncate text-xs font-black text-navy">{campaign.name}</h3>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[0.6rem] font-bold">
                                        <span className="rounded-md bg-soft-gray px-1.5 py-0.5 text-navy/55">{channelMeta[campaign.channel] ?? campaign.channel}</span>
                                        <span className="rounded-md bg-soft-gray px-1.5 py-0.5 text-navy/55">{triggerMeta[campaign.trigger] ?? campaign.trigger}</span>
                                        {campaign.status === 'running' ? <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700">کمپین در حال اجرا</span> : <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700">کمپین فعال</span>}
                                        {campaign.latest_run && <span className={`rounded-md px-1.5 py-0.5 ${runStatusMeta[campaign.latest_run.status]?.cls ?? 'bg-soft-gray text-navy/55'}`}>{runStatusMeta[campaign.latest_run.status]?.label ?? campaign.latest_run.status}</span>}
                                        {campaign.scheduled_at && <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700"><CalendarClock className="size-3" /> {campaign.scheduled_at}</span>}
                                    </div>
                                </div>
                                <div className="shrink-0 text-left"><div className="text-xs font-black text-navy">{progress}٪</div><div className="text-[0.6rem] font-bold text-navy/35">{campaign.sent_count} از {total}</div></div>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft-gray"><div className="h-full rounded-full bg-gradient-to-l from-brand-500 to-emerald-500" style={{ width: `${progress}%` }} /></div>
                            {campaign.latest_run && <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.6rem] font-bold text-navy/40"><span>{campaign.latest_run.sent_count} ارسال از {campaign.latest_run.recipients_count} گیرنده در آخرین اجرا</span>{campaign.latest_run.failed_count > 0 && <span className="text-red-600">{campaign.latest_run.failed_count} ناموفق</span>}{campaign.latest_run.completed_at && <span>{campaign.latest_run.completed_at}</span>}</div>}
                        </div>;
                    })}
                </div> : <div className="mt-6 flex flex-col items-center gap-2 rounded-xl bg-soft-gray/50 py-10 text-center"><Megaphone className="size-6 text-navy/25" /><p className="text-[0.7rem] font-black text-navy/45">کمپین فعالی در جریان نیست</p><Link href="/admin/marketing/create" className="mt-1 text-[0.68rem] font-black text-brand-700 hover:text-brand-800">ساخت کمپین جدید</Link></div>}
            </section>
        </div>

        <section className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between">
                <div><h2 className="flex items-center gap-2 text-sm font-black text-navy"><Activity className="size-4 text-brand-600" /> آخرین فعالیت سرنخ‌ها</h2><p className="mt-1 text-[0.68rem] text-navy/45">تازه‌ترین رویدادهای فرم، ثبت‌نام، خرید و یادآوری در سراسر قیف</p></div>
                <Link href="/admin/leads" className="inline-flex items-center gap-1 text-[0.68rem] font-black text-brand-700 hover:text-brand-800"><ArrowLeft className="size-3.5" /> همه سرنخ‌ها</Link>
            </div>
            {activities.length > 0 ? <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activities.map((activity) => {
                    const meta = activityMeta[activity.type] ?? activityMeta.note;
                    const Icon = meta.icon;
                    const leadStatus = activity.lead ? (statusMeta[activity.lead.status] ?? statusMeta.new) : null;
                    return <li key={activity.id} className="flex items-start gap-3 rounded-xl border border-navy/5 bg-white p-3.5">
                        <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${meta.cls}`}><Icon className="size-4" aria-hidden /></span>
                        <div className="min-w-0 flex-1">
                            {activity.lead ? <div className="flex items-center justify-between gap-2">
                                <Link href={`/admin/content/leads/${activity.lead.id}/edit`} className="truncate text-xs font-black text-navy hover:text-brand-700">{activity.lead.name}</Link>
                                {leadStatus && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] font-black ring-1 ${leadStatus.cls}`}>{leadStatus.label}</span>}
                            </div> : <div className="text-xs font-black text-navy/60">سرنخ حذف‌شده</div>}
                            <p className="mt-1 text-[0.7rem] leading-5 text-navy/60">{activity.description}</p>
                            <div className="mt-1 flex items-center gap-1.5 text-[0.6rem] font-bold text-navy/35"><span>{meta.label}</span><span>•</span><span>{activity.created_at}</span>{activity.lead && <span dir="ltr">• {activity.lead.phone}</span>}</div>
                        </div>
                    </li>;
                })}
            </ol> : <div className="mt-6 flex flex-col items-center gap-2 rounded-xl bg-soft-gray/50 py-12 text-center"><MessageSquareQuote className="size-6 text-navy/25" /><p className="text-[0.7rem] font-black text-navy/45">هنوز فعالیتی ثبت نشده است — با اولین فرم تماس یا ثبت‌نام، اینجا پر می‌شود.</p></div>}
        </section>

        <section className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
            <div className="flex items-start gap-2 text-[0.7rem] leading-6 text-brand-900/70"><ArrowLeft className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden /><p>این داشبورد خودکار ساخته می‌شود: فرم تماس، ثبت‌نام، آنبوردینگ، خرید موفق و یادآوری‌های خودکار هرکدام لید می‌سازند و در همین قیف و تاریخچه دیده می‌شوند.</p></div>
        </section>
    </div>;
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
    if (!active || !payload || payload.length === 0) return null;
    const rows = payload.filter((item) => item.value !== undefined && item.value > 0);
    return <div className="rounded-xl border border-navy/10 bg-white px-3.5 py-2.5 shadow-soft">
        <div className="text-[0.62rem] font-black text-navy/45">{label}</div>
        <div className="mt-1.5 space-y-1">
            {rows.length > 0 ? rows.map((item) => <div key={item.name} className="flex items-center gap-2 text-[0.68rem] font-black text-navy">
                <span className="size-2 rounded-sm" style={{ background: item.color }} />
                <span className="text-navy/55">{item.name === 'new' ? 'لید جدید' : 'مشتری'}</span>
                <span dir="ltr">{item.value}</span>
            </div>) : <div className="text-[0.65rem] font-bold text-navy/40">بدون فعالیت در این روز</div>}
        </div>
    </div>;
}

function AttentionCard({ title, description, icon: Icon, tone, leads, showNote }: { title: string; description: string; icon: typeof Clock; tone: 'amber' | 'blue' | 'violet'; leads: AttentionLead[]; showNote?: boolean; }) {
    const tones = {
        amber: { icon: 'bg-amber-50 text-amber-600', badge: 'bg-amber-100 text-amber-700', empty: 'text-amber-400/40' },
        blue: { icon: 'bg-blue-50 text-blue-600', badge: 'bg-blue-100 text-blue-700', empty: 'text-blue-400/40' },
        violet: { icon: 'bg-violet-50 text-violet-600', badge: 'bg-violet-100 text-violet-700', empty: 'text-violet-400/40' },
    }[tone];

    return <div className="flex flex-col rounded-xl border border-navy/5 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5"><span className={`flex size-9 items-center justify-center rounded-xl ${tones.icon}`}><Icon className="size-4" aria-hidden /></span><div><h3 className="text-xs font-black text-navy">{title}</h3><p className="mt-0.5 text-[0.62rem] text-navy/40">{description}</p></div></div>
            {leads.length > 0 && <span className={`rounded-full px-2.5 py-1 text-[0.62rem] font-black ${tones.badge}`}>{leads.length}</span>}
        </div>
        <div className="mt-4 flex-1 space-y-2.5">
            {leads.length > 0 ? leads.map((lead) => {
                const leadStatus = statusMeta[lead.status] ?? statusMeta.new;
                return <div key={lead.id} className="rounded-lg border border-navy/5 bg-soft-gray/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                        <Link href={`/admin/content/leads/${lead.id}/edit`} className="truncate text-xs font-black text-navy hover:text-brand-700">{lead.name}</Link>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] font-black ring-1 ${leadStatus.cls}`}>{leadStatus.label}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[0.6rem] font-bold text-navy/40"><span dir="ltr">{lead.phone}</span><span>•</span><span>{lead.last_activity_at}</span></div>
                    {showNote && lead.note && <p className="mt-1.5 truncate text-[0.62rem] leading-4 text-navy/55" title={lead.note}>{lead.note}</p>}
                    {lead.need && <span className="mt-1.5 inline-block rounded-md bg-white px-1.5 py-0.5 text-[0.6rem] font-bold text-navy/50">{lead.need}</span>}
                </div>;
            }) : <div className="flex flex-col items-center gap-1.5 rounded-lg bg-soft-gray/40 py-8 text-center"><Icon className={`size-5 ${tones.empty}`} aria-hidden /><span className="text-[0.65rem] font-bold text-navy/40">فعلاً خالی است</span></div>}
        </div>
        <Link href={`/admin/leads`} className="mt-3 text-center text-[0.62rem] font-black text-brand-700 hover:text-brand-800">مشاهده در مدیریت سرنخ‌ها</Link>
    </div>;
}

CrmDashboard.layout = (page: ReactNode) => <AdminLayout title="داشبورد CRM">{page}</AdminLayout>;
