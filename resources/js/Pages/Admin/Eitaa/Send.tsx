import { useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Clock, SendHorizontal } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type Bot = { id: number; name: string; test_mode: boolean };
type Target = { id: number; title: string; chat_id: string; type: string };
type Template = { id: number; name: string; body: string };

const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

export default function EitaaSend() {
    const { bots, targets, templates } = usePage<PageProps & {
        bots: Bot[]; targets: Target[]; templates: Template[];
    }>().props;
    const form = useForm({
        bot_id: bots[0]?.id?.toString() ?? '',
        target_ids: [] as number[],
        body: '',
        schedule_at: '',
    });

    const toggleTarget = (id: number) => {
        form.setData('target_ids', form.data.target_ids.includes(id)
            ? form.data.target_ids.filter((t) => t !== id)
            : [...form.data.target_ids, id]);
    };

    const applyTemplate = (id: string) => {
        const template = templates.find((t) => t.id.toString() === id);
        if (template) form.setData('body', template.body);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/eitaa/send', {
            preserveScroll: true,
            onSuccess: () => form.setData('body', ''),
        });
    };

    const selectedBot = bots.find((bot) => bot.id.toString() === form.data.bot_id);

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><SendHorizontal className="size-6 text-brand-600" /> ارسال سریع پیام</h1>
            <p className="mt-2 text-sm text-navy/50">پیام مستقیم به حداکثر ۵۰ مقصد منتخب؛ یا زمان‌بندی آن برای بعد.</p>
        </div>

        {selectedBot?.test_mode && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <strong className="text-sm font-black">ربات انتخاب‌شده در حالت آزمایشی است.</strong>
            <p className="mt-1 text-xs leading-6 text-amber-900/70">پیام‌ها فقط شبیه‌سازی می‌شوند. برای ارسال واقعی، حالت آزمایشی را در صفحه ربات‌ها خاموش کنید.</p>
        </section>}

        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
            <div className="space-y-4">
                <label className="block max-w-sm"><span className="mb-1.5 block text-xs font-black text-navy/70">ربات</span>
                    <select value={form.data.bot_id} onChange={(e) => form.setData('bot_id', e.target.value)} className={inputClass}>
                        {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}{bot.test_mode ? ' (آزمایشی)' : ''}</option>)}
                    </select></label>

                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-black text-navy/70">مقاصد ({form.data.target_ids.length} انتخاب‌شده از {targets.length})</span>
                        <button type="button" onClick={() => form.setData('target_ids', form.data.target_ids.length === targets.length ? [] : targets.map((t) => t.id))} className="text-[0.65rem] font-black text-brand-700 hover:underline">
                            {form.data.target_ids.length === targets.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
                        </button>
                    </div>
                    <div className="grid max-h-56 gap-1.5 overflow-y-auto rounded-xl bg-soft-gray p-3 sm:grid-cols-2">
                        {targets.map((target) => <label key={target.id} className="flex items-center gap-2 text-xs font-bold text-navy/70">
                            <input type="checkbox" checked={form.data.target_ids.includes(target.id)} onChange={() => toggleTarget(target.id)} className="rounded border-navy/20 text-brand-600" />
                            <span className="min-w-0 truncate">{target.title}</span>
                            <span className="shrink-0 text-navy/35" dir="ltr">{target.type === 'group' ? '👥' : '📢'}</span>
                        </label>)}
                        {targets.length === 0 && <p className="text-xs text-navy/40">مقصدی با وضعیت «رضایت داده» وجود ندارد. ابتدا مقاصد را تأیید کنید.</p>}
                    </div>
                    {form.errors.target_ids && <p className="mt-1 text-xs font-bold text-red-600">{form.errors.target_ids}</p>}
                </div>

                <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">متن پیام</span>
                    <textarea rows={6} value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} className={inputClass} placeholder="سلام {{name}}، ..." /></label>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.68rem] font-bold text-navy/45">قالب آماده:</span>
                    {templates.map((template) => <button key={template.id} type="button" onClick={() => applyTemplate(template.id.toString())} className="rounded-lg bg-brand-50 px-2.5 py-1 text-[0.65rem] font-black text-brand-700 hover:bg-brand-100">{template.name}</button>)}
                    {templates.length === 0 && <span className="text-[0.68rem] text-navy/40">قالبی ثبت نشده است.</span>}
                </div>

                <label className="block max-w-sm"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-navy/70"><Clock className="size-3.5" /> زمان‌بندی ارسال (خالی = ارسال فوری)</span>
                    <input type="datetime-local" value={form.data.schedule_at} onChange={(e) => form.setData('schedule_at', e.target.value)} className={inputClass} /></label>

                <Button type="submit" loading={form.processing} disabled={form.data.target_ids.length === 0 || !form.data.body.trim()}>
                    <SendHorizontal className="size-4" /> ارسال پیام
                </Button>
            </div>
        </form>
    </div>;
}

EitaaSend.layout = (page: ReactNode) => <AdminLayout title="ارسال سریع ایتا">{page}</AdminLayout>;
