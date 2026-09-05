import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Plus, Save, Trash2, Zap } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type Keyword = { id: number; bot_id?: number | null; bot?: { name: string } | null; keyword: string; match_type: string; response: string; priority: number; stop_processing: boolean; is_active: boolean; hit_count: number };

const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
const matchLabels: Record<string, string> = {
    exact: 'دقیقاً برابر', contains: 'شامل باشد', starts_with: 'شروع شود با', regex: 'عبارت باقاعده',
};

export default function EitaaKeywords() {
    const { keywords, bots } = usePage<PageProps & {
        keywords: Keyword[]; bots: Array<{ id: number; name: string }>;
    }>().props;
    const [editing, setEditing] = useState<Keyword | null>(null);
    const form = useForm({
        bot_id: bots[0]?.id?.toString() ?? '',
        keyword: '', match_type: 'contains', response: '',
        priority: 10, stop_processing: true, is_active: true,
    });

    const startEdit = (item: Keyword) => {
        setEditing(item);
        form.setData({
            bot_id: item.bot_id?.toString() ?? bots[0]?.id?.toString() ?? '',
            keyword: item.keyword, match_type: item.match_type, response: item.response,
            priority: item.priority, stop_processing: item.stop_processing, is_active: item.is_active,
        });
    };
    const reset = () => { setEditing(null); form.reset(); };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        editing
            ? form.put(`/admin/eitaa/keywords/${editing.id}`, { preserveScroll: true, onSuccess: reset })
            : form.post('/admin/eitaa/keywords', { preserveScroll: true, onSuccess: reset });
    };

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><Zap className="size-6 text-brand-600" /> پاسخ‌های خودکار (کلمات کلیدی)</h1>
            <p className="mt-2 text-sm text-navy/50">قوانین تطبیق پیام ورودی و پاسخ خودکار را تعریف کنید.</p>
        </div>

        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-900">
            <strong className="text-sm font-black">نکته مهم درباره دریافت پیام</strong>
            <p className="mt-1 text-xs leading-6 text-sky-900/70">
                ایتا هنوز API رسمی برای دریافت پیام‌های ورودی ارائه نکرده است؛ قوانین ذخیره می‌شوند و به‌محض فعال شدن وب‌هوک ورودی به‌صورت خودکار اعمال می‌گردند. قوانین امروز روی پاسخ دستی و کمپین‌ها اثر ندارند.
            </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={submit} className="h-fit rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                <div className="flex items-center gap-2 text-sm font-black text-navy"><Plus className="size-5 text-brand-600" /> {editing ? 'ویرایش قانون' : 'قانون جدید'}</div>
                <div className="mt-5 space-y-4">
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">ربات</span>
                        <select value={form.data.bot_id} onChange={(e) => form.setData('bot_id', e.target.value)} className={inputClass}>
                            {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
                        </select></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">کلمه کلیدی / الگو</span>
                        <input value={form.data.keyword} onChange={(e) => form.setData('keyword', e.target.value)} className={inputClass} placeholder="قیمت" /></label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">نوع تطبیق</span>
                            <select value={form.data.match_type} onChange={(e) => form.setData('match_type', e.target.value)} className={inputClass}>
                                {Object.entries(matchLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select></label>
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">اولویت</span>
                            <input type="number" min={1} max={1000} value={form.data.priority} onChange={(e) => form.setData('priority', Number(e.target.value))} className={inputClass} /></label>
                    </div>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">متن پاسخ</span>
                        <textarea rows={5} value={form.data.response} onChange={(e) => form.setData('response', e.target.value)} className={inputClass} placeholder="برای اطلاع از قیمت‌ها به صفحه دوره‌ها سر بزنید..." /></label>
                    <label className="flex items-center gap-2 text-xs font-bold text-navy/60">
                        <input type="checkbox" checked={form.data.stop_processing} onChange={(e) => form.setData('stop_processing', e.target.checked)} className="rounded border-navy/20 text-brand-600" />
                        بعد از این قانون، قوانین بعدی بررسی نشود
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-navy/60">
                        <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="rounded border-navy/20 text-brand-600" /> فعال
                    </label>
                    <div className="flex gap-2">
                        <Button type="submit" loading={form.processing}><Save className="size-4" /> {editing ? 'ذخیره' : 'افزودن قانون'}</Button>
                        {editing && <Button type="button" variant="outline" onClick={reset}>انصراف</Button>}
                    </div>
                </div>
            </form>

            <div className="space-y-3">
                {keywords.map((item) => <article key={item.id} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <strong className="font-mono text-sm font-black text-navy" dir="auto">{item.keyword}</strong>
                                <span className="rounded-md bg-brand-50 px-2 py-1 text-[0.62rem] font-black text-brand-700">{matchLabels[item.match_type] ?? item.match_type}</span>
                                <span className="rounded-md bg-soft-gray px-2 py-1 text-[0.62rem] font-black text-navy/50">اولویت {item.priority}</span>
                                {!item.is_active && <span className="rounded-md bg-amber-50 px-2 py-1 text-[0.62rem] font-black text-amber-700">غیرفعال</span>}
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-navy/60">{item.response}</p>
                            <p className="mt-1.5 text-[0.65rem] text-navy/35">ربات: {item.bot?.name ?? '—'} · اجرا: {item.hit_count} بار</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                            <button type="button" onClick={() => startEdit(item)} className="rounded-lg bg-soft-gray px-2.5 py-2 text-[0.65rem] font-black text-navy/60">ویرایش</button>
                            <button type="button" onClick={() => confirm('این قانون حذف شود؟') && router.delete(`/admin/eitaa/keywords/${item.id}`, { preserveScroll: true })} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-red-500 hover:bg-red-50"><Trash2 className="size-3.5" /></button>
                        </div>
                    </div>
                </article>)}
                {keywords.length === 0 && <div className="rounded-2xl bg-white p-10 text-center shadow-soft ring-1 ring-navy/5"><Zap className="mx-auto size-8 text-navy/25" /><p className="mt-3 text-sm font-bold text-navy/45">هنوز قانونی تعریف نشده است.</p></div>}
            </div>
        </section>
    </div>;
}

EitaaKeywords.layout = (page: ReactNode) => <AdminLayout title="پاسخ خودکار ایتا">{page}</AdminLayout>;