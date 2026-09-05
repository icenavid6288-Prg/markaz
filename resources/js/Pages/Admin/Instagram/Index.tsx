import { Link, router, usePage } from '@inertiajs/react';
import { CheckCircle2, MessageCircle, Settings, UserRound, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import InstagramGuide from '@/Components/Admin/InstagramGuide';
import type { PageProps } from '@/types';

interface Conversation {
    id: number;
    channel: 'dm' | 'comment';
    participant_id: string;
    participant_username?: string | null;
    status: string;
    last_message_at?: string | null;
    lead?: { id: number; name: string; phone: string; status: string } | null;
    latest_message?: { body?: string | null; direction: string; message_type: string } | null;
}
interface Paginator { data: Conversation[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }
interface Filters { channel?: string; status?: string; search?: string; }

export default function InstagramIndex() {
    const { conversations, stats, filters } = usePage<PageProps & { conversations: Paginator; filters: Filters; stats: { total: number; open: number; unread: number; messages: number; configured: boolean } }>().props;
    const applyFilter = (key: keyof Filters, value: string) => {
        const next = { ...filters, [key]: value || undefined };
        router.get('/admin/instagram', next, { preserveState: true, preserveScroll: true });
    };

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div><div className="flex items-center gap-2 text-xs font-black text-brand-200"><MessageCircle className="size-4" /> اینستاگرام و CRM</div><h1 className="mt-3 text-2xl font-black md:text-3xl">صندوق گفتگوهای اینستاگرام</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">دایرکت‌ها و کامنت‌ها را کنار لیدهای CRM ببینید و با اتصال رسمی Meta پاسخ دهید.</p></div>
                <div className="flex flex-wrap gap-2"><Link href="/admin/instagram/analytics" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20">تحلیل</Link><Link href="/admin/instagram/templates" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20">قالب‌ها</Link><Link href="/admin/instagram/automations" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/20">اتوماسیون</Link><Link href="/admin/settings/instagram" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-deep-green hover:bg-brand-100"><Settings className="size-4" /> تنظیم اتصال</Link></div>
            </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[['گفتگوها', stats.total], ['باز', stats.open], ['خوانده‌نشده', stats.unread], ['پیام‌ها', stats.messages], ['وضعیت اتصال', stats.configured ? 'متصل' : 'ناقص']].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"><div className="text-xl font-black text-navy">{value}</div><div className="mt-1 text-xs font-bold text-navy/45">{label}</div></div>)}
        </section>

        {!stats.configured && <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><XCircle className="mt-0.5 size-5 shrink-0" /><div><strong className="text-sm font-black">اتصال هنوز فعال نشده است.</strong><p className="mt-1 text-xs leading-6 text-amber-900/70">برای دریافت وب‌هوک و ارسال پاسخ، حساب Professional، شناسه Business، توکن Meta، App Secret و Verify Token را در تنظیمات وارد کنید.</p></div></section>}

        <InstagramGuide
            title="این صفحه چطور کار می‌کند؟"
            steps={[
                { title: 'پیام‌ها اینجا جمع می‌شوند', text: 'هر دایرکت یا کامنت جدید اینستاگرام از طریق Webhook متا وارد همین صندوق می‌شود؛ بدون نیاز به بررسی دستی اپلیکیشن اینستاگرام.' },
                { title: 'هر مخاطب یک لید می‌شود', text: 'بار اول که کسی پیام می‌دهد، به‌صورت خودکار یک لید با منبع «اینستاگرام» در CRM ساخته می‌شود و گفتگو به آن وصل است.' },
                { title: 'با فیلترها سریع برسید', text: 'از کادر جستجو و منوی کانال (دایرکت/کامنت) و وضعیت (باز/بسته) استفاده کنید؛ نتایج بلافاصله فیلتر می‌شوند.' },
                { title: 'برای پاسخ، گفتگو را باز کنید', text: 'با کلیک روی هر ردیف، تاریخچه کامل پیام‌ها و فرم پاسخ باز می‌شود؛ پاسخ مستقیم از پنل به اینستاگرام ارسال می‌گردد.' },
                { title: 'کارهای تکراری را اتومات کنید', text: 'در صفحه «اتوماسیون» قانون پاسخ خودکار بسازید و در «قالب‌ها» متن‌های آماده ذخیره کنید.' },
            ]}
            hints={[
                'عداد «خوانده‌نشده» تعداد گفتگوهایی است که پیام جدیدی از آخرین بازدید شما دارند.',
                'اگر اتصال ناقص است، پاسخ‌ها ارسال نمی‌شوند اما دریافت پیام‌ها و ثبت لید همچنان کار می‌کند.',
            ]}
        />

        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="border-b border-navy/5 px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-black text-navy">گفتگوهای اخیر</h2><p className="mt-1 text-xs text-navy/40">هر پیام ورودی به‌صورت خودکار به یک لید با منبع اینستاگرام متصل می‌شود.</p></div><div className="flex flex-wrap gap-2"><input defaultValue={filters.search ?? ''} onKeyDown={(event) => { if (event.key === 'Enter') applyFilter('search', event.currentTarget.value); }} placeholder="جستجوی کاربر یا لید" className="w-44 rounded-lg border border-navy/10 px-3 py-2 text-xs outline-none focus:border-brand-500" /><select value={filters.channel ?? ''} onChange={(event) => applyFilter('channel', event.target.value)} className="rounded-lg border border-navy/10 px-3 py-2 text-xs outline-none"><option value="">همه کانال‌ها</option><option value="dm">دایرکت</option><option value="comment">کامنت</option></select><select value={filters.status ?? ''} onChange={(event) => applyFilter('status', event.target.value)} className="rounded-lg border border-navy/10 px-3 py-2 text-xs outline-none"><option value="">همه وضعیت‌ها</option><option value="open">باز</option><option value="closed">بسته</option></select></div></div></div>
            <div className="divide-y divide-navy/5">
                {conversations.data.map((conversation) => <Link key={conversation.id} href={`/admin/instagram/${conversation.id}`} className="flex flex-col gap-3 p-5 transition-colors hover:bg-soft-gray/40 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600"><MessageCircle className="size-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm font-black text-navy">{conversation.participant_username ? `@${conversation.participant_username}` : conversation.participant_id}</strong><span className="rounded-md bg-soft-gray px-2 py-1 text-[0.62rem] font-black text-navy/50">{conversation.channel === 'comment' ? 'کامنت' : 'دایرکت'}</span></div><p className="mt-1 truncate text-xs text-navy/55">{conversation.latest_message?.body || 'پیامی ثبت نشده است'}</p></div></div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-navy/45"><span>{conversation.last_message_at || 'تازه'}</span>{conversation.lead && <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-brand-700"><UserRound className="size-3.5" /> {conversation.lead.name}</span>}<CheckCircle2 className="size-4 text-brand-500" /></div>
                </Link>)}
                {conversations.data.length === 0 && <div className="p-16 text-center"><MessageCircle className="mx-auto size-8 text-pink-400" /><p className="mt-3 text-sm font-bold text-navy/50">هنوز پیامی از اینستاگرام دریافت نشده است.</p></div>}
            </div>
            {conversations.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">{conversations.links.map((link, index) => <a key={index} href={link.url || '#'} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
    </div>;
}

InstagramIndex.layout = (page: ReactNode) => <AdminLayout title="اینستاگرام و CRM">{page}</AdminLayout>;
