import { Link, usePage } from '@inertiajs/react';
import BrandLogo from '@/Components/BrandLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import {
    ArrowLeft,
    CheckCircle2,
    Compass,
    ShieldCheck,
    Sparkles,
    Target,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import type { PageProps } from '@/types';

const defaultJourneyStations = ['شناخت', 'کشف', 'تجربه', 'مهارت', 'تصمیم', 'اجرا', 'استقلال'];
const defaultTrustItems = [
    'روش اختصاصی طراحی مسیر رشد',
    'کوچینگ تخصصی ۱ به ۱',
    'پشتیبانی مستمر خانواده‌ها',
];

export default function Guest({ children }: PropsWithChildren) {
    const { pageContent } = usePage<PageProps>().props;
    const fields = pageContent?.fields ?? {};
    const value = (key: string, fallback: string) => {
        const raw = fields[key]?.value;
        return raw && raw.trim() ? raw.trim() : fallback;
    };

    const panelKicker = value('panel_kicker', 'مسیر رشد، از همین‌جا آغاز می‌شود');
    const panelTitle = value('panel_title', 'هر نوجوان یک مسیر دارد؛');
    const panelTitleAccent = value('panel_title_accent', 'ما آن را کشف می‌کنیم.');
    const panelDescription = value('panel_description', 'از شناخت استعدادها تا طراحی مسیر، آموزش مهارت‌های آینده و همراهی تا استقلال؛ تمام مسیر با برنامه‌ای شخصی‌سازی‌شده برای فرزند شما.');
    const journeyLabel = value('journey_label', 'هفت ایستگاه سفر رشد');
    const journeyStations = value('journey_stations', defaultJourneyStations.join('،'))
        .split(/[,،\n]+/)
        .map((station) => station.trim())
        .filter(Boolean);
    const trustItems = [value('trust_1', defaultTrustItems[0]), value('trust_2', defaultTrustItems[1]), value('trust_3', defaultTrustItems[2])];
    const background = value('background_image', '');

    return (
        <div
            dir="rtl"
            className="relative flex min-h-screen flex-col overflow-hidden bg-soft-gray"
            style={background ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
            {background && <div className="absolute inset-0 bg-white/80" aria-hidden />}
            {/* ── Ambient ── */}
            <div className="ambient ambient-green ambient-a" aria-hidden />
            <div className="ambient ambient-gold ambient-b" aria-hidden />

            <div className="pointer-events-none absolute -left-24 top-1/3 size-80 rounded-full bg-brand-400/10 blur-3xl" aria-hidden />

            {/* ── Brand bar ── */}
            <header className="container-site relative z-10 flex items-center justify-between py-6">
                <Link href="/" className="flex items-center gap-3">
                    <BrandLogo className="guest-brand-mark" />
                    <span className="flex flex-col leading-tight">
                        <span className="text-sm font-black text-navy">مرکز رشد و کارآفرینی</span>
                        <span className="text-xs font-bold text-brand-700">دکتر بیدی</span>
                    </span>
                </Link>
                <div className="flex items-center gap-2">
                    <ThemeToggle compact />
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-navy/50 transition-colors hover:text-brand-700"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        بازگشت به سایت
                    </Link>
                </div>
            </header>

            {/* ── Auth shell ── */}
            <main className="container-site relative z-10 flex flex-1 items-center justify-center pb-12">
                <div className="grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
                    {/* ── Brand panel (desktop) ── */}
                    <aside className="relative hidden overflow-hidden rounded-[2rem] bg-deep-gradient p-10 text-white lg:flex lg:flex-col lg:justify-between">
                        <div className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-brand-400/15 blur-3xl" aria-hidden />
                        <div className="pointer-events-none absolute -bottom-20 right-1/3 size-56 rounded-full bg-gold/10 blur-3xl" aria-hidden />

                        <div className="relative">
                            <div className="hero-kicker !text-brand-300">
                                <span className="hero-kicker-line !bg-brand-400" />
                                <span>{panelKicker}</span>
                            </div>
                            <h2 className="mt-5 text-3xl font-black leading-[1.35]">
                                {panelTitle}
                                {panelTitleAccent && <span className="text-gradient-gold block">{panelTitleAccent}</span>}
                            </h2>
                            <p className="mt-4 max-w-sm text-sm leading-8 text-white/65">
                                {panelDescription}
                            </p>
                        </div>

                        {/* Journey timeline */}
                        <div className="relative mt-10">
                            <div className="mb-5 flex items-center gap-2 text-xs font-black text-brand-300">
                                <Compass className="size-4" aria-hidden />
                                {journeyLabel}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {journeyStations.map((station, i) => (
                                    <span
                                        key={station}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/75 backdrop-blur-md"
                                    >
                                        <span className="flex size-5 items-center justify-center rounded-full bg-brand-500/25 text-[0.6rem] font-black text-brand-300">
                                            {i + 1}
                                        </span>
                                        {station}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Trust */}
                        <ul className="relative mt-10 space-y-3 border-t border-white/10 pt-6">
                            {trustItems.map((item) => (
                                <li key={item} className="flex items-center gap-2.5 text-sm font-bold text-white/75">
                                    <CheckCircle2 className="size-4 shrink-0 text-brand-400" aria-hidden />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </aside>

                    {/* ── Form card ── */}
                    <div className="liquid-card relative p-7 md:p-10">
                        <span className="liquid-blob blob-a" aria-hidden />
                        <span className="liquid-blob blob-b" aria-hidden />
                        <div className="relative">{children}</div>
                    </div>
                </div>
            </main>

            {/* ── Footer trust strip ── */}
            <footer className="container-site relative z-10 pb-6">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-navy/5 pt-5 text-[0.7rem] font-bold text-navy/40">
                    <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-brand-600" aria-hidden />
                        اطلاعات شما نزد ما امن است
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-brand-600" aria-hidden />
                        <Target className="size-3.5 text-gold" aria-hidden />
                        مرکز رشد و کارآفرینی دکتر بیدی
                    </span>
                </div>
            </footer>
        </div>
    );
}
