import { router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Copy, ExternalLink, MessageCircle, RefreshCw, Save, Send, ShieldCheck, Unplug, Wifi, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import InstagramGuide from '@/Components/Admin/InstagramGuide';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type StoredSetting = { key: string; value: string | null; configured?: boolean };
type Health = {
    configured: boolean;
    enabled: boolean;
    webhook_url: string;
    graph_version: string;
    account?: { id: string; username?: string | null; profile_picture_url?: string | null; status: string; token_expires_at?: string | null; scopes?: string[]; last_sync_at?: string | null; last_error?: string | null } | null;
};

type InstagramField = {
    key: string;
    label: string;
    type?: 'text' | 'textarea' | 'url' | 'select' | 'password';
    options?: Record<string, string>;
    defaultValue?: string;
    placeholder?: string;
    help?: string;
    secret?: boolean;
};

const fields: InstagramField[] = [
    { key: 'instagram_enabled', label: 'فعال‌سازی اتصال', type: 'select', options: { '1': 'فعال', '0': 'غیرفعال' }, defaultValue: '0' },
    { key: 'instagram_login_mode', label: 'روش اتصال', type: 'select', options: { instagram_login: 'Instagram Login (پیشنهادی)', facebook_login: 'Facebook Login for Business' }, defaultValue: 'instagram_login' },
    { key: 'instagram_app_id', label: 'Meta App ID', help: 'شناسه اپلیکیشن را از Meta for Developers وارد کنید.' },    { key: 'instagram_app_secret', label: 'Meta App Secret', secret: true, help: 'این مقدار در دیتابیس رمزنگاری می‌شود و در پاسخ صفحه نمایش داده نمی‌شود.' },

    { key: 'instagram_business_account_id', label: 'Instagram User / Business ID', help: 'بعد از اتصال OAuth خودکار ثبت می‌شود؛ در صورت اتصال دستی می‌توانید وارد کنید.' },
    { key: 'instagram_access_token', label: 'Access Token', secret: true, help: 'برای اتصال دستی توکن را وارد کنید؛ روش امن‌تر، استفاده از دکمه اتصال OAuth است.' },
    { key: 'instagram_api_version', label: 'نسخه Graph API', defaultValue: 'v25.0', placeholder: 'v25.0' },
    { key: 'instagram_webhook_url', label: 'آدرس Webhook', type: 'url', help: 'این آدرس باید روی دامنه عمومی HTTPS در Meta ثبت شود.' },
    { key: 'instagram_webhook_fields', label: 'فیلدهای Webhook', type: 'text', defaultValue: 'messages,comments,mentions', help: 'فهرست فیلدهای فعال Meta با کاما جدا شود.' },
    { key: 'instagram_webhook_verify_token', label: 'Webhook Verify Token', secret: true, help: 'یک مقدار دلخواه امن بسازید و عیناً در تنظیمات Webhook متا وارد کنید.' },
    { key: 'instagram_auto_reply_enabled', label: 'فعال‌سازی اتوپاسخ', type: 'select', options: { '1': 'فعال', '0': 'غیرفعال' }, defaultValue: '0' },
    { key: 'instagram_dm_auto_reply_enabled', label: 'اتوپاسخ دایرکت', type: 'select', options: { '1': 'فعال', '0': 'غیرفعال' }, defaultValue: '0' },
    { key: 'instagram_comment_auto_reply_enabled', label: 'اتوپاسخ کامنت', type: 'select', options: { '1': 'فعال', '0': 'غیرفعال' }, defaultValue: '0' },
    { key: 'instagram_private_reply_enabled', label: 'پاسخ خصوصی به کامنت', type: 'select', options: { '1': 'فعال', '0': 'غیرفعال' }, defaultValue: '0' },
    { key: 'instagram_dm_auto_reply', label: 'متن اتوپاسخ دایرکت', type: 'textarea', placeholder: 'سلام {name}، پیام شما دریافت شد...' },
    { key: 'instagram_comment_auto_reply', label: 'متن پاسخ کامنت', type: 'textarea', placeholder: 'ممنون از نظر شما...' },
];

export default function InstagramSettings() {
    const { settings } = usePage<PageProps & { settings: Record<string, StoredSetting[]> }>().props;
    const existing = useMemo(() => Object.values(settings).flat().reduce<Record<string, StoredSetting>>((map, item) => { map[item.key] = item; return map; }, {}), [settings]);
    const initial = useMemo(() => fields.reduce<Record<string, string>>((values, field) => { values[field.key] = existing[field.key]?.value ?? field.defaultValue ?? ''; return values; }, {}), [existing]);
    const form = useForm<{ settings: Record<string, string> }>({ settings: initial });
    const [health, setHealth] = useState<Health | null>(null);
    const [loading, setLoading] = useState(false);

    const loadHealth = () => {
        setLoading(true);
        fetch('/admin/settings/instagram/status', { headers: { Accept: 'application/json' } })
            .then((response) => response.json())
            .then((data) => setHealth(data as Health))
            .catch(() => setHealth(null))
            .finally(() => setLoading(false));
    };
    useEffect(() => { loadHealth(); }, []);
    const setSetting = (key: string, value: string) => form.setData('settings', { ...form.data.settings, [key]: value });
    const submit = (event: FormEvent) => { event.preventDefault(); form.put('/admin/settings', { preserveScroll: true, onSuccess: loadHealth }); };
    const copyWebhook = () => { if (health?.webhook_url) navigator.clipboard?.writeText(health.webhook_url); };
    const configured = health?.configured ?? false;

    return <form onSubmit={submit} className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="relative flex flex-wrap items-end justify-between gap-5"><div><div className="flex items-center gap-2 text-xs font-black text-brand-200"><MessageCircle className="size-4" /> مرکز کنترل Instagram</div><h1 className="mt-3 text-2xl font-black md:text-3xl">اتصال رسمی و اتوماسیون اینستاگرام</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">کلیدهای Meta، Webhook، Inbox و پاسخ‌های خودکار را از یک محل مدیریت کنید.</p></div><Button type="submit" loading={form.processing} className="bg-white text-deep-green hover:bg-brand-100"><Save className="size-4" /> ذخیره تنظیمات</Button></div>
        </section>

        <InstagramGuide
            title="راهنمای راه‌اندازی گام‌به‌گام اتصال Meta"
            defaultOpen
            steps={[
                { title: '۱. حساب اینستاگرام را حرفه‌ای کنید', text: 'در خود اینستاگرام، نوع حساب را Professional (Business یا Creator) کنید؛ اتصال رسمی فقط برای حساب‌های حرفه‌ای ممکن است.' },
                { title: '۲. اپ متا را بسازید', text: 'در developers.facebook.com یک اپ بسازید، محصول «Instagram» را اضافه کنید و App ID و App Secret را اینجا وارد و ذخیره کنید.' },
                { title: '۳. با OAuth وصل شوید', text: 'دکمه «اتصال با OAuth متا» را بزنید و با اکانت اینستاگرام تأیید کنید؛ توکن و شناسه اکانت به‌صورت خودکار و امن ذخیره می‌شوند.' },
                { title: '۴. Webhook را ثبت کنید', text: 'آدرس Webhook نمایش‌داده‌شده در پایین همین صفحه را در پنل اپ متا ثبت کنید و Verify Token را عیناً کپی کنید؛ فیلدهای messages و comments را فعال کنید.' },
                { title: '۵. تست نهایی', text: 'دکمه «بررسی اتصال» را بزنید تا سالمنس توکن چک شود، سپس با یک حساب دیگر به پیج پیام دهید تا ورود آن را در صندوق گفتگوها ببینید.' },
            ]}
            hints={[
                'تا وقتی «فعال‌سازی اتصال» روی غیرفعال است، هیچ پاسخی به مخاطبان ارسال نمی‌شود؛ بعد از تست موفق آن را فعال کنید.',
                'توکن OAuth معمولاً ۶۰ روز اعتبار دارد؛ از دکمه «تمدید توکن» پیش از انقضا استفاده کنید تا دریافت پیام‌ها قطع نشود.',
                'هیچ کلید حساسی بعد از ذخیره در صفحه نمایش داده نمی‌شود؛ فقط نشان «ذخیره شده» می‌بینید.',
            ]}
        />

        <section className="grid gap-4 sm:grid-cols-3">
            <StatusCard label="وضعیت اتصال" value={configured ? 'متصل و آماده' : 'نیازمند تنظیم'} ok={configured} />
            <StatusCard label="اکانت" value={health?.account?.username ? `@${health.account.username}` : 'اکانتی ثبت نشده'} ok={Boolean(health?.account)} />
            <StatusCard label="Webhook" value={health?.webhook_url ? 'آدرس آماده ثبت' : 'آدرس ساخته نشده'} ok={Boolean(health?.webhook_url)} />
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-soft ring-1 ring-navy/5">
            <div className="flex items-start gap-3"><span className="glass-tile"><ShieldCheck className="size-5" /></span><div><h2 className="text-base font-black text-navy">اطلاعات اتصال Meta</h2><p className="mt-1 text-xs leading-6 text-navy/45">ابتدا App ID و App Secret را ذخیره کنید، سپس OAuth را اجرا کنید. هیچ کلید حساسی در صفحه بازگردانده نمی‌شود.</p></div></div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">{fields.slice(0, 7).map((field) => <SettingField key={field.key} field={field} value={form.data.settings[field.key] ?? ''} configured={existing[field.key]?.configured} onChange={setSetting} error={form.errors[`settings.${field.key}`]} />)}</div>
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-navy/5 pt-5"><a href="/admin/settings/instagram/connect" className="inline-flex items-center gap-2 rounded-xl bg-deep-green px-4 py-3 text-xs font-black text-white hover:bg-brand-700"><ExternalLink className="size-4" /> اتصال با OAuth متا</a><Button type="button" variant="outline" onClick={() => router.post('/admin/settings/instagram/test', {}, { preserveScroll: true, onFinish: loadHealth })} disabled={!configured}><Wifi className="size-4" /> بررسی اتصال</Button>{health?.account && <><Button type="button" variant="outline" onClick={() => router.post('/admin/settings/instagram/refresh', {}, { preserveScroll: true, onFinish: loadHealth })}><RefreshCw className="size-4" /> تمدید توکن</Button><Button type="button" variant="danger" onClick={() => { if (confirm('اتصال اینستاگرام قطع شود؟')) router.post('/admin/settings/instagram/disconnect', {}, { preserveScroll: true, onFinish: loadHealth }); }}><Unplug className="size-4" /> قطع اتصال</Button></>}</div>
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-soft ring-1 ring-navy/5"><div className="flex items-start gap-3"><span className="glass-tile"><RefreshCw className="size-5" /></span><div><h2 className="text-base font-black text-navy">Webhook و دریافت رویداد</h2><p className="mt-1 text-xs leading-6 text-navy/45">این URL را در Meta Developers ثبت کنید و Verify Token را دقیقاً همان مقدار قرار دهید.</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2">{fields.slice(7, 10).map((field) => <SettingField key={field.key} field={field} value={form.data.settings[field.key] ?? ''} configured={existing[field.key]?.configured} onChange={setSetting} error={form.errors[`settings.${field.key}`]} />)}</div><div className="mt-5 flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3"><code dir="ltr" className="min-w-0 flex-1 truncate text-xs font-bold text-brand-900">{health?.webhook_url ?? 'در حال دریافت آدرس...'}</code><button type="button" onClick={copyWebhook} title="کپی آدرس Webhook" className="rounded-lg p-2 text-brand-700 hover:bg-white"><Copy className="size-4" /></button></div></section>

        <section className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-soft ring-1 ring-navy/5"><div className="flex items-start gap-3"><span className="glass-tile"><Send className="size-5" /></span><div><h2 className="text-base font-black text-navy">پاسخ و اتوماسیون پایه</h2><p className="mt-1 text-xs leading-6 text-navy/45">برای جلوگیری از پاسخ ناخواسته، ابتدا متن‌ها را ذخیره و با یک تست محدود فعال کنید.</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2">{fields.slice(10).map((field) => <SettingField key={field.key} field={field} value={form.data.settings[field.key] ?? ''} configured={existing[field.key]?.configured} onChange={setSetting} error={form.errors[`settings.${field.key}`]} />)}</div></section>

        {health?.account && <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 text-emerald-700" /><div><h2 className="text-sm font-black text-emerald-900">{health.account.username ? `@${health.account.username}` : 'اکانت متصل'}</h2><p className="mt-1 text-xs leading-6 text-emerald-900/65" dir="ltr">ID: {health.account.id} · API: {health.graph_version} · آخرین همگام‌سازی: {health.account.last_sync_at ?? 'هنوز انجام نشده'}</p>{health.account.last_error && <p className="mt-2 text-xs font-bold text-red-700">{health.account.last_error}</p>}</div></div></section>}
        <div className="flex justify-end"><Button type="submit" loading={form.processing}><Save className="size-4" /> ذخیره همه تغییرات</Button></div>
    </form>;
}

function SettingField({ field, value, configured, onChange, error }: { field: InstagramField; value: string; configured?: boolean; onChange: (key: string, value: string) => void; error?: string }) {
    const wide = field.type === 'textarea';
    return <div className={wide ? 'sm:col-span-2' : ''}><div className="mb-1.5 flex items-center justify-between gap-2"><label htmlFor={field.key} className="text-xs font-black text-navy/70">{field.label}</label>{field.secret && configured && <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[0.62rem] font-black text-emerald-700"><CheckCircle2 className="size-3" /> ذخیره شده</span>}</div>{field.type === 'textarea' ? <textarea id={field.key} rows={4} value={value} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.placeholder} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" /> : field.type === 'select' ? <select id={field.key} value={value} onChange={(event) => onChange(field.key, event.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200">{Object.entries(field.options ?? {}).map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select> : <input id={field.key} type={field.type === 'password' ? 'password' : field.type ?? 'text'} dir={field.type === 'url' ? 'ltr' : undefined} value={value} onChange={(event) => onChange(field.key, event.target.value)} placeholder={field.secret && configured ? 'برای حفظ مقدار قبلی خالی بگذارید' : field.placeholder} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />}{field.help && <p className="mt-1.5 text-[0.68rem] leading-5 text-navy/40">{field.help}</p>}{error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}</div>;
}

function StatusCard({ label, value, ok }: { label: string; value: string; ok: boolean }) { return <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-navy/5">{ok ? <CheckCircle2 className="size-5 text-emerald-600" /> : <XCircle className="size-5 text-amber-600" />}<div><strong className="block text-sm font-black text-navy">{value}</strong><span className="text-xs font-bold text-navy/45">{label}</span></div></div>; }

InstagramSettings.layout = (page: ReactNode) => <AdminLayout title="اتصال اینستاگرام">{page}</AdminLayout>;
