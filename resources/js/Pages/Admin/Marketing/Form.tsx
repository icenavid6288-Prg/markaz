import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Braces, Info, Save, Send, Users, Zap } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

interface Campaign { id: number; name: string; channel: string; trigger: string; audience: string; subject?: string | null; message: string; status: string; scheduled_at?: string | null; cooldown_days?: number | null; }
interface Options { channels: Record<string, string>; triggers: Record<string, string>; audiences: Record<string, string>; statuses: Record<string, string>; }

export default function MarketingForm() {
    const { campaign, options, audienceCounts } = usePage<PageProps & { campaign: Campaign | null; options: Options; audienceCounts?: Record<string, number> }>().props;
    const isEdit = Boolean(campaign);
    const form = useForm({
        name: campaign?.name ?? '', channel: campaign?.channel ?? 'sms', trigger: campaign?.trigger ?? 'manual', audience: campaign?.audience ?? 'all_users', subject: campaign?.subject ?? '', message: campaign?.message ?? 'سلام {name}،\n\n', status: campaign?.status === 'active' ? 'active' : campaign?.status === 'paused' ? 'paused' : 'draft', scheduled_at: campaign?.scheduled_at ?? '', cooldown_days: campaign?.cooldown_days ?? 14,
    });
    const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
    const submit = (event: FormEvent) => { event.preventDefault(); isEdit ? form.put(`/admin/marketing/${campaign?.id}`) : form.post('/admin/marketing'); };
    const selectedAudienceCount = audienceCounts?.[form.data.audience] ?? 0;

    return <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/marketing" className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به اتومارکتینگ</Link><Button type="submit" loading={form.processing}><Save className="size-4" /> {isEdit ? 'ذخیره کمپین' : 'ساخت کمپین'}</Button></div>
        {Object.keys(form.errors).length > 0 && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-200">لطفاً خطاهای فرم را بررسی کنید.</div>}
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8"><div className="pointer-events-none absolute -left-16 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-xs font-black text-brand-200"><Zap className="size-4" /> استودیو اتومارکتینگ</div><h1 className="mt-3 text-2xl font-black md:text-3xl">{isEdit ? 'ویرایش کمپین' : 'ساخت کمپین جدید'}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">کمپین را یک‌بار طراحی کنید و آن را به یک رویداد واقعی مثل ثبت لید یا خرید دوره متصل کنید.</p></div></section>
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="grid gap-5 sm:grid-cols-2">
                <Field label="نام کمپین" error={form.errors.name} wide><input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={inputClass} placeholder="مثلاً: خوش‌آمدگویی لیدهای جدید" /></Field>
                <Field label="کانال ارسال" error={form.errors.channel}><select value={form.data.channel} onChange={(e) => form.setData('channel', e.target.value)} className={inputClass}>{Object.entries(options.channels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
                <Field label="رویداد شروع" error={form.errors.trigger}><select value={form.data.trigger} onChange={(e) => form.setData('trigger', e.target.value)} className={inputClass}>{Object.entries(options.triggers).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
                <Field label="مخاطب" error={form.errors.audience}><select value={form.data.audience} onChange={(e) => form.setData('audience', e.target.value)} className={inputClass}>{Object.entries(options.audiences).map(([key, label]) => <option key={key} value={key}>{label}{audienceCounts?.[key] !== undefined ? ` (${audienceCounts[key]})` : ''}</option>)}</select></Field>
                {form.data.channel === 'email' && <Field label="موضوع ایمیل" error={form.errors.subject} wide><input value={form.data.subject} onChange={(e) => form.setData('subject', e.target.value)} className={inputClass} placeholder="موضوع پیام" /></Field>}
                <Field label="وضعیت" error={form.errors.status}><select value={form.data.status} onChange={(e) => form.setData('status', e.target.value)} className={inputClass}>{Object.entries(options.statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
                {form.data.trigger === 'inactive_user' && <Field label="فاصله بین دو ارسال (روز)" error={form.errors.cooldown_days} wide><input type="number" min={1} max={365} value={form.data.cooldown_days} onChange={(e) => form.setData('cooldown_days', Number(e.target.value))} className={inputClass} /><p className="mt-1.5 text-[0.68rem] leading-5 text-navy/45">کمپین «کاربر غیرفعال» هر روز ساعت ۹ صبح بررسی می‌شود؛ هر کاربر فقط یک‌بار در این بازه، همان کمپین را دریافت می‌کند.</p></Field>}
                <Field label="زمان اجرای یک‌باره" error={form.errors.scheduled_at}><input type="datetime-local" value={form.data.scheduled_at} onChange={(e) => form.setData('scheduled_at', e.target.value)} className={inputClass} /></Field>
                <Field label="متن پیام" error={form.errors.message} wide><div className="relative"><textarea rows={12} value={form.data.message} onChange={(e) => form.setData('message', e.target.value)} className={`${inputClass} resize-y ${form.data.channel === 'sms' ? 'font-sans' : ''}`} placeholder="سلام {name}، ..." /><Braces className="pointer-events-none absolute left-3 top-3 size-4 text-navy/25" /></div><div className="mt-2 flex flex-wrap gap-2 text-[0.68rem] font-bold text-navy/45"><span className="rounded-lg bg-soft-gray px-2 py-1">{'{name}'} نام مخاطب</span><span className="rounded-lg bg-soft-gray px-2 py-1">{'{site_name}'} نام سایت</span></div></Field>
            </div></div>
            <aside className="flex flex-col gap-4">
                <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5"><div className="flex items-center gap-2 text-sm font-black text-brand-900"><Info className="size-4" /> راهنمای این فرم</div><ul className="mt-3 space-y-2 text-xs leading-7 text-brand-900/70"><li>• برای پیامک، اتصال سرویس SMS باید از تنظیمات سایت فعال باشد.</li><li>• رویداد «ثبت لید جدید» فقط برای کمپین فعال اجرا می‌شود.</li><li>• اجرای دستی فوری است؛ اگر زمان اجرای یک‌باره تعیین کنید، کمپین با زمان‌بندی سیستم اجرا می‌شود.</li><li>• قبل از ارسال عمومی، ابتدا درایور پیامک را روی حالت Log یا Sandbox تست کنید.</li></ul></div>
                <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><div className="flex items-center gap-2 text-sm font-black text-navy"><Users className="size-4 text-brand-600" /> مخاطب انتخاب‌شده</div><strong className="mt-3 block text-3xl font-black text-brand-700">{selectedAudienceCount}</strong><p className="mt-1 text-xs leading-6 text-navy/45">گیرنده فعال برای این گروه</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-100"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, selectedAudienceCount > 0 ? 100 : 0)}%` }} /></div></div>
                <div className="rounded-2xl bg-soft-gray p-5"><div className="flex items-center gap-2 text-sm font-black text-navy"><Send className="size-4 text-brand-600" /> چرخه کار</div><div className="mt-3 space-y-2 text-xs font-bold text-navy/60"><div>۱. انتخاب مخاطب و کانال</div><div>۲. نوشتن پیام شخصی‌سازی‌شده</div><div>۳. فعال‌سازی یا اجرای دستی</div><div>۴. مشاهده نتیجه و خطاها</div></div></div>
            </aside>
        </section>
        <div className="flex justify-end"><Button type="submit" loading={form.processing}><Save className="size-4" /> {isEdit ? 'ذخیره تغییرات' : 'ثبت کمپین در دیتابیس'}</Button></div>
    </form>;
}

function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: ReactNode }) { return <div className={wide ? 'sm:col-span-2' : ''}><label className="mb-1.5 block text-xs font-black text-navy/70">{label}</label>{children}{error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}</div>; }

MarketingForm.layout = (page: ReactNode) => <AdminLayout title="فرم اتومارکتینگ">{page}</AdminLayout>;
