import { Link, router, usePage } from '@inertiajs/react';
import { Edit3, Plus, Search, Trash2, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface Field { name: string; label: string; type: string; wide?: boolean; options?: Record<string, string>; }
interface FilterField { name: string; label: string; options: Record<string, string>; }
interface Item { id: number; [key: string]: unknown; }
interface Paginator { data: Item[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }

const labels: Record<string, Record<string, string>> = {
    status: { draft: 'پیش‌نویس', published: 'منتشرشده', archived: 'بایگانی', pending: 'در انتظار', paid: 'پرداخت موفق', failed: 'ناموفق', open: 'باز', answered: 'پاسخ داده‌شده', closed: 'بسته', new: 'جدید', contacted: 'تماس گرفته‌شده', interested: 'علاقه‌مند', consultation: 'مشاوره', registered: 'ثبت‌نام‌کرده', customer: 'مشتری' },
    type: { book: 'کتاب', podcast: 'پادکست', digital: 'دیجیتال', physical: 'فیزیکی', course: 'دوره', product: 'محصول', blog: 'بلاگ', service: 'خدمت' },
    role: { parent: 'والد', student: 'نوجوان', instructor: 'مدرس', coach: 'کوچ', team: 'بقیه تیم', partner: 'همکار' },
};

function valueText(field: Field, value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (field.type === 'boolean') return value ? 'فعال' : 'خاموش';
    if (field.options && String(value) in field.options) return field.options[String(value)];
    if (labels[field.name]?.[String(value)]) return labels[field.name][String(value)];
    if (Array.isArray(value)) return value.join('، ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

// وضعیت نمایش در سایت از کلیدِ فعال‌بودنِ واقعی خوانده می‌شود، نه از هر بولینِ دلخواه
// (مثل is_featured یا is_free که به معنای غیرفعال‌بودن نیستند).
function isInactive(item: Item): boolean {
    for (const key of ['is_active', 'is_approved', 'is_published']) {
        if (key in item) return item[key] === false;
    }
    return false;
}

export default function ContentIndex() {
    const { resource, resourceTitle, singularTitle, fields, items, filters, filterFields, canCreate, canUpdate, canDelete } = usePage<PageProps & {
        resource: string; resourceTitle: string; singularTitle: string; fields: Field[]; items: Paginator;
        filters: { search?: string; [key: string]: string | undefined }; filterFields: FilterField[];
        canCreate: boolean; canUpdate: boolean; canDelete: boolean;
    }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [selects, setSelects] = useState<Record<string, string>>(() => Object.fromEntries(filterFields.map((field) => [field.name, filters[field.name] ?? ''])));
    const columns = fields.filter((field) => field.type !== 'image' && !['description', 'body', 'sections', 'seo', 'features', 'process', 'target_audience', 'outcomes', 'faqs', 'notes'].includes(field.name)).slice(0, 6);
    const primary = fields.find((field) => ['title', 'name', 'subject', 'order_number'].includes(field.name)) ?? fields[0];

    const apply = () => router.get(`/admin/content/${resource}`, { search, ...selects }, { preserveState: true, replace: true });
    const destroy = (item: Item) => {
        if (confirm(`آیا از حذف این ${singularTitle} مطمئن هستید؟`)) router.delete(`/admin/content/${resource}/${item.id}`);
    };

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-12 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div><div className="mb-2 text-xs font-black text-brand-200">استودیو مدیریت محتوا / {resource}</div><h1 className="text-2xl font-black md:text-3xl">{resourceTitle}</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">تمام داده‌های این بخش مستقیماً از دیتابیس مدیریت می‌شوند و تغییرات در سایت عمومی قابل مشاهده است.</p></div>
                {canCreate && <Link href={`/admin/content/${resource}/create`} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-deep-green shadow-soft hover:bg-brand-100"><Plus className="size-4" /> ایجاد {singularTitle}</Link>}
            </div>
        </section>
        <section className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl lg:flex-row lg:items-center">
            <div className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder={`جستجو در ${resourceTitle}...`} className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></div>
            {filterFields.map((field) => <select key={field.name} value={selects[field.name] ?? ''} onChange={(e) => { const next = { ...selects, [field.name]: e.target.value }; setSelects(next); router.get(`/admin/content/${resource}`, { search, ...next }, { preserveState: true, replace: true }); }} className="rounded-xl border border-navy/10 bg-white px-3 py-3 text-sm font-bold text-navy/70 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" aria-label={field.label}><option value="">همه {field.label}</option>{Object.entries(field.options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>)}
            <button type="button" onClick={apply} className="rounded-xl bg-deep-green px-5 py-3 text-sm font-black text-white hover:bg-brand-700">اعمال جستجو</button>
        </section>
        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4"><div className="text-sm font-black text-navy">فهرست {resourceTitle}</div><div className="text-xs font-bold text-navy/40">{items.total} رکورد</div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-right"><thead className="border-b border-navy/5 bg-soft-gray/60 text-xs font-black text-navy/45"><tr>{columns.map((field) => <th key={field.name} className="px-5 py-4">{field.label}</th>)}<th className="px-5 py-4">وضعیت</th><th className="px-5 py-4">عملیات</th></tr></thead><tbody>
                {items.data.map((item) => <tr key={item.id} className="border-b border-navy/5 last:border-0 hover:bg-soft-gray/40">{columns.map((field, index) => <td key={field.name} className="max-w-[18rem] truncate px-5 py-4 text-sm font-bold text-navy/65">{index === 0 ? <><strong className="block truncate text-navy">{valueText(field, item[field.name])}</strong><span className="text-[0.65rem] text-navy/35">شناسه #{item.id}</span></> : valueText(field, item[field.name])}</td>)}<td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.68rem] font-black ${isInactive(item) ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{isInactive(item) ? <EyeOff className="size-3" /> : <Eye className="size-3" />} {isInactive(item) ? 'غیرفعال' : 'فعال'}</span></td><td className="px-5 py-4"><div className="flex items-center gap-1.5">{resource === 'tickets' && <Link href={`/admin/content/tickets/${item.id}`} className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100" aria-label="پاسخ به تیکت" title="مشاهده گفتگو و پاسخ"><MessageSquare className="size-3.5" /></Link>}{canUpdate && <Link href={`/admin/content/${resource}/${item.id}/edit`} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-100 hover:text-brand-700" aria-label="ویرایش"><Edit3 className="size-3.5" /></Link>}{canDelete && <button type="button" onClick={() => destroy(item)} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><Trash2 className="size-3.5" /></button>}</div></td></tr>)}
                {items.data.length === 0 && <tr><td colSpan={columns.length + 2} className="px-5 py-16 text-center text-sm font-bold text-navy/40">هنوز رکوردی در این بخش ثبت نشده است.</td></tr>}
            </tbody></table></div>
            {items.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">{items.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
    </div>;
}

ContentIndex.layout = (page: ReactNode) => <AdminLayout title="استودیو محتوا">{page}</AdminLayout>;
