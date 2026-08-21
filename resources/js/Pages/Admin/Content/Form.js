import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Braces, Save } from 'lucide-react';
import { useMemo } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import ImageCropField from '@/Components/ImageCropField';
import { SeoGuide } from '@/Components/SeoGuide';
function initialValue(field, item) {
    const value = item?.[field.name];
    if (field.type === 'boolean')
        return value === undefined || value === null ? ['is_active', 'is_approved'].includes(field.name) : Boolean(value);
    if (value === null || value === undefined)
        return field.type === 'number' ? 0 : '';
    if (field.type === 'lines' && Array.isArray(value))
        return value.join('\n');
    if (field.type === 'json' && typeof value === 'object')
        return JSON.stringify(value, null, 2);
    if (field.type === 'datetime' && typeof value === 'string')
        return value.replace(' ', 'T').slice(0, 16);
    return value;
}
export default function ContentForm() {
    const { resource, resourceTitle, singularTitle, fields, item } = usePage().props;
    const isEdit = item !== null;
    const initial = useMemo(() => fields.reduce((values, field) => { values[field.name] = initialValue(field, item); return values; }, {}), [fields, item]);
    const form = useForm(initial);
    const inputCls = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
    const setValue = (name, value) => form.setData(name, value);
    const isProduct = resource === 'products';
    const metaTitle = form.data.meta_title ?? '';
    const metaDescription = form.data.meta_description ?? '';
    const generateSeo = () => {
        if (!isProduct)
            return;
        const title = String(form.data.title ?? '').trim();
        const description = String(form.data.description ?? '').replace(/\s+/g, ' ').trim();
        setValue('meta_title', title.slice(0, 70));
        setValue('meta_description', (description || title).slice(0, 170));
        setValue('meta_keywords', title.slice(0, 120));
    };
    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            // POST + _method keeps PDF uploads compatible with PHP multipart parsing.
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(`/admin/content/${resource}/${item.id}`, { forceFormData: true });
        }
        else {
            form.post(`/admin/content/${resource}`, { forceFormData: true });
        }
    };
    return _jsxs("form", { onSubmit: submit, className: "flex flex-col gap-6", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs(Link, { href: `/admin/content/${resource}`, className: "inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700", children: [_jsx(ArrowRight, { className: "size-4" }), " \u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 ", resourceTitle] }), _jsxs(Button, { type: "submit", loading: form.processing, children: [_jsx(Save, { className: "size-4" }), " ", isEdit ? 'ذخیره تغییرات' : `ایجاد ${singularTitle}`] })] }), Object.keys(form.errors).length > 0 && _jsx("div", { className: "rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-200", children: "\u0644\u0637\u0641\u0627\u064B \u062E\u0637\u0627\u0647\u0627\u06CC \u0641\u0631\u0645 \u0631\u0627 \u0628\u0631\u0631\u0633\u06CC \u06A9\u0646\u06CC\u062F." }), _jsxs("section", { className: "rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift", children: [_jsxs("div", { className: "text-xs font-black text-brand-200", children: ["\u0627\u0633\u062A\u0648\u062F\u06CC\u0648 \u0645\u062D\u062A\u0648\u0627 / ", resource] }), _jsx("h1", { className: "mt-2 text-2xl font-black", children: isEdit ? `ویرایش ${singularTitle}` : `ایجاد ${singularTitle} جدید` }), _jsx("p", { className: "mt-2 text-sm text-white/60", children: "\u0647\u0631 \u062A\u063A\u06CC\u06CC\u0631\u06CC \u06A9\u0647 \u0630\u062E\u06CC\u0631\u0647 \u0645\u06CC\u200C\u06A9\u0646\u06CC\u062F \u062F\u0631 \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u0648\u0627\u0642\u0639\u06CC \u0633\u0627\u06CC\u062A \u062B\u0628\u062A \u0645\u06CC\u200C\u0634\u0648\u062F." })] }), isProduct && _jsx(SeoGuide, { titleValue: String(metaTitle), descriptionValue: String(metaDescription), onGenerate: generateSeo }), _jsx("section", { className: "rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5", children: _jsx("div", { className: "grid gap-5 sm:grid-cols-2", children: fields.map((field) => {
                        const value = form.data[field.name];
                        const error = form.errors[field.name];
                        const wide = field.wide || field.type === 'textarea' || field.type === 'json' || field.type === 'lines' || field.type === 'file';
                        return _jsxs("div", { className: wide ? 'sm:col-span-2' : '', children: [_jsxs("label", { htmlFor: field.name, className: "mb-1.5 block text-xs font-black text-navy/70", children: [field.label, " ", field.required && _jsx("span", { className: "text-red-500", children: "*" })] }), field.type === 'boolean' ? _jsxs("label", { className: "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-navy/10 bg-soft-gray/50 px-4 text-sm font-bold text-navy/70", children: [_jsx("input", { id: field.name, type: "checkbox", checked: Boolean(value), onChange: (e) => setValue(field.name, e.target.checked), className: "size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500" }), field.label] })
                                    : field.type === 'select' ? _jsxs("select", { id: field.name, value: String(value ?? ''), onChange: (e) => setValue(field.name, e.target.value), className: inputCls, children: [_jsx("option", { value: "", children: "\u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F" }), Object.entries(field.options ?? {}).map(([key, label]) => _jsx("option", { value: key, children: label }, key))] })
                                        : field.type === 'image' ? _jsx(ImageCropField, { label: field.label, value: value instanceof File || typeof value === 'string' ? value : null, help: field.help, error: error, onChange: (file) => setValue(field.name, file === null ? '' : file) })
                                            : field.type === 'file' ? _jsxs("div", { className: "rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4", children: [_jsx("input", { id: field.name, type: "file", accept: field.accept, onChange: (e) => setValue(field.name, e.target.files?.[0] ?? null), className: `${inputCls} file:ml-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-xs file:font-black file:text-brand-800` }), value instanceof File ? _jsxs("p", { className: "mt-2 text-xs font-black text-brand-700", children: ["\u0641\u0627\u06CC\u0644 \u062C\u062F\u06CC\u062F \u0627\u0646\u062A\u062E\u0627\u0628 \u0634\u062F: ", value.name] }) : null, field.help && _jsx("p", { className: "mt-2 text-[0.68rem] leading-5 text-navy/45", children: field.help })] })
                                                : field.type === 'textarea' || field.type === 'lines' || field.type === 'json' ? _jsxs("div", { className: "relative", children: [_jsx("textarea", { id: field.name, rows: field.type === 'json' ? 12 : field.type === 'lines' ? 6 : 7, value: String(value ?? ''), onChange: (e) => setValue(field.name, e.target.value), className: `${inputCls} ${field.type === 'json' ? 'font-mono text-xs' : ''}`, placeholder: field.type === 'json' ? '{\n  "title": "..."\n}' : undefined }), field.type === 'json' && _jsx(Braces, { className: "pointer-events-none absolute left-3 top-3 size-4 text-navy/25" })] })
                                                    : _jsx("input", { id: field.name, type: field.type === 'number' ? 'number' : field.type === 'datetime' ? 'datetime-local' : 'text', dir: ['slug', 'image', 'link', 'url', 'phone', 'isbn'].some((part) => field.name.includes(part)) ? 'ltr' : undefined, value: String(value ?? ''), onChange: (e) => setValue(field.name, field.type === 'number' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value), className: inputCls }), error && _jsx("p", { className: "mt-1 text-xs font-bold text-red-600", children: error })] }, field.name);
                    }) }) }), _jsx("div", { className: "flex justify-end", children: _jsxs(Button, { type: "submit", loading: form.processing, children: [_jsx(Save, { className: "size-4" }), " ", isEdit ? 'ذخیره تغییرات' : 'ثبت در دیتابیس'] }) })] });
}
ContentForm.layout = (page) => _jsx(AdminLayout, { title: "\u0641\u0631\u0645 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0645\u062D\u062A\u0648\u0627", children: page });
