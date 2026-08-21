import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Braces, Save } from 'lucide-react';
import { useMemo, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import ImageCropField from '@/Components/ImageCropField';
import { SeoGuide } from '@/Components/SeoGuide';
import type { PageProps } from '@/types';

interface Field { name: string; label: string; type: string; wide?: boolean; required?: boolean; options?: Record<string, string>; help?: string; accept?: string; }
interface Item { id: number; [key: string]: unknown; }
type FormValue = string | number | boolean | File | null;

function initialValue(field: Field, item: Item | null): string | number | boolean {
    const value = item?.[field.name];
    if (field.type === 'boolean') return value === undefined || value === null ? ['is_active', 'is_approved'].includes(field.name) : Boolean(value);
    if (value === null || value === undefined) return field.type === 'number' ? 0 : '';
    if (field.type === 'lines' && Array.isArray(value)) return value.join('\n');
    if (field.type === 'json' && typeof value === 'object') return JSON.stringify(value, null, 2);
    if (field.type === 'datetime' && typeof value === 'string') return value.replace(' ', 'T').slice(0, 16);
    return value as string | number;
}

export default function ContentForm() {
    const { resource, resourceTitle, singularTitle, fields, item } = usePage<PageProps & {
        resource: string; resourceTitle: string; singularTitle: string; fields: Field[]; item: Item | null;
    }>().props;
    const isEdit = item !== null;
    const initial = useMemo(() => fields.reduce<Record<string, FormValue>>((values, field) => { values[field.name] = initialValue(field, item); return values; }, {}), [fields, item]);
    const form = useForm<Record<string, FormValue>>(initial);
    const inputCls = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

    const setValue = (name: string, value: FormValue) => form.setData(name, value);

    const isProduct = resource === 'products';
    const metaTitle = form.data.meta_title ?? '';
    const metaDescription = form.data.meta_description ?? '';
    const generateSeo = () => {
        if (!isProduct) return;
        const title = String(form.data.title ?? '').trim();
        const description = String(form.data.description ?? '').replace(/\s+/g, ' ').trim();
        setValue('meta_title', title.slice(0, 70));
        setValue('meta_description', (description || title).slice(0, 170));
        setValue('meta_keywords', title.slice(0, 120));
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (isEdit) {
            // POST + _method keeps PDF uploads compatible with PHP multipart parsing.
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/content/${resource}/${item.id}`, { forceFormData: true });
        } else {
            form.post(`/admin/content/${resource}`, { forceFormData: true });
        }
    };

    return <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href={`/admin/content/${resource}`} className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به {resourceTitle}</Link><Button type="submit" loading={form.processing}><Save className="size-4" /> {isEdit ? 'ذخیره تغییرات' : `ایجاد ${singularTitle}`}</Button></div>
        {Object.keys(form.errors).length > 0 && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-200">لطفاً خطاهای فرم را بررسی کنید.</div>}
        <section className="rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift"><div className="text-xs font-black text-brand-200">استودیو محتوا / {resource}</div><h1 className="mt-2 text-2xl font-black">{isEdit ? `ویرایش ${singularTitle}` : `ایجاد ${singularTitle} جدید`}</h1><p className="mt-2 text-sm text-white/60">هر تغییری که ذخیره می‌کنید در داده‌های واقعی سایت ثبت می‌شود.</p></section>
        {isProduct && <SeoGuide titleValue={String(metaTitle)} descriptionValue={String(metaDescription)} onGenerate={generateSeo} />}
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="grid gap-5 sm:grid-cols-2">{fields.map((field) => {
            const value = form.data[field.name];
            const error = form.errors[field.name];
            const wide = field.wide || field.type === 'textarea' || field.type === 'json' || field.type === 'lines' || field.type === 'file';
            return <div key={field.name} className={wide ? 'sm:col-span-2' : ''}>
                <label htmlFor={field.name} className="mb-1.5 block text-xs font-black text-navy/70">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                {field.type === 'boolean' ? <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-navy/10 bg-soft-gray/50 px-4 text-sm font-bold text-navy/70"><input id={field.name} type="checkbox" checked={Boolean(value)} onChange={(e) => setValue(field.name, e.target.checked)} className="size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500" />{field.label}</label>
                : field.type === 'select' ? <select id={field.name} value={String(value ?? '')} onChange={(e) => setValue(field.name, e.target.value)} className={inputCls}><option value="">انتخاب کنید</option>{Object.entries(field.options ?? {}).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                : field.type === 'image' ? <ImageCropField label={field.label} value={value instanceof File || typeof value === 'string' ? value : null} help={field.help} error={error} onChange={(file) => setValue(field.name, file === null ? '' : file)} />
                : field.type === 'file' ? <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4"><input id={field.name} type="file" accept={field.accept} onChange={(e) => setValue(field.name, e.target.files?.[0] ?? null)} className={`${inputCls} file:ml-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-xs file:font-black file:text-brand-800`} />{value instanceof File ? <p className="mt-2 text-xs font-black text-brand-700">فایل جدید انتخاب شد: {value.name}</p> : null}{field.help && <p className="mt-2 text-[0.68rem] leading-5 text-navy/45">{field.help}</p>}</div>
                : field.type === 'textarea' || field.type === 'lines' || field.type === 'json' ? <div className="relative"><textarea id={field.name} rows={field.type === 'json' ? 12 : field.type === 'lines' ? 6 : 7} value={String(value ?? '')} onChange={(e) => setValue(field.name, e.target.value)} className={`${inputCls} ${field.type === 'json' ? 'font-mono text-xs' : ''}`} placeholder={field.type === 'json' ? '{\n  "title": "..."\n}' : undefined} />{field.type === 'json' && <Braces className="pointer-events-none absolute left-3 top-3 size-4 text-navy/25" />}</div>
                : <input id={field.name} type={field.type === 'number' ? 'number' : field.type === 'datetime' ? 'datetime-local' : 'text'} dir={['slug', 'image', 'link', 'url', 'phone', 'isbn'].some((part) => field.name.includes(part)) ? 'ltr' : undefined} value={String(value ?? '')} onChange={(e) => setValue(field.name, field.type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value)} className={inputCls} />}
                {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}
            </div>;
        })}</div></section>
        <div className="flex justify-end"><Button type="submit" loading={form.processing}><Save className="size-4" /> {isEdit ? 'ذخیره تغییرات' : 'ثبت در دیتابیس'}</Button></div>
    </form>;
}

ContentForm.layout = (page: ReactNode) => <AdminLayout title="فرم مدیریت محتوا">{page}</AdminLayout>;
