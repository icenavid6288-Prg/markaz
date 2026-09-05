import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, FileText, Plus, Save, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type Template = { id: number; name: string; category: string; body: string; is_active: boolean; usage_count: number };

const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
const categoryLabels: Record<string, string> = {
    welcome: 'خوش‌آمد', course: 'دوره', price: 'قیمت و پرداخت',
    followup: 'پیگیری', thankyou: 'تشکر', general: 'عمومی',
};
const variables = ['{{name}}', '{{date}}', '{{campaign}}'];

export default function EitaaTemplates() {
    const { templates } = usePage<PageProps & { templates: Template[] }>().props;
    const [editing, setEditing] = useState<Template | null>(null);
    const form = useForm({ name: '', category: 'general', body: '', is_active: true });

    const startEdit = (item: Template) => {
        setEditing(item);
        form.setData({ name: item.name, category: item.category, body: item.body, is_active: item.is_active });
    };
    const reset = () => { setEditing(null); form.reset(); };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        editing
            ? form.put(`/admin/eitaa/templates/${editing.id}`, { preserveScroll: true, onSuccess: reset })
            : form.post('/admin/eitaa/templates', { preserveScroll: true, onSuccess: reset });
    };

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><FileText className="size-6 text-brand-600" /> قالب‌های پیام</h1>
            <p className="mt-2 text-sm text-navy/50">متن‌های آماده برای ارسال سریع و کمپین‌ها؛ متغیرها هنگام ارسال جای‌گذاری می‌شوند.</p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={submit} className="h-fit rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                <div className="flex items-center gap-2 text-sm font-black text-navy"><Plus className="size-5 text-brand-600" /> {editing ? 'ویرایش قالب' : 'قالب جدید'}</div>
                <div className="mt-5 space-y-4">
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">نام قالب</span>
                        <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={inputClass} placeholder="خوش‌آمدگویی" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">دسته‌بندی</span>
                        <select value={form.data.category} onChange={(e) => form.setData('category', e.target.value)} className={inputClass}>
                            {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">متن قالب</span>
                        <textarea rows={8} value={form.data.body} onChange={(e) => form.setData('body', e.target.value)} className={inputClass} placeholder="سلام {{name}} عزیز، ..." /></label>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.68rem] font-bold text-navy/45">درج متغیر:</span>
                        {variables.map((variable) => <button key={variable} type="button" onClick={() => form.setData('body', `${form.data.body}${form.data.body && !form.data.body.endsWith(' ') ? ' ' : ''}${variable}`)} className="rounded-lg bg-brand-50 px-2.5 py-1 text-[0.65rem] font-black text-brand-700 hover:bg-brand-100" dir="ltr">{variable}</button>)}
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold text-navy/60">
                        <input type="checkbox" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="rounded border-navy/20 text-brand-600" /> فعال
                    </label>
                    <div className="flex gap-2">
                        <Button type="submit" loading={form.processing}><Save className="size-4" /> {editing ? 'ذخیره' : 'افزودن قالب'}</Button>
                        {editing && <Button type="button" variant="outline" onClick={reset}>انصراف</Button>}
                    </div>
                </div>
            </form>

            <div className="space-y-3">
                {templates.map((item) => <article key={item.id} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <strong className="text-sm font-black text-navy">{item.name}</strong>
                                <span className="rounded-md bg-brand-50 px-2 py-1 text-[0.62rem] font-black text-brand-700">{categoryLabels[item.category] ?? item.category}</span>
                                {!item.is_active && <span className="rounded-md bg-soft-gray px-2 py-1 text-[0.62rem] font-black text-navy/45">غیرفعال</span>}
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-navy/60">{item.body}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                            <button type="button" onClick={() => startEdit(item)} className="rounded-lg bg-soft-gray px-2.5 py-2 text-[0.65rem] font-black text-navy/60">ویرایش</button>
                            <button type="button" onClick={() => confirm('این قالب حذف شود؟') && router.delete(`/admin/eitaa/templates/${item.id}`, { preserveScroll: true })} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-red-500 hover:bg-red-50"><Trash2 className="size-3.5" /></button>
                        </div>
                    </div>
                </article>)}
                {templates.length === 0 && <div className="rounded-2xl bg-white p-10 text-center shadow-soft ring-1 ring-navy/5"><FileText className="mx-auto size-8 text-navy/25" /><p className="mt-3 text-sm font-bold text-navy/45">هنوز قالبی ثبت نشده است.</p></div>}
            </div>
        </section>
    </div>;
}

EitaaTemplates.layout = (page: ReactNode) => <AdminLayout title="قالب‌های ایتا">{page}</AdminLayout>;