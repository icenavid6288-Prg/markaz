import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Braces, ExternalLink, ImagePlus, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

interface PageField { label: string; type: string; value: string; icon?: string; }
interface SitePage { key: string; label: string; path: string; fields: Record<string, PageField>; }

type FieldValue = string | File | null;

const iconNames = 'Sparkles, Route, BookOpen, Boxes, GraduationCap, HeartHandshake, MessageCircle, Newspaper, Phone, ShoppingBag, Users, Compass, Target, Award, FlaskConical, Lightbulb, Rocket'.split(', ');

interface PricingModelRow { code: string; name: string; price: string; description: string; }

function parseModels(raw: string): PricingModelRow[] {
    if (!raw.trim()) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((row) => row && typeof row === 'object').map((row) => ({
            code: String(row.code ?? ''),
            name: String(row.name ?? ''),
            price: String(row.price ?? ''),
            description: String(row.description ?? ''),
        }));
    } catch {
        return [];
    }
}

function ModelsEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const rows = parseModels(value);
    const update = (index: number, patch: Partial<PricingModelRow>) => {
        onChange(JSON.stringify(rows.map((row, i) => (i === index ? { ...row, ...patch } : row))));
    };
    const remove = (index: number) => onChange(JSON.stringify(rows.filter((_, i) => i !== index)));
    const add = () => onChange(JSON.stringify([...rows, { code: '', name: '', price: '', description: '' }]));
    const inputCls = 'w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-xs text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
            {rows.length === 0 && <p className="text-xs font-bold text-navy/40">هنوز مدلی اضافه نشده؛ روی «افزودن مدل» بزنید.</p>}
            {rows.map((row, index) => (
                <div key={index} className="rounded-xl border border-brand-100 bg-white p-3">
                    <div className="grid gap-2 sm:grid-cols-[6.5rem_1fr_auto]">
                        <input value={row.code} onChange={(e) => update(index, { code: e.target.value })} placeholder="کد (CPC)" dir="ltr" className={`${inputCls} font-mono`} />
                        <input value={row.name} onChange={(e) => update(index, { name: e.target.value })} placeholder="نام فارسی مدل" className={inputCls} />
                        <button type="button" onClick={() => remove(index)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition-colors hover:bg-red-100" title="حذف مدل"><Trash2 className="size-3.5" /> حذف</button>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <input value={row.price} onChange={(e) => update(index, { price: e.target.value })} placeholder="قیمت یا شرایط (مثلاً «از ۱٬۵۰۰ تومان»)" className={inputCls} />
                        <input value={row.description} onChange={(e) => update(index, { description: e.target.value })} placeholder="توضیح کوتاه مدل" className={inputCls} />
                    </div>
                </div>
            ))}
            <button type="button" onClick={add} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-white/70 px-4 py-3 text-xs font-black text-brand-700 transition-colors hover:border-brand-300 hover:bg-white"><Plus className="size-4" /> افزودن مدل قیمت‌گذاری</button>
        </div>
    );
}

