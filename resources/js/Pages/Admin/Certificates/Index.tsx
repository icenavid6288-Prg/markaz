import { router, usePage } from '@inertiajs/react';
import { Award, Download, Printer, Search, ShieldCheck } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface CertificateRow { id: number; certificate_number: string; issued_at: string; user: { id: number; name: string; email: string } | null; course: { id: number; title: string } | null; url: string; download_url: string; }
interface Paginator { data: CertificateRow[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }

export default function CertificatesIndex() {
    const { certificates, filters } = usePage<PageProps & { certificates: Paginator; filters: { search?: string } }>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = () => router.get('/admin/certificates', { search }, { preserveState: true, replace: true });

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-12 -top-20 size-64 rounded-full bg-gold/25 blur-3xl" />
            <div className="relative"><div className="mb-2 flex items-center gap-2 text-xs font-black text-brand-200"><Award className="size-4" /> دستاوردها</div><h1 className="text-2xl font-black md:text-3xl">گواهینامه‌های صادرشده</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">به محض تکمیل کامل یک دوره توسط هنرجو، گواهینامه به‌صورت خودکار صادر و شماره‌اش در اینجا ثبت می‌شود.</p></div>
        </section>
        <section className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur-xl sm:flex-row">
            <div className="relative flex-1"><Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy/35" /><input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="جستجو در شماره گواهینامه، نام هنرجو یا دوره..." className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></div><button type="button" onClick={apply} className="rounded-xl bg-deep-green px-5 py-3 text-sm font-black text-white hover:bg-brand-700">اعمال جستجو</button>
        </section>
        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4"><div className="text-sm font-black text-navy">فهرست گواهینامه‌ها</div><div className="text-xs font-bold text-navy/40">{certificates.total} گواهینامه</div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-right"><thead className="border-b border-navy/5 bg-soft-gray/60 text-xs font-black text-navy/45"><tr><th className="px-5 py-4">شماره گواهینامه</th><th className="px-5 py-4">هنرجو</th><th className="px-5 py-4">دوره</th><th className="px-5 py-4">تاریخ صدور</th><th className="px-5 py-4">عملیات</th></tr></thead><tbody>
                {certificates.data.map((certificate) => <tr key={certificate.id} className="border-b border-navy/5 last:border-0 hover:bg-soft-gray/40">
                    <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[0.7rem] font-black tracking-wide text-deep-green" dir="ltr"><ShieldCheck className="size-3.5" /> {certificate.certificate_number}</span></td>
                    <td className="px-5 py-4"><strong className="block text-sm text-navy">{certificate.user?.name ?? '—'}</strong><span className="text-[0.65rem] text-navy/35" dir="ltr">{certificate.user?.email ?? ''}</span></td>
                    <td className="max-w-[18rem] px-5 py-4"><span className="block truncate text-xs font-bold text-navy/55">{certificate.course?.title ?? '—'}</span></td>
                    <td className="px-5 py-4 text-xs font-bold text-navy/50">{certificate.issued_at}</td>
                    <td className="px-5 py-4"><div className="flex items-center gap-1.5"><a href={certificate.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-[0.68rem] font-black text-brand-700 hover:bg-brand-100"><Printer className="size-3.5" /> مشاهده / چاپ</a><a href={certificate.download_url} className="inline-flex items-center gap-1.5 rounded-lg bg-soft-gray px-3 py-2 text-[0.68rem] font-black text-navy/60 hover:bg-brand-100 hover:text-brand-700"><Download className="size-3.5" /> PDF</a></div></td>
                </tr>)}
                {certificates.data.length === 0 && <tr><td colSpan={5} className="px-5 py-16 text-center text-sm font-bold text-navy/40">هنوز گواهینامه‌ای صادر نشده است. با تکمیل دوره‌ها توسط هنرجویان، این فهرست پر می‌شود.</td></tr>}
            </tbody></table></div>
            {certificates.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">{certificates.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
    </div>;
}

CertificatesIndex.layout = (page: ReactNode) => <AdminLayout title="گواهینامه‌های صادرشده">{page}</AdminLayout>;
