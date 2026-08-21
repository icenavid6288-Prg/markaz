import { router, useForm, usePage } from '@inertiajs/react';
import { ImagePlus, Replace, Search, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface Version { id: number; version: number; file_name: string; url_path: string; size: number; updated_at?: string | null }
interface Item {
    id: number; name: string; file_name: string; url_path: string; type: string; mime_type?: string | null;
    size: number; folder?: string | null; alt?: string | null; collection: string; version: number;
    uploader?: string | null; updated_at?: string | null; versions: Version[];
}
interface Paginator { data: Item[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number }

const typeLabels: Record<string, string> = { image: 'تصویر', video: 'ویدیو', audio: 'صوت', document: 'سند' };

export default function MediaIndex() {
    const { items, filters, canCreate, canUpdate, canDelete } = usePage<PageProps & {
        items: Paginator; filters: { search?: string; type?: string }; canCreate: boolean; canUpdate: boolean; canDelete: boolean;
    }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? '');
    const upload = useForm({ file: null as File | null, name: '', alt: '', folder: 'library' });

    const apply = () => router.get('/admin/media', { search, type }, { preserveState: true, replace: true });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        upload.post('/admin/media', { forceFormData: true, preserveScroll: true, onSuccess: () => upload.reset() });
    };
    const replace = (id: number, file: File) => {
        router.post(`/admin/media/${id}/replace`, { file }, { forceFormData: true, preserveScroll: true });
    };

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="relative">
                <div className="mb-2 text-xs font-black text-brand-200">کتابخانه رسانه</div>
                <h1 className="text-2xl font-black md:text-3xl">آپلود، نسخه‌بندی و جایگزینی فایل</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">شناسه رسانه بعد از جایگزینی ثابت می‌ماند تا لینک‌های استفاده‌شده در سایت نشکند. نسخه‌های قبلی در تاریخچه نگه داشته می‌شوند.</p>
            </div>
        </section>

        {canCreate && <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft md:grid-cols-[1fr_1fr_auto]">
            <input type="text" value={upload.data.name} onChange={(event) => upload.setData('name', event.target.value)} placeholder="نام نمایشی (اختیاری)" className="rounded-xl border border-navy/10 px-3 py-2 text-sm" />
            <input type="text" value={upload.data.alt} onChange={(event) => upload.setData('alt', event.target.value)} placeholder="متن جایگزین" className="rounded-xl border border-navy/10 px-3 py-2 text-sm" />
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-black text-white">
                <ImagePlus className="size-4" /> انتخاب فایل
                <input type="file" className="hidden" onChange={(event) => upload.setData('file', event.target.files?.[0] ?? null)} />
            </label>
            <button type="submit" disabled={upload.processing || !upload.data.file} className="rounded-xl bg-navy px-4 py-2 text-sm font-black text-white disabled:opacity-50 md:col-span-3">آپلود در کتابخانه</button>
        </form>}

        <section className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft lg:flex-row">
            <div className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && apply()} placeholder="جستجو در نام یا فایل..." className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-3 pr-10 text-sm" /></div>
            <select value={type} onChange={(event) => { setType(event.target.value); router.get('/admin/media', { search, type: event.target.value }, { preserveState: true, replace: true }); }} className="rounded-xl border border-navy/10 bg-white px-3 py-3 text-sm font-bold">
                <option value="">همه انواع</option>
                {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button type="button" onClick={apply} className="rounded-xl bg-deep-green px-5 py-3 text-sm font-black text-white">اعمال</button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.data.map((item) => (
                <article key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-soft">
                    <div className="flex h-40 items-center justify-center bg-soft-gray">
                        {item.type === 'image' ? <img src={item.url_path} alt={item.alt || item.name} className="h-full w-full object-cover" /> : <span className="text-xs font-black text-navy/40">{typeLabels[item.type] ?? item.type}</span>}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="truncate text-sm font-black text-navy">{item.name}</h3>
                        <p className="text-[0.7rem] text-navy/45">نسخه {item.version} · {Math.round(item.size / 1024)} کیلوبایت · {item.uploader ?? '—'}</p>
                        <code className="truncate rounded-lg bg-soft-gray px-2 py-1 text-[0.65rem] text-navy/60">{item.url_path}</code>
                        <div className="mt-auto flex flex-wrap gap-2">
                            {canUpdate && <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[0.65rem] font-black text-brand-700">
                                <Replace className="size-3.5" /> جایگزینی
                                <input type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) replace(item.id, file); }} />
                            </label>}
                            {canDelete && <button type="button" onClick={() => confirm('رسانه و همه نسخه‌ها حذف شود؟') && router.delete(`/admin/media/${item.id}`)} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[0.65rem] font-black text-red-600"><Trash2 className="size-3.5" /> حذف</button>}
                        </div>
                        {item.versions.length > 0 && <ul className="mt-2 space-y-1 border-t border-navy/5 pt-2 text-[0.65rem] text-navy/50">
                            {item.versions.map((version) => <li key={version.id}>نسخه {version.version}: {version.file_name}</li>)}
                        </ul>}
                    </div>
                </article>
            ))}
            {items.data.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-brand-200 p-12 text-center text-sm font-bold text-navy/40">هنوز رسانه‌ای آپلود نشده است.</div>}
        </section>
    </div>;
}

MediaIndex.layout = (page: ReactNode) => <AdminLayout title="کتابخانه رسانه">{page}</AdminLayout>;
