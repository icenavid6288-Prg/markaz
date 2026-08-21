import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, HeartHandshake, Star, Target, TrendingUp, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { getServiceVisualIcon, getServiceVisualVariant } from '@/Components/ServiceVisual';
import { PageHeader } from '@/Components/ui/PageHeader';
import { formatNumber } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface CoachData {
    id: number;
    user_id: number;
    name: string;
    specialty?: string | null;
    bio?: string | null;
    experience_years?: number | null;
    hourly_rate?: number | null;
    rating?: number | null;
    is_featured?: boolean;
}

interface AvailabilityData {
    id: number;
    coach_id: number;
    coach_name?: string | null;
    date?: string | null;
    start_time: string;
    end_time: string;
}

interface ServiceData {
    id: number;
    title: string;
    slug: string;
    summary?: string | null;
    icon?: string | null;
}

const steps = [
    { icon: Target, title: 'شناخت', desc: 'ارزیابی علمی استعدادها، علایق و شخصیت نوجوان' },
    { icon: TrendingUp, title: 'طراحی مسیر', desc: 'برنامه رشد اختصاصی با اهداف کوتاه‌مدت و بلندمدت' },
    { icon: HeartHandshake, title: 'همراهی مستمر', desc: 'جلسات منظم، گزارش به والدین و پشتیبانی در مسیر' },
];

export default function CoachingIndex() {
    const { coaches, availability, services, testimonials } = usePage<
        PageProps & { coaches: CoachData[]; availability: AvailabilityData[]; services: ServiceData[]; testimonials: Array<{ id: number; name: string; role: string; content: string }> }
    >().props;

    return (
        <div>
            <PageHeader
                eyebrow="کوچینگ"
                title="کوچ اختصاصی، همراه مسیر رشد فرزند شما"
                subtitle="در جلسات یک‌به‌یک کوچینگ، نوجوان استعدادهایش را می‌شناسد، مهارت می‌سازد و با برنامه قدم برمی‌دارد؛ و شما همیشه در جریان پیشرفت او هستید."
                actions={
                    <Link
                        href="/contact"
                        className="inline-flex min-h-[3rem] items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:bg-accent-strong"
                    >
                        <CalendarDays className="size-4" aria-hidden />
                        رزرو جلسه مشاوره رایگان
                    </Link>
                }
            />

            {/* ── Steps ── */}
            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-teal ambient-b" aria-hidden />
                <div className="container-site relative">
                    <div className="hero-kicker">
                        <span className="hero-kicker-line" />
                        <span>روش کار</span>
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">مسیر کوچینگ در سه گام</h2>
                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                        {steps.map((step, i) => (
                            <div key={step.title} className="liquid-card p-7">
                                <span className="liquid-blob blob-a" aria-hidden />
                                <span className="liquid-blob blob-b" aria-hidden />
                                <div className="flex items-center justify-between">
                                    <span className="glass-tile glass-tile-lg">
                                        <step.icon strokeWidth={1.7} aria-hidden />
                                    </span>
                                    <span className="text-4xl font-black text-brand-900/10">{formatNumber(i + 1)}</span>
                                </div>
                                <h3 className="mt-5 text-lg font-black text-navy">{step.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-navy/55">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Coaches ── */}
            {coaches.length > 0 && (
                <section className="relative overflow-hidden bg-soft-gray py-12 md:py-16">
                    <div className="ambient ambient-gold ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" />
                            <span>تیم کوچینگ</span>
                        </div>
                        <h2 className="mt-3 text-2xl font-black text-navy">کوچ‌های ما</h2>
                        <div className="mt-8 grid gap-6 md:grid-cols-2">
                            {coaches.map((coach) => (
                                <div key={coach.name} className="liquid-card p-6 md:p-7">
                                    <span className="liquid-blob blob-a" aria-hidden />
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <div className="flex items-start gap-4">
                                        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-deep-green text-xl font-black text-white shadow-lift">
                                            {coach.name.slice(0, 1)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link href={`/coaches/${coach.id}`} className="text-lg font-black text-navy transition-colors hover:text-brand-700">{coach.name}</Link>
                                                {coach.is_featured && (
                                                    <span className="rounded-lg bg-gold/15 px-2 py-0.5 text-[0.65rem] font-black text-gold">
                                                        کوچ برتر
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs font-bold text-brand-700">{coach.specialty}</p>
                                        </div>
                                        {coach.rating ? (
                                            <span className="flex items-center gap-1 rounded-xl bg-white/80 px-2.5 py-1.5 text-xs font-black text-gold">
                                                <Star className="size-3.5 fill-gold" aria-hidden /> {formatNumber(coach.rating)}
                                            </span>
                                        ) : null}
                                    </div>
                                    {coach.bio && <p className="mt-4 text-sm leading-7 text-navy/55">{coach.bio}</p>}
                                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-navy/50">
                                        {coach.experience_years ? (
                                            <span className="flex items-center gap-1.5">
                                                <Users className="size-3.5 text-brand-500" aria-hidden /> {formatNumber(coach.experience_years)} سال تجربه
                                            </span>
                                        ) : null}
                                        <Link href="/contact" className="service-more text-brand-700">
                                            رزرو جلسه <ArrowLeft className="inline size-3.5" aria-hidden />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Booking slots ── */}
            {availability.length > 0 && (
                <section className="relative overflow-hidden bg-cream py-12 md:py-16">
                    <div className="container-site relative">
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>زمان‌های آزاد</span></div>
                        <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="mt-3 text-2xl font-black text-navy">زمان مناسب خودت را انتخاب کن</h2><span className="text-xs font-bold text-navy/45">رزرو آنلاین و درخواست تأیید</span></div>
                        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {availability.map((slot) => <Link key={slot.id} href="/coaching/book" method="post" data={{ availability_id: slot.id }} as="button" className="group rounded-2xl border border-white/80 bg-white/85 p-4 text-right shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-black text-navy">{slot.coach_name ?? 'کوچ مرکز رشد'}</div><div className="mt-1 text-xs font-bold text-brand-700">{slot.date ? new Date(slot.date).toLocaleDateString('fa-IR') : 'زمان نزدیک'} · {slot.start_time} تا {slot.end_time}</div></div><CalendarDays className="size-5 text-brand-600 transition-transform group-hover:scale-110" /></div><span className="mt-3 inline-flex text-xs font-black text-brand-700">درخواست رزرو <ArrowLeft className="mr-1 size-3.5" /></span></Link>)}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Services + CTA ── */}
            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="container-site relative">
                    <div className="hero-kicker">
                        <span className="hero-kicker-line" />
                        <span>خدمات کوچینگ</span>
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-navy">از همین‌جا شروع کنید</h2>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => {
                            const variant = getServiceVisualVariant(service.slug, service.icon);
                            const Icon = getServiceVisualIcon(variant);
                            return (
                                <Link
                                    key={service.id}
                                    href={`/services/${service.slug}`}
                                    data-variant={variant}
                                    className="liquid-card group flex flex-col gap-3.5 p-6"
                                >
                                    <span className="liquid-blob blob-a" aria-hidden />
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <span className="glass-tile glass-tile-lg">
                                        <Icon strokeWidth={1.7} aria-hidden />
                                    </span>
                                    <h3 className="text-base font-black text-navy">{service.title}</h3>
                                    <p className="line-clamp-2 text-xs leading-6 text-navy/55">{service.summary}</p>
                                    <span className="service-more mt-auto text-xs font-bold text-brand-700">
                                        مشاهده بیشتر <ArrowLeft className="inline size-3.5" aria-hidden />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="liquid-card mt-10 flex flex-col items-center gap-4 p-8 text-center md:p-10">
                        <span className="liquid-blob blob-a" aria-hidden />
                        <span className="liquid-blob blob-b" aria-hidden />
                        <span className="glass-tile glass-tile-lg">
                            <HeartHandshake strokeWidth={1.7} aria-hidden />
                        </span>
                        <h2 className="text-xl font-black text-navy md:text-2xl">اولین جلسه مشاوره رایگان است</h2>
                        <p className="max-w-xl text-sm leading-7 text-navy/55">
                            در جلسه اول، وضعیت فعلی فرزندتان را بررسی می‌کنیم و پیشنهاد مشخصی برای مسیر او می‌دهیم؛ بدون هیچ تعهدی.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-2xl bg-deep-green px-8 py-3.5 text-base font-bold text-white shadow-soft transition-all hover:bg-brand-800 active:scale-[0.97]"
                        >
                            رزرو جلسه مشاوره رایگان
                            <ArrowLeft className="size-5" aria-hidden />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

CoachingIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
