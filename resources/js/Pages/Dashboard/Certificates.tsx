import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Award, BookOpen, Download, Printer, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatNumber } from '@/lib/format';
import type { PageProps } from '@/types';

interface Certificate {
    id: number;
    certificate_number: string;
    issued_at: string;
    course: { id: number; title: string } | null;
    url: string;
    download_url: string;
}

export default function DashboardCertificates() {
    const { certificates } = usePage<PageProps & { certificates: Certificate[] }>().props;

    return <UserDashboardLayout>
        <div className="mx-auto flex max-w-7xl flex-col gap-7">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div><span className="dashboard-eyebrow"><span /> دستاوردها</span><h2 className="mt-2 text-2xl font-black text-navy">گواهینامه‌های من</h2><p className="mt-2 text-sm leading-7 text-navy/50">با تکمیل کامل هر دوره، گواهینامه پایان دوره به‌صورت خودکار برایتان صادر می‌شود.</p></div>
                <Link href="/courses" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-black text-white shadow-glow hover:bg-brand-600">کشف دوره جدید <ArrowLeft className="size-4" /></Link>
            </header>

            <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
                <div className="pointer-events-none absolute -left-12 -top-20 size-64 rounded-full bg-gold/25 blur-3xl" aria-hidden />
                <div className="relative flex flex-wrap items-center justify-between gap-5">
                    <div className="flex items-center gap-4"><span className="flex size-14 items-center justify-center rounded-2xl bg-gold/90 text-white shadow-glow"><Award className="size-7" /></span><div><h3 className="text-lg font-black">افتخار شما، گواهی ماست</h3><p className="mt-1 text-sm leading-6 text-white/60">{formatNumber(certificates.length)} گواهینامه صادر شده برای شما</p></div></div>
                    <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold text-white/75 ring-1 ring-white/15"><ShieldCheck className="size-4 text-brand-300" /> استعلام آنلاین با شماره گواهینامه</div>
                </div>
            </section>

            <section className="grid gap-5 md:grid-cols-2">
                {certificates.length > 0 ? certificates.map((certificate) => <Link key={certificate.id} href={certificate.url} className="group flex flex-col gap-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift sm:flex-row sm:items-center">
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/90 to-gold/60 text-white shadow-soft"><Award className="size-7" /></span>
                    <div className="min-w-0 flex-1"><h3 className="line-clamp-2 text-base font-black leading-7 text-navy group-hover:text-brand-700">{certificate.course?.title ?? 'دوره'}</h3><p className="mt-1.5 text-xs font-bold text-navy/45">شماره: <span className="font-black tracking-wide text-deep-green" dir="ltr">{certificate.certificate_number}</span></p></div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-navy/45">صدور: {certificate.issued_at}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-black text-brand-700 group-hover:bg-brand-100"><Printer className="size-3.5" /> مشاهده و چاپ</span>
                        <a href={certificate.download_url} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 rounded-xl bg-soft-gray px-3 py-2 text-xs font-black text-navy/55 hover:bg-brand-100 hover:text-brand-700"><Download className="size-3.5" /> دانلود PDF</a>
                    </div>
                </Link>) : <div className="col-span-full rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-16 text-center">
                    <Award className="mx-auto size-10 text-gold" />
                    <h3 className="mt-4 text-base font-black text-navy">هنوز گواهینامه‌ای ندارید</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-navy/50">همین که یک دوره را تا انتها پیش بروید و همه درس‌هایش را کامل کنید، گواهینامه پایان دوره به‌صورت خودکار صادر و همین‌جا نمایش داده می‌شود.</p>
                    <Link href="/dashboard/courses" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-black text-white shadow-glow hover:bg-brand-600"><BookOpen className="size-4" /> ادامه دوره‌های من <ArrowLeft className="size-4" /></Link>
                </div>}
            </section>
        </div>
    </UserDashboardLayout>;
}

DashboardCertificates.layout = (page: ReactNode) => page;
