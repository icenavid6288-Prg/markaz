import { Link, usePage } from '@inertiajs/react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import BrandLogo from '@/Components/BrandLogo';
import type { PageProps } from '@/types';

interface CertificateData {
    id: number;
    certificate_number: string;
    issued_at: string;
    issued_at_text: string;
    user: { id: number | null; name: string | null };
    url: string;
    verify_url: string;
    course?: { id: number; title: string; slug: string; duration_minutes: number };
}

export default function Verify() {
    const { certificate } = usePage<PageProps & { certificate: CertificateData }>().props;

    return <div className="flex min-h-screen flex-col bg-soft-gray" dir="rtl">
        <header className="flex items-center justify-center gap-3 border-b border-navy/5 bg-white/80 py-5 backdrop-blur">
            <BrandLogo className="h-10 w-auto" />
            <div className="leading-tight"><div className="text-sm font-black text-navy">مرکز رشد و کارآفرینی دکتر بیدی</div><div className="text-[0.65rem] font-bold text-brand-600">سامانه استعلام گواهینامه</div></div>
        </header>
        <main className="flex flex-1 items-center justify-center p-4 py-10">
            <section className="w-full max-w-lg rounded-3xl border border-white/80 bg-white/85 p-7 text-center shadow-lift md:p-10">
                <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60"><BadgeCheck className="size-11 text-emerald-600" /></span>
                <h1 className="mt-6 text-xl font-black text-navy md:text-2xl">این گواهینامه معتبر است</h1>
                <p className="mt-2 text-xs font-bold text-navy/45">سند زیر توسط مرکز رشد و کارآفرینی دکتر بیدی صادر و در سامانه ثبت شده است.</p>

                <div className="mt-7 rounded-2xl border border-navy/10 bg-soft-gray/60 p-5 text-right">
                    <div className="grid grid-cols-[6rem_1fr] gap-y-3 text-sm">
                        <span className="text-xs font-bold text-navy/40">دارنده</span><strong className="text-sm font-black text-deep-green">{certificate.user?.name ?? '—'}</strong>
                        <span className="text-xs font-bold text-navy/40">دوره</span><strong className="text-sm font-black text-navy">{certificate.course?.title ?? '—'}</strong>
                        <span className="text-xs font-bold text-navy/40">تاریخ صدور</span><span className="text-sm font-bold text-navy/70">{certificate.issued_at_text}</span>
                        <span className="text-xs font-bold text-navy/40">شماره</span><span className="text-sm font-black tracking-wide text-navy" dir="ltr">{certificate.certificate_number}</span>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[0.68rem] font-bold text-navy/45"><ShieldCheck className="size-3.5 text-brand-600" /> استعلام آنلاین · {certificate.verify_url.replace(/^https?:\/\/[^/]+/, '')}</div>
                <Link href="/" className="mt-6 inline-block text-xs font-black text-brand-700 hover:underline">بازگشت به وب‌سایت مرکز</Link>
            </section>
        </main>
    </div>;
}

Verify.layout = (page: ReactNode) => page;
