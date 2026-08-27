import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, ClipboardList, Save } from 'lucide-react';
import { type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

interface Assignment { id: number; title: string; description: string | null; lesson_id: number; max_score: number; due_days: number | null; }

export default function AssignmentForm() {
    const { assignment, lessons } = usePage<PageProps & { assignment: Assignment | null; lessons: Array<{ id: number; label: string }> }>().props;
    const isEdit = Boolean(assignment);
    const form = useForm({
        title: assignment?.title ?? '',
        description: assignment?.description ?? '',
        lesson_id: assignment?.lesson_id ?? lessons[0]?.id ?? '',
        max_score: assignment?.max_score ?? 100,
        due_days: assignment?.due_days ?? '',
    });
    const input = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
    const submit = (event: FormEvent) => { event.preventDefault(); isEdit ? form.put(`/admin/assignments/${assignment?.id}`) : form.post('/admin/assignments'); };

    return <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/assignments" className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به تکلیف‌ها</Link><Button type="submit" loading={form.processing}><Save className="size-4" /> {isEdit ? 'ذخیره تکلیف' : 'ساخت تکلیف'}</Button></div>
        {Object.keys(form.errors).length > 0 && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-200">لطفاً خطاهای فرم را بررسی کنید.</div>}
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8"><div className="pointer-events-none absolute -left-16 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" /><div className="relative"><div className="flex items-center gap-2 text-xs font-black text-brand-200"><ClipboardList className="size-4" /> سازنده تکلیف</div><h1 className="mt-3 text-2xl font-black md:text-3xl">{isEdit ? 'ویرایش تکلیف' : 'ساخت تکلیف درس'}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">تکلیف به یک درس متصل می‌شود و هنرجو با ارسال آن، درس را کامل می‌کند. نمره‌دهی از بخش «تصحیح» همین تکلیف انجام می‌شود.</p></div></section>
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="mb-5 text-sm font-black text-navy">اطلاعات تکلیف</div><div className="grid gap-5 sm:grid-cols-2">
            <Field label="عنوان تکلیف" error={form.errors.title} wide><input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className={input} placeholder="مثلاً: تمرین کشف استعداد" /></Field>
            <Field label="درس" error={form.errors.lesson_id} wide><select value={String(form.data.lesson_id)} onChange={(e) => form.setData('lesson_id', Number(e.target.value))} className={input}>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.label}</option>)}</select><p className="mt-1.5 text-[0.68rem] leading-5 text-navy/45">پیشنهاد می‌شود درس از نوع «تکلیف» انتخاب شود؛ با ارسال تکلیف، آن درس کامل می‌شود.</p></Field>
            <Field label="حداکثر نمره" error={form.errors.max_score}><input type="number" min={1} max={100} value={form.data.max_score} onChange={(e) => form.setData('max_score', Number(e.target.value))} className={input} /></Field>
            <Field label="مهلت (روز از شروع دوره، اختیاری)" error={form.errors.due_days}><input type="number" min={1} max={365} value={form.data.due_days} onChange={(e) => form.setData('due_days', e.target.value === '' ? '' : Number(e.target.value))} className={input} placeholder="مثلاً ۷" /></Field>
            <Field label="توضیح تکلیف برای هنرجو" error={form.errors.description} wide><textarea rows={4} value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className={input} placeholder="چه چیزی از هنرجو خواسته شده است؟" /></Field>
        </div></section>
        <div className="flex justify-end"><Button type="submit" loading={form.processing}><Save className="size-4" /> ذخیره نهایی تکلیف</Button></div>
    </form>;
}
function Field({ label, error, wide, children }: { label: string; error?: string; wide?: boolean; children: ReactNode }) { return <div className={wide ? 'sm:col-span-2' : ''}><label className="mb-1.5 block text-xs font-black text-navy/70">{label}</label>{children}{error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}</div>; }
AssignmentForm.layout = (page: ReactNode) => <AdminLayout title="ساخت و ویرایش تکلیف">{page}</AdminLayout>;
