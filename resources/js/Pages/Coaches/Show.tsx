import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    CalendarClock,
    HeartHandshake,
    ListChecks,
    Star,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { StatCard } from '@/Components/ui/StatCard';
import { formatNumber, formatPrice } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface CoachData {
    id: number;
    name: string;
    avatar?: string | null;
    specialty?: string | null;
    bio?: string | null;
    experience_years?: number | null;
    hourly_rate?: number | null;
    rating?: number | null;
    is_featured?: boolean;
    is_available?: boolean;
}

interface AvailabilitySlot {
    id: number;
    coach_id: number;
    date?: string | null;
    start_time: string;
    end_time: string;
}

function CoachAvatar({ coach, large = false }: { coach: CoachData; large?: boolean }) {
    const size = large ? 'size-28 md:size-40' : 'size-14';
    return coach.avatar ? (
        <img
            src={coach.avatar}
            alt={coach.name}
            className={`${size} shrink-0 rounded-3xl object-cover shadow-lift ring-4 ring-white/15`}
        />
    ) : (
        <span className={`flex ${size} shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-deep-green text-4xl font-black text-white shadow-lift ring-4 ring-white/15`}>
            {coach.name.slice(0, 1)}
        </span>
    );
}

export default function CoachShow() {
    const { coach, stats, availability } = usePage<
        PageProps & { coach: CoachData; stats: { sessions: number; students: number; completed: number }; availability: AvailabilitySlot[] }
    >().props;

    return (
        <div>
            <section className="reference-hero relative overflow-hidden pb-16 pt-28 md:pb-20 md:pt-32">
                <div className="pointer-events-none absolute -left-24 top-8 size-80 rounded-full bg-brand-400/15 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -right-20 bottom-0 size-64 rounded-full bg-gold/10 blur-3xl" aria-hidden />
                <div className="container-site relative">
                    <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
                        <CoachAvatar coach={coach} large />
                        <div className="min-w-0 flex-1">
                            <div className="hero-kicker">
                                <span className="hero-kicker-line" />
                                <BriefcaseBusiness className="size-3.5 text-brand-300" aria-hidden />
                                <span>کوچ رشد و مسیر آینده</span>
                            </div>
                            <h1 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">{coach.name}</h1>
                            {coach.specialty && <p className="mt-2 text-sm font-black text-brand-300 md:text-base">{coach.specialty}</p>}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {coach.is_featured && <span className="rounded-lg bg-gold/15 px-2.5 py-1 text-[0.65rem] font-black text-gold">کوچ برتر</span>}
                                {coach.rating ? <span className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[0.65rem] font-black text-gold"><Star className="size-3.5 fill-gold" aria-hidden /> {formatNumber(coach.rating)}</span> : null}
                                {coach.experience_years ? <span className="rounded-lg border border-white/15 px-2.5 py-1 text-[0.65rem] font-black text-white/70">{formatNumber(coach.experience_years)} سال تجربه</span> : null}
                                {coach.hourly_rate ? <span className="rounded-lg border border-white/15 px-2.5 py-1 text-[0.65rem] font-black text-white/70">هزینه هر جلسه {formatPrice(coach.hourly_rate)}</span> : null}
                            </div>
                            {coach.bio && <p className="mt-4 max-w-2xl text-sm leading-8 text-white/70 md:text-base md:leading-9">{coach.bio}</p>}
                            <div className="mt-7 flex flex-wrap items-center gap-3">
                                {availability.length > 0 ? (
                                    <a href="#booking" className="inline-flex min-h-[3rem] items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:bg-accent-strong">
                                        رزرو جلسه با {coach.name} <ArrowLeft className="size-4" aria-hidden />
                                    </a>
                                ) : (
                                    <Link href="/contact" className="inline-flex min-h-[3rem] items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:bg-accent-strong">
                                        رزرو جلسه مشاوره <ArrowLeft className="size-4" aria-hidden />
                                    </Link>
                                )}
                                <Link href="/coaching" className="inline-flex items-center gap-2 rounded-2xl border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                                    <HeartHandshake className="size-4" aria-hidden /> آشنایی با کوچینگ
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="reference-stat-section py-10 md:py-12">
                <div className="container-site">
                    <div className="reference-stat-bar grid grid-cols-2 gap-0 md:grid-cols-4">
                        <StatCard dark icon={CalendarDays} value={stats.sessions} label="جلسه کوچینگ" />
                        <StatCard dark icon={Users} value={stats.students} label="دانش‌آموز همراه" />
                        <StatCard dark icon={ListChecks} value={stats.completed} label="جلسه تکمیل‌شده" />
                        <StatCard dark icon={BriefcaseBusiness} value={coach.experience_years ?? 0} label="سال تجربه" />
                    </div>
                </div>
            </section>

            <section id="booking" className="relative scroll-mt-24 overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative">
                    <div className="hero-kicker"><span className="hero-kicker-line" /><span>زمان‌های آزاد {coach.name}</span></div>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">یک زمان مناسب انتخاب کنید</h2>
                        <span className="text-xs font-bold text-navy/45">رزرو آنلاین و درخواست تأیید</span>
                    </div>

                    {availability.length > 0 ? (
                        <>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-navy/55">زمان دلخواه را انتخاب کنید؛ پس از ثبت درخواست، {coach.name} آن را تأیید می‌کند و جلسه در پنل شما نمایش داده می‌شود.</p>
                            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {availability.map((slot) => (
                                    <Link key={slot.id} href="/coaching/book" method="post" data={{ availability_id: slot.id }} as="button" className="group rounded-2xl border border-white/80 bg-soft-gray/60 p-4 text-right shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-black text-navy">{coach.name}</div>
                                                <div className="mt-1 text-xs font-bold text-brand-700">
                                                    {slot.date ? new Date(slot.date).toLocaleDateString('fa-IR') : 'زمان نزدیک'} · {slot.start_time} تا {slot.end_time}
                                                </div>
                                            </div>
                                            <CalendarDays className="size-5 text-brand-600 transition-transform group-hover:scale-110" aria-hidden />
                                        </div>
                                        <span className="mt-3 inline-flex text-xs font-black text-brand-700">درخواست رزرو <ArrowLeft className="mr-1 size-3.5" aria-hidden /></span>
                                    </Link>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="mt-8 rounded-2xl border border-dashed border-navy/15 bg-white/60 p-10 text-center">
                            <CalendarClock className="mx-auto size-8 text-navy/25" aria-hidden />
                            <p className="mt-3 text-sm font-bold text-navy/45">زمان‌های آزاد {coach.name} به‌زودی اعلام می‌شوند؛ فعلاً از طریق کارشناسان ما رزرو کنید.</p>
                            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-deep-green px-6 py-3 text-sm font-bold text-white shadow-soft transition-all hover:bg-brand-800">
                                رزرو از طریق تماس <ArrowLeft className="size-4" aria-hidden />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <section className="relative overflow-hidden bg-deep-gradient py-12 text-white md:py-16">
                <div className="ambient ambient-teal ambient-a" aria-hidden />
                <div className="container-site relative flex flex-col items-center text-center">
                    <h2 className="text-2xl font-black md:text-3xl">می‌خواهید فرزندتان با {coach.name} همراه شود؟</h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">در جلسات یک‌به‌یک کوچینگ، نوجوان استعدادهایش را می‌شناسد، مهارت می‌سازد و با برنامه قدم برمی‌دارد؛ و شما همیشه در جریان پیشرفت او هستید.</p>
                    <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-deep-green transition-all hover:bg-brand-100">
                        رزرو مشاوره رایگان <ArrowLeft className="size-4" aria-hidden />
                    </Link>
                </div>
            </section>
        </div>
    );
}

CoachShow.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