export default function SitePagesEdit() {
    const { page } = usePage<PageProps & { page: SitePage }>().props;
    const initial = useMemo(() => Object.fromEntries(Object.entries(page.fields).map(([key, field]) => [key, field.value ?? ''])), [page.fields]);
    const form = useForm<{ fields: Record<string, FieldValue>; _method: 'put' }>({ fields: initial, _method: 'put' });
    const setValue = (key: string, value: string) => form.setData('fields', { ...form.data.fields, [key]: value });
    const setImage = (key: string, file: File | null) => form.setData('fields', { ...form.data.fields, [key]: file });
    const clearImage = (key: string) => form.setData('fields', { ...form.data.fields, [key]: '' });
    // POST + `_method=put`: PHP's built-in dev server only parses multipart bodies on
    // POST, so a real PUT with a file upload would arrive with empty fields.
    const submit = (event: FormEvent) => { event.preventDefault(); form.post(`/admin/site-pages/${page.key}`, { preserveScroll: true }); };
    const inputCls = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
    // Remount the form after a successful save so the (single-mount) useForm state
    // picks up the freshly saved values instead of keeping a stale file/badge.
    const contentKey = page.key + ':' + Object.values(page.fields).map((field) => field.value).join('|');

    return <form key={contentKey} onSubmit={submit} className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/admin/site-pages" className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به فهرست صفحات</Link><div className="flex items-center gap-2"><a href={page.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-white px-4 py-3 text-xs font-black text-navy/60 hover:border-brand-200 hover:text-brand-700">پیش‌نمایش <ExternalLink className="size-3.5" /></a><Button type="submit" loading={form.processing}><Save className="size-4" /> ذخیره صفحه</Button></div></div>
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8"><div className="pointer-events-none absolute -left-12 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" aria-hidden /><div className="relative"><div className="flex items-center gap-2 text-xs font-black text-brand-200"><Sparkles className="size-4" /> استودیو صفحات سایت</div><h1 className="mt-3 text-2xl font-black md:text-3xl">ویرایش {page.label}</h1><p className="mt-2 text-sm text-white/65">هر متن، آیکون یا تصویر را تغییر دهید و ذخیره کنید؛ صفحه عمومی بلافاصله از مقدار جدید استفاده می‌کند.</p></div></section>
        {Object.keys(form.errors).length > 0 && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">لطفاً خطاهای فرم را بررسی کنید.</div>}
        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5"><div className="mb-6 flex items-center justify-between gap-3 border-b border-navy/5 pb-4"><div><h2 className="text-base font-black text-navy">محتوای قابل نمایش صفحه</h2><p className="mt-1 text-xs text-navy/45" dir="ltr">{page.path}</p></div><span className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-black text-brand-700">{Object.keys(page.fields).length} فیلد</span></div><div className="grid gap-5 sm:grid-cols-2">{Object.entries(page.fields).map(([key, field]) => { const wide = field.type === 'textarea'; const isIcon = field.type === 'icon'; const isImage = field.type === 'image'; const isVideo = field.type === 'video'; const isModels = field.type === 'models'; const raw = form.data.fields[key]; const currentImage = isImage && typeof raw === 'string' && raw ? raw : undefined; const hasNewImage = isImage && raw instanceof File; const hasImage = Boolean(currentImage || hasNewImage); return <div key={key} className={wide ? 'sm:col-span-2' : ''}><div className="mb-1.5 flex items-center justify-between gap-2"><label htmlFor={key} className="text-xs font-black text-navy/70">{field.label}</label><span className="text-[0.62rem] font-bold text-navy/30" dir="ltr">{key}</span></div>{isImage ? <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4"><div className="flex items-center gap-4">{currentImage ? <img src={currentImage} alt={field.label} className="h-24 w-40 shrink-0 rounded-xl border border-brand-100 bg-white object-cover" /> : <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-white text-navy/25"><ImagePlus className="size-8" /></div>}<div className="flex flex-1 flex-col gap-2"><input id={key} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setImage(key, e.target.files?.[0] ?? null)} className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs text-navy file:ml-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-xs file:font-black file:text-brand-800" />{hasNewImage ? <span className="inline-flex w-fit items-center rounded-lg bg-brand-100 px-2.5 py-1 text-[0.68rem] font-black text-brand-800">تصویر جدید انتخاب شد</span> : <span className="text-[0.68rem] leading-5 text-navy/40">پس از ذخیره، تصویر جدید جایگزین قبلی می‌شود؛ PNG، JPG یا WEBP.</span>}{hasImage && <button type="button" onClick={() => clearImage(key)} className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-[0.68rem] font-black text-red-600 transition-colors hover:bg-red-100"><Trash2 className="size-3.5" /> حذف تصویر</button>}                            </div></div></div> : isModels ? <ModelsEditor value={typeof raw === 'string' ? raw : ''} onChange={(value) => setValue(key, value)} /> : isVideo ? <><input id={key} type="text" dir="ltr" value={typeof raw === 'string' ? raw : ''} onChange={(e) => setValue(key, e.target.value)} className={`${inputCls} font-mono`} placeholder="https://youtube.com/watch?v=…" /><p className="mt-1.5 text-[0.68rem] leading-5 text-navy/40">لینک ویدیو؛ یوتیوب، ویمیو یا فایل MP4/WebM. اگر ویدیو خالی باشد، تصویر همان بخش نمایش داده می‌شود.</p></> : isIcon ? <><input id={key} list="lucide-icon-names" value={typeof raw === 'string' ? raw : ''} onChange={(e) => setValue(key, e.target.value)} className={`${inputCls} font-mono`} placeholder="Sparkles" dir="ltr" /><datalist id="lucide-icon-names">{iconNames.map((name) => <option key={name} value={name} />)}</datalist><p className="mt-1.5 text-[0.68rem] leading-5 text-navy/40">نام آیکون Lucide را وارد کنید؛ مثلاً Sparkles، Route یا Phone.</p></> : wide ? <textarea id={key} rows={5} value={typeof raw === 'string' ? raw : ''} onChange={(e) => setValue(key, e.target.value)} className={inputCls} /> : <input id={key} type="text" value={typeof raw === 'string' ? raw : ''} onChange={(e) => setValue(key, e.target.value)} className={inputCls} />}{form.errors[`fields.${key}`] && <p className="mt-1 text-xs font-bold text-red-600">{form.errors[`fields.${key}`]}</p>}</div>; })}</div></section>
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5"><div className="flex items-start gap-3"><Braces className="mt-0.5 size-5 shrink-0 text-blue-700" /><div><h2 className="text-sm font-black text-blue-900">ویرایش محتوای پیشرفته</h2><p className="mt-1 text-xs leading-6 text-blue-900/70">برای متن‌های فهرستی، دوره‌ها، خدمات، محصولات و مقاله‌ها از بخش «استودیو محتوا» در منوی پنل استفاده کنید. این صفحه برای متن‌های ثابت و هویت بصری هر صفحه طراحی شده است.</p></div></div></section>
        <div className="flex justify-end"><Button type="submit" loading={form.processing}><Save className="size-4" /> ذخیره تغییرات</Button></div>
    </form>;
}

SitePagesEdit.layout = (page: ReactNode) => <AdminLayout title="ویرایش صفحه سایت">{page}</AdminLayout>;
