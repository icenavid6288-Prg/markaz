import { Link, usePage } from '@inertiajs/react';
import { Award, Download, Printer, ShieldCheck, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
    download_url: string;
    verify_url: string;
    course?: { id: number; title: string; slug: string; duration_minutes: number };
}

export default function CertificateShow() {
    const { certificate } = usePage<PageProps & { certificate: CertificateData }>().props;
    const name = certificate.user?.name ?? 'هنرجوی گرامی';
    const hours = certificate.course && certificate.course.duration_minutes > 0 ? Math.round(certificate.course.duration_minutes / 60) : 0;

    return <div className="flex min-h-screen flex-col bg-cream" dir="rtl">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 md:py-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <Link href="/dashboard/certificates" className="inline-flex items-center gap-2 text-xs font-black text-brand-700"><span>←</span> بازگشت به گواهینامه‌های من</Link>
                <div className="flex flex-wrap gap-2"><a href={certificate.download_url} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-soft transition-colors hover:bg-brand-700"><Download className="size-4" /> دانلود PDF</a><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-black text-brand-700 transition-colors hover:bg-brand-50"><Printer className="size-4" /> چاپ نسخه وب</button></div>
            </div>

            <div className="print-area relative rounded-[2.5rem] bg-gradient-to-br from-gold/50 via-white to-brand-100/60 p-2 shadow-lift sm:p-3">
                <div className="relative overflow-hidden rounded-[2rem] border-4 border-double border-gold/70 bg-white px-6 py-10 text-center md:px-14 md:py-12">
                    <Sparkles className="pointer-events-none absolute -right-6 -top-6 size-28 rotate-12 text-gold/10" aria-hidden />
                    <Sparkles className="pointer-events-none absolute -bottom-8 -left-8 size-32 -rotate-12 text-brand-300/15" aria-hidden />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-gold via-brand-500 to-gold" aria-hidden />

                    <div className="flex justify-center"><BrandLogo className="h-16 w-auto sm:h-20" /></div>
                    <h1 className="mt-4 font-display text-xl font-black tracking-wide text-deep-green sm:text-2xl">مرکز رشد و کارآفرینی دکتر بیدی</h1>
                    <p className="mt-1 text-[0.68rem] font-bold text-navy/40">Personal Growth &amp; Entrepreneurship Center</p>

                    <div className="mx-auto mt-6 flex max-w-xs items-center gap-3" aria-hidden><span className="h-px flex-1 bg-gradient-to-l from-gold/60 to-transparent" /><span className="size-2 rotate-45 border border-gold/70" /><span className="h-px flex-1 bg-gradient-to-r from-gold/60 to-transparent" /></div>

                    <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold/90 to-gold/70 px-5 py-2 text-xs font-black text-white shadow-soft sm:text-sm"><Award className="size-4" /> گواهینامه پایان دوره</div>

                    <p className="mt-8 text-sm font-bold text-navy/50">این گواهینامه به</p>
                    <h2 className="mt-3 font-display text-3xl font-black leading-tight text-deep-green sm:text-4xl md:text-5xl">{name}</h2>
                    <p className="mt-3 text-sm font-bold text-navy/50">اعطا می‌شود</p>

                    <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-navy/70">بدین‌وسیله تأیید می‌گردد که ایشان با موفقیت و پشتکار، دوره آموزشی <strong className="text-brand-700">«{certificate.course?.title ?? ''}»</strong> را به پایان رسانده و شایستگی‌های لازم را کسب نموده است.</p>
                    {hours > 0 && <p className="mt-2 text-xs font-bold text-navy/40">مدت دوره: {hours} ساعت</p>}

                    <div className="mx-auto mt-8 grid max-w-3xl items-end gap-6 text-right sm:grid-cols-3">
                        <div className="space-y-1.5 text-xs font-bold text-navy/55">
                            <div>تاریخ صدور: <strong className="text-navy">{certificate.issued_at_text}</strong></div>
                            <div>شماره گواهینامه: <strong className="font-black tracking-wide text-deep-green" dir="ltr">{certificate.certificate_number}</strong></div>
                            <div className="flex items-center gap-1.5 pt-1 text-[0.68rem] text-navy/40"><ShieldCheck className="size-3.5 text-brand-600" /> برای استعلام: {certificate.verify_url.replace(/^https?:\/\/[^/]+/, '')}</div>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-2">
                            <span className="rounded-xl border border-navy/10 bg-white p-2 shadow-soft"><QRCodeSVG value={certificate.verify_url} size={84} level="M" marginSize={1} /></span>
                            <span className="text-[0.62rem] font-bold text-navy/45">استعلام آنلاین با دوربین</span>
                        </div>
                        <div className="text-center sm:text-left">
                            <div className="mx-auto h-px w-40 bg-navy/20 sm:ml-auto" />
                            <div className="mt-2 font-display text-lg font-black text-navy">دکتر بیدی</div>
                            <div className="text-[0.68rem] font-bold text-navy/45">بنیان‌گذار و مدیر مرکز رشد و کارآفرینی</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>;
}

CertificateShow.layout = (page: ReactNode) => page;
