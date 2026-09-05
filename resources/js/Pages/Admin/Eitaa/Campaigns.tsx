import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Megaphone, Plus, Save } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type Campaign = {
    id: number; bot?: string | null; name: string; status: string; message_body: string;
    audience_type: string; scheduled_at?: string | null; total_targets: number;
    sent_count: number; failed_count: number; started_at?: string | null; completed_at?: string | null;
};
type Bot = { id: number; name: string };
type Template = { id: number; name: string; body: string };
type Target = { id: number; title: string; chat_id: string; tags: string[] };

const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
const statusTone: Record<string, string> = {
    draft: 'bg-soft-gray text-navy/50',
    scheduled: 'bg-sky-50 text-sky-700',
    running: 'bg-brand-50 text-brand-700',
    paused: 'bg-amber-50 text-amber-700',
    completed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-red-50 text-red-600',
    failed: 'bg-red-50 text-red-600',
};
const statusLabels: Record<string, string> = {
    draft: 'پیش‌نویس', scheduled: 'زمان‌بندی‌شده', running: 'در حال ارسال', paused: 'متوقف',
    completed: 'تکمیل‌شده', cancelled: 'لغوشده', failed: 'ناموفق',
};

export default function EitaaCampaigns() {
    const { campaigns, bots, templates, targets } = usePage<PageProps & {
        campaigns: Campaign[]; bots: Bot[]; templates: Template[]; targets: Target[];
    }>().props;
    const form = useForm({
        bot_id: bots[0]?.id?.toString() ?? '',
        name: '',
        description: '',
        message_body: '',
        audience_type: 'all',
        audience_tags: '',
        audience_target_ids: [] as number[],
        template_id: '',
        scheduled_at: '',
        rate_limit_per_minute: 20,
        max_retries: 2,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const payload = {
            ...form.data,
            template_id: form.data.template_id || null,
            scheduled_at: form.data.scheduled_at || null,
            audience_filters:
                form.data.audience_type === 'tags'
                    ? { tags: form.data.audience_tags.split(',').map((t) => t.trim()).filter(Boolean) }
                    : form.data.audience_type === 'targets'
                        ? { target_ids: form.data.audience_target_ids }
                        : null,
        };
        form.transform(() => payload);
        form.post('/admin/eitaa/campaigns', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const applyTemplate = (id: string) => {
        const template = templates.find((t) => t.id.toString() === id);
        form.setData((data) => ({ ...data, template_id: id, message_body: template?.body ?? data.message_body }));
    };

    const toggleTarget = (id: number) => {
        form.setData('audience_target_ids', form.data.audience_target_ids.includes(id)
            ? form.data.audience_target_ids.filter((t) => t !== id)
            : [...form.data.audience_target_ids, id]);
    };

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><Megaphone className="size-6 text-brand-600" /> کمپین‌های ارسال انبوه</h1>
            <p className="mt-2 text-sm text-navy/50">کمپین بسازید، مخاطب را با برچسب یا فهرست دستی مشخص کنید و ارسال را به زمان‌بر بسپارید.</p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={submit} className="h-fit rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                <div className="flex items-center gap-2 text-sm font-black text-navy"><Plus className="size-5 text-brand-600" /> کمپین جدید</div>
                <div className="mt-5 space-y-4">
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">ربات</span>
                        <select value={form.data.bot_id} onChange={(e) => form.setData('bot_id', e.target.value)} className={inputClass}>
                            {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
                        </select></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">نام کمپین</span>
                        <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={inputClass} placeholder="اطلاع‌رسانی دوره جدید" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">قالب آماده (اختیاری)</span>
                        <select value={form.data.template_id} onChange={(e) => applyTemplate(e.target.value)} className={inputClass}>
                            <option value="">— بدون قالب —</option>
                            {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                        </select></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">متن پیام</span>
                        <textarea rows={6} value={form.data.message_body} onChange={(e) => form.setData('message_body', e.target.value)} className={inputClass} placeholder="سلام {{name}}، {{date}} دوره جدید افتتاح شد..." /></label>
                    <p className="text-[0.65rem] text-navy/40">متغیرها: {'{{name}}'} نام مقصد، {'{{date}}'} تاریخ امروز، {'{{campaign}}'} نام کمپین.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">نوع مخاطب</span>
                            <select value={form.data.audience_type} onChange={(e) => form.setData('audience_type', e.target.value)} className={inputClass}>
                                <option value="all">همه مقاصد رضایت‌داده</option>
                                <option value="tags">بر اساس برچسب</option>
                                <option value="targets">انتخاب دستی</option>
                            </select></label>
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">زمان ارسال (اختیاری)</span>
                            <input type="datetime-local" value={form.data.scheduled_at} onChange={(e) => form.setData('scheduled_at', e.target.value)} className={inputClass} /></label>
                    </div>
                    {form.data.audience_type === 'tags' && <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">برچسب‌ها (با کاما)</span>
                        <input value={form.data.audience_tags} onChange={(e) => form.setData('audience_tags', e.target.value)} className={inputClass} placeholder="ویژه، والدین" /></label>}
                    {form.data.audience_type === 'targets' && <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl bg-soft-gray p-3">
                        {targets.map((target) => <label key={target.id} className="flex items-center gap-2 text-xs font-bold text-navy/70">
                            <input type="checkbox" checked={form.data.audience_target_ids.includes(target.id)} onChange={() => toggleTarget(target.id)} className="rounded border-navy/20 text-brand-600" />
                            {target.title} <span className="text-navy/35" dir="ltr">({target.chat_id})</span>
                        </label>)}
                        {targets.length === 0 && <p className="text-xs text-navy/40">مقصد فعالی وجود ندارد.</p>}
                    </div>}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">سرعت ارسال در دقیقه</span>
                            <input type="number" min={1} max={120} value={form.data.rate_limit_per_minute} onChange={(e) => form.setData('rate_limit_per_minute', Number(e.target.value))} className={inputClass} /></label>
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">حداکثر تلاش مجدد</span>
                            <input type="number" min={0} max={5} value={form.data.max_retries} onChange={(e) => form.setData('max_retries', Number(e.target.value))} className={inputClass} /></label>
                    </div>
                    <Button type="submit" loading={form.processing}><Save className="size-4" /> ساخت کمپین</Button>
                </div>
            </form>

            <div className="space-y-3">
                {campaigns.map((campaign) => <article key={campaign.id} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <strong className="text-sm font-black text-navy">{campaign.name}</strong>
                                <span className={`rounded-md px-2 py-1 text-[0.62rem] font-black ${statusTone[campaign.status] ?? 'bg-soft-gray text-navy/50'}`}>{statusLabels[campaign.status] ?? campaign.status}</span>
                            </div>
                            <p className="mt-1 text-xs text-navy/45">{campaign.bot || '—'} · {campaign.scheduled_at ? `زمان‌بندی: ${campaign.scheduled_at}` : 'بدون زمان‌بندی'}</p>
                            <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-xs text-navy/55">{campaign.message_body}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {['draft', 'paused', 'failed'].includes(campaign.status) && <button type="button" onClick={() => router.post(`/admin/eitaa/campaigns/${campaign.id}/launch`, {}, { preserveScroll: true })} className="rounded-lg bg-brand-600 px-3 py-2 text-[0.65rem] font-black text-white hover:bg-brand-700">اجرا</button>}
                            {['scheduled','running'].includes(campaign.status) && <button type="button" onClick={() => router.post(`/admin/eitaa/campaigns/${campaign.id}/pause`, {}, { preserveScroll: true })} className="rounded-lg bg-amber-50 px-3 py-2 text-[0.65rem] font-black text-amber-700">توقف</button>}
                            {campaign.status === 'paused' && <button type="button" onClick={() => router.post(`/admin/eitaa/campaigns/${campaign.id}/resume`, {}, { preserveScroll: true })} className="rounded-lg bg-emerald-50 px-3 py-2 text-[0.65rem] font-black text-emerald-700">ادامه</button>}
                            {!['completed','cancelled'].includes(campaign.status) && <button type="button" onClick={() => confirm('کمپین لغو شود؟') && router.post(`/admin/eitaa/campaigns/${campaign.id}/cancel`, {}, { preserveScroll: true })} className="rounded-lg bg-soft-gray px-3 py-2 text-[0.65rem] font-black text-navy/60">لغو</button>}
                            <a href={`/admin/eitaa/campaigns/${campaign.id}`} className="rounded-lg bg-soft-gray px-3 py-2 text-[0.65rem] font-black text-navy/60">جزئیات</a>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 border-t border-navy/5 pt-3 text-xs font-bold text-navy/50">
                        <span>{campaign.sent_count}/{campaign.total_targets} ارسال‌شده</span>
                        {campaign.failed_count > 0 && <span className="text-red-600">{campaign.failed_count} ناموفق</span>}
                    </div>
                </article>)}
                {campaigns.length === 0 && <div className="rounded-2xl bg-white p-10 text-center shadow-soft ring-1 ring-navy/5"><Megaphone className="mx-auto size-8 text-navy/25" /><p className="mt-3 text-sm font-bold text-navy/45">هنوز کمپینی ساخته نشده است.</p></div>}
            </div>
        </section>
    </div>;
}

EitaaCampaigns.layout = (page: ReactNode) => <AdminLayout title="کمپین‌های ایتا">{page}</AdminLayout>;