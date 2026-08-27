import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft, ArrowUpLeft, Bell, ClipboardList, Edit3, MessageSquareQuote, PhoneCall, RefreshCw, Search, ShoppingBag,
    StickyNote, Target, Trash2, UserRound, UserPlus, Zap,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface Activity { id: number; type: string; description: string; created_at: string; }
interface Lead {
    id: number; name: string; phone: string; email?: string | null; need?: string | null;
    child_age?: string | null; grade?: string | null; service_type?: string | null;
    source: string; status: string; created_at: string;
    lead_score: number;
    lead_score_breakdown: { source: number; onboarding: number; pricing: number; age: number };
    user: { id: number; name: string; phone: string } | null;
    activities: Activity[];
}
interface Paginator { data: Lead[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }
interface FunnelStage { key: string; label: string; hint: string; count: number; percent_of_first: number | null; conversion_from_previous: number | null; overall?: number | null; }

const statusMeta: Record<string, { label: string; cls: string }> = {
    new: { label: 'جدید', cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
    contacted: { label: 'تماس گرفته‌شده', cls: 'bg-violet-50 text-violet-700 ring-violet-200' },
    interested: { label: 'علاقه‌مند', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    consultation: { label: 'مشاوره', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    registered: { label: 'ثبت‌نام‌کرده', cls: 'bg-brand-100 text-brand-800 ring-brand-200' },
    customer: { label: 'مشتری', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

const sourceMeta: Record<string, string> = {
    website: 'وب‌سایت', registration: 'ثبت‌نام', instagram: 'اینستاگرام', eitaa: 'ایتا', referral: 'معرفی', other: 'سایر',
};

const activityMeta: Record<string, { icon: typeof StickyNote; cls: string; label: string }> = {
    note: { icon: StickyNote, cls: 'bg-soft-gray text-navy/60', label: 'یادداشت' },
    call: { icon: PhoneCall, cls: 'bg-violet-50 text-violet-600', label: 'تماس' },
    follow_up: { icon: Bell, cls: 'bg-amber-50 text-amber-600', label: 'پیگیری' },
    status_change: { icon: RefreshCw, cls: 'bg-blue-50 text-blue-600', label: 'تغییر مرحله' },
    registration: { icon: UserPlus, cls: 'bg-brand-100 text-brand-700', label: 'ثبت‌نام' },
    purchase: { icon: ShoppingBag, cls: 'bg-emerald-50 text-emerald-600', label: 'خرید' },
    survey: { icon: ClipboardList, cls: 'bg-teal-50 text-teal-600', label: 'فرم' },
};

const funnelTones: Record<string, { bar: string; text: string; chip: string }> = {
    visits: { bar: 'bg-sky-400', text: 'text-sky-600', chip: 'bg-sky-50 text-sky-700 ring-sky-200' },
    leads: { bar: 'bg-violet-400', text: 'text-violet-600', chip: 'bg-violet-50 text-violet-700 ring-violet-200' },
    registrations: { bar: 'bg-brand-500', text: 'text-brand-600', chip: 'bg-brand-100 text-brand-800 ring-brand-200' },
    purchases: { bar: 'bg-emerald-500', text: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};

const rangeOptions = [7, 30, 90];

const scoreTone = (score: number) => (score >= 70
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : score >= 45
        ? 'bg-brand-100 text-brand-800 ring-brand-200'
        : score >= 25
            ? 'bg-amber-50 text-amber-700 ring-amber-200'
            : 'bg-soft-gray text-navy/55 ring-navy/10');

export default function LeadsIndex() {
    const { leads, stats, filters, canUpdate, canDelete, conversionFunnel, funnelRange } = usePage<PageProps & {
        leads: Paginator; stats: Record<string, number>; filters: { search?: string; status?: string; sort?: string };
        canUpdate: boolean; canDelete: boolean;
        conversionFunnel: FunnelStage[]; funnelRange: number;
    }>().props;

    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'score');

    const apply = (next?: { search?: string; status?: string; sort?: string }) => router.get('/admin/leads', {
        search: next?.search ?? search,
        status: next?.status !== undefined ? next.status : (status || undefined),
        sort: next?.sort ?? sort,
    }, { preserveState: true, replace: true });
    const destroy = (lead: Lead) => {
        if (confirm(`آیا از حذف سرنخ «${lead.name}» مطمئن هستید؟`)) router.delete(`/admin/content/leads/${lead.id}`);
    };

    const statCards = [
        { label: 'کل سرنخ‌ها', value: stats.total, cls: 'text-navy' },
        { label: 'جدید', value: stats.new, cls: 'text-sky-600' },
        { label: 'ثبت‌نام‌کرده', value: stats.registered, cls: 'text-brand-600' },
        { label: 'مشتری', value: stats.customers, cls: 'text-emerald-600' },
        { label: 'متصل به حساب', value: stats.linked, cls: 'text-violet-600' },
    ];

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-black text-brand-200"><Target className="size-4" /> مدیریت سرنخ‌ها و CRM</div>
                    <h1 className="mt-3 text-2xl font-black md:text-3xl">هر سرنخ، یک مسیر کامل از فرم تا خرید.</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">فرم تماس، ثبت‌نام، آنبوردینگ و خرید به‌صورت خودکار لید می‌سازند، به حساب کاربری وصل می‌شوند و تاریخچه‌شان اینجا ثبت می‌شود.</p>
                </div>
                {canUpdate && <Link href="/admin/content/leads/create" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-deep-green shadow-soft hover:bg-brand-100"><UserPlus className="size-4" /> ثبت سرنخ دستی</Link>}
            </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {statCards.map((card) => <div key={card.label} className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl"><div className={`text-2xl font-black ${card.cls}`}>{card.value}</div><div className="mt-1 text-[0.68rem] font-black text-navy/45">{card.label}</div></div>)}
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-soft backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div><h2 className="flex items-center gap-2 text-sm font-black text-navy"><Target className="size-4 text-brand-600" /> قیف تبدیل کامل</h2><p className="mt-1 text-[0.68rem] text-navy/45">بازدید ← لید ← ثبت‌نام ← خرید، با نرخ عبور هر مرحله</p></div>
                <div className="flex items-center gap-1 rounded-xl bg-soft-gray p-1">
                    {rangeOptions.map((days) => <button key={days} type="button" onClick={() => router.get('/admin/leads', { range: days, sort }, { preserveState: true, replace: true })} className={`rounded-lg px-3.5 py-1.5 text-[0.68rem] font-black transition-colors ${funnelRange === days ? 'bg-deep-green text-white shadow-soft' : 'text-navy/50 hover:text-navy'}`}>{days} روز</button>)}
                </div>
            </div>
            <div className="mt-6 space-y-3">
                {conversionFunnel.map((stage, index) => {
                    const tone = funnelTones[stage.key] ?? funnelTones.visits;
                    const width = stage.count > 0 && stage.percent_of_first !== null ? Math.max(10, stage.percent_of_first) : 0;
                    return <div key={stage.key}>
                        {index > 0 && <div className="mb-3 flex items-center justify-center gap-2 text-[0.62rem] font-black text-navy/40"><ArrowUpLeft className="size-3 rotate-90 text-brand-500" aria-hidden />{stage.conversion_from_previous !== null ? `نرخ تبدیل: ${stage.conversion_from_previous}٪` : 'بدون داده'}</div>}
                        <div className="flex items-center gap-3">
                            <div className="w-40 shrink-0"><div className="flex items-center justify-between gap-2"><span className={`rounded-lg px-2 py-1 text-center text-[0.65rem] font-black ring-1 ${tone.chip}`}>{stage.label}</span><span className={`text-[0.68rem] font-black ${tone.text}`}>{stage.count}</span></div><div className="mt-1 text-[0.58rem] font-bold text-navy/35">{stage.hint}</div></div>
                            <div className="h-8 flex-1 overflow-hidden rounded-lg bg-soft-gray/60">
                                <div className={`flex h-full items-center rounded-lg px-3 ${tone.bar} ${stage.count > 0 ? 'text-white' : ''}`} style={{ width: `${width}%` }}><span className="truncate text-[0.68rem] font-black">{stage.count}</span></div>
                            </div>
                            <span className="w-14 shrink-0 text-left text-[0.66rem] font-bold text-navy/45">{stage.percent_of_first !== null ? `${stage.percent_of_first}٪ از بازدید` : '—'}</span>
                        </div>
                    </div>;
                })}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
                <span className="text-[0.68rem] font-black text-brand-900/70">تبدیل کل بازدید به خرید</span>
                <span className="text-base font-black text-brand-700">{conversionFunnel[0]?.overall !== null && conversionFunnel[0]?.overall !== undefined ? `${conversionFunnel[0].overall}٪` : '—'}</span>
            </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl sm:flex-row">
            <div className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="جستجو بر اساس نام، موبایل یا نیاز..." className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></div>
            <select value={status} onChange={(e) => { setStatus(e.target.value); router.get('/admin/leads', { search, status: e.target.value || undefined }, { preserveState: true, replace: true }); }} className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm font-bold text-navy outline-none focus:border-brand-500">
                <option value="">همه مراحل قیف</option>
                {Object.entries(statusMeta).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
            </select>
            <div className="flex items-center gap-1 rounded-xl bg-soft-gray p-1">
                {[['score', 'اولویت'], ['recent', 'جدیدترین']].map(([key, label]) => <button key={key} type="button" onClick={() => { setSort(key); apply({ sort: key }); }} className={`rounded-lg px-3.5 py-2 text-[0.68rem] font-black transition-colors ${sort === key ? 'bg-deep-green text-white shadow-soft' : 'text-navy/50 hover:text-navy'}`}>{label}</button>)}
            </div>
            <button type="button" onClick={() => apply()} className="rounded-xl bg-deep-green px-5 py-3 text-sm font-black text-white hover:bg-brand-700">اعمال فیلتر</button>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {leads.data.map((lead) => {
                const statusInfo = statusMeta[lead.status] ?? statusMeta.new;
                const LeadIcon = lead.user ? UserRound : Target;
                return <article key={lead.id} className="flex flex-col rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-md">
                    <div className="flex items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-black text-brand-700"><LeadIcon className="size-5" aria-hidden /></span>
                        <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-black text-navy">{lead.name}</h3>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.68rem] font-bold text-navy/45">
                                <span dir="ltr">{lead.phone}</span>
                                {lead.source && <span className="rounded-md bg-soft-gray px-1.5 py-0.5">{sourceMeta[lead.source] ?? lead.source}</span>}
                                <span>{lead.created_at}</span>
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.62rem] font-black ring-1 ${statusInfo.cls}`}>{statusInfo.label}</span>
                            <span title={`امتیاز اولویت: ${lead.lead_score} از ۱۰۰`} className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.62rem] font-black ring-1 ${scoreTone(lead.lead_score)}`}><Zap className="size-3" aria-hidden />{lead.lead_score} <span className="font-bold opacity-70">•</span> {lead.lead_score >= 70 ? 'داغ' : lead.lead_score >= 45 ? 'بالا' : lead.lead_score >= 25 ? 'متوسط' : 'کم'}</span>
                        </div>
                    </div>

                    <div className="mt-3">
                        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-soft-gray">
                            <span title={`منبع: ${lead.lead_score_breakdown.source} امتیاز`} className="h-full bg-sky-400" style={{ width: `${lead.lead_score_breakdown.source}%` }} />
                            <span title={`تکمیل آنبوردینگ: ${lead.lead_score_breakdown.onboarding} امتیاز`} className="h-full bg-brand-500" style={{ width: `${lead.lead_score_breakdown.onboarding}%` }} />
                            <span title={`بازدید صفحات قیمت: ${lead.lead_score_breakdown.pricing} امتیاز`} className="h-full bg-violet-500" style={{ width: `${lead.lead_score_breakdown.pricing}%` }} />
                            <span title={`تازگی لید: ${lead.lead_score_breakdown.age} امتیاز`} className="h-full bg-emerald-500" style={{ width: `${lead.lead_score_breakdown.age}%` }} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[0.58rem] font-bold text-navy/40">
                            <span>منبع {lead.lead_score_breakdown.source}</span>
                            <span>آنبوردینگ {lead.lead_score_breakdown.onboarding}</span>
                            <span>صفحات قیمت {lead.lead_score_breakdown.pricing}</span>
                            <span>تازگی {lead.lead_score_breakdown.age}</span>
                        </div>
                    </div>

                    {lead.user && <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/70 px-3 py-2">
                        <UserRound className="size-4 shrink-0 text-brand-600" aria-hidden />
                        <div className="min-w-0 flex-1 truncate text-xs font-black text-brand-800">متصل به حساب: {lead.user.name}</div>
                        <span className="text-[0.62rem] font-bold text-brand-700/60" dir="ltr">{lead.user.phone}</span>
                    </div>}

                    {(lead.need || lead.child_age || lead.grade || lead.service_type) && <div className="mt-4 flex flex-wrap gap-1.5 text-[0.65rem] font-bold text-navy/55">
                        {lead.need && <span className="rounded-lg bg-soft-gray px-2 py-1">نیاز: {lead.need}</span>}
                        {lead.child_age && <span className="rounded-lg bg-soft-gray px-2 py-1">سن: {lead.child_age}</span>}
                        {lead.grade && <span className="rounded-lg bg-soft-gray px-2 py-1">{lead.grade}</span>}
                        {lead.service_type && <span className="rounded-lg bg-soft-gray px-2 py-1">خدمت: {lead.service_type}</span>}
                    </div>}

                    <div className="mt-4 flex-1">
                        <div className="mb-2 flex items-center justify-between"><span className="text-[0.68rem] font-black text-navy/50">تاریخچه فعالیت‌ها</span>{lead.activities.length > 0 && <span className="text-[0.6rem] font-bold text-navy/35">{lead.activities.length} مورد</span>}</div>
                        {lead.activities.length > 0 ? <ol className="space-y-2.5">
                            {lead.activities.map((activity) => {
                                const meta = activityMeta[activity.type] ?? activityMeta.note;
                                const Icon = meta.icon;
                                return <li key={activity.id} className="flex items-start gap-2.5">
                                    <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg ${meta.cls}`}><Icon className="size-3" aria-hidden /></span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[0.7rem] leading-5 text-navy/65">{activity.description}</p>
                                        <span className="text-[0.6rem] font-bold text-navy/35">{meta.label} • {activity.created_at}</span>
                                    </div>
                                </li>;
                            })}
                        </ol> : <div className="flex flex-col items-center gap-1 rounded-xl bg-soft-gray/50 py-6 text-center">
                            <MessageSquareQuote className="size-5 text-navy/30" aria-hidden />
                            <span className="text-[0.68rem] font-bold text-navy/40">هنوز فعالیتی ثبت نشده است</span>
                        </div>}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-navy/5 pt-3">
                        {canUpdate ? <Link href={`/admin/content/leads/${lead.id}/edit`} className="inline-flex items-center gap-1.5 text-xs font-black text-brand-700 hover:text-brand-800"><Edit3 className="size-3.5" /> ویرایش و پیگیری</Link> : <span />}
                        {canDelete && <button type="button" onClick={() => destroy(lead)} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/50 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><Trash2 className="size-3.5" /></button>}
                    </div>
                </article>;
            })}
        </section>

        {leads.data.length === 0 && <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/80 bg-white/75 py-16 text-center shadow-soft"><Target className="size-8 text-navy/25" /><p className="text-sm font-black text-navy/50">سرنخی با این فیلتر پیدا نشد.</p></div>}

        {leads.links.length > 3 && <div className="flex items-center justify-center gap-1.5">{leads.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}

        <section className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
            <div className="flex items-start gap-2 text-[0.7rem] leading-6 text-brand-900/70"><ArrowLeft className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden /><p>این بخش خودکار پر می‌شود: فرم تماس صفحه اصلی، ثبت‌نام در سایت، تکمیل پروفایل مسیر و پرداخت موفق هرکدام لید می‌سازند و به حساب کاربر وصل می‌کنند؛ نیازی به ثبت دستی نیست مگر برای سرنخ‌های خارج از سایت (اینستاگرام، ایتا و...).</p></div>
        </section>
    </div>;
}

LeadsIndex.layout = (page: ReactNode) => <AdminLayout title="سرنخ‌ها و CRM">{page}</AdminLayout>;
