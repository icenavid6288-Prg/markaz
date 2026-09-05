import { Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    BookOpen,
    CheckCircle2,
    Compass,
    FlaskConical,
    Headphones,
    HeartHandshake,
    Lightbulb,
    MessageCircleQuestion,
    Mic,
    Phone,
    Rocket,
    Route,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { type FormEvent, type ReactNode } from 'react';
import { CourseCard, type CourseCardData } from '@/Components/CourseCard';
import JourneyProgress from '@/Components/JourneyProgress';
import SectionMedia from '@/Components/SectionMedia';
import { getServiceVisualIcon, getServiceVisualVariant } from '@/Components/ServiceVisual';
import { Badge } from '@/Components/ui/Badge';
import { SectionHeading } from '@/Components/ui/SectionHeading';
import { StatCard } from '@/Components/ui/StatCard';
import { useParallax } from '@/hooks/useParallax';
import { useReveal } from '@/hooks/useReveal';
import { useTypewriter } from '@/hooks/useTypewriter';
import { formatNumber, formatPrice } from '@/lib/format';
import { vibrate } from '@/lib/haptics';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface ServiceData {
    id: number;
    title: string;
    slug: string;
    summary?: string | null;
    icon?: string | null;
    price?: number | null;
    features?: string[] | null;
}

interface TestimonialData {
    id: number;
    name: string;
    role: string;
    content: string;
    rating?: number | null;
}

interface PostData {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    cover_image?: string | null;
    published_at?: string | null;
    author?: { name?: string } | null;
}

interface ProductData {
    id: number;
    title: string;
    slug: string;
    type: string;
    image?: string | null;
    price: number;
    discount_price?: number | null;
    author?: string | null;
    pages?: number | null;
    episodes?: Array<{ id: number; title: string; duration_seconds: number | null; is_free: boolean }>;
}

const roleLabels: Record<string, string> = {
    parent: 'والد',
    student: 'نوجوان',
    instructor: 'مدرس',
    coach: 'کوچ',
    partner: 'همکار',
};

const problems = [
    { icon: MessageCircleQuestion, title: '«چه کاره شوم؟»', desc: 'نوجوان مدام از خودش و شما این سوال را می‌پرسد و جواب روشنی ندارد.' },
    { icon: TrendingUp, title: 'معدل بالا، مسیر نامشخص', desc: 'فقط کلاس و نمره؛ هیچ برنامه‌ای برای آینده و استعدادهای واقعی وجود ندارد.' },
    { icon: Target, title: 'استعدادها ناشناخته‌اند', desc: 'توانمندی‌های فرزندتان هرگز به‌صورت علمی شناسایی نشده است.' },
    { icon: Users, title: 'فشار و سردرگمی', desc: 'انتظارات دیگران، انتخاب‌های او را تحت فشار قرار می‌دهد و انگیزه را می‌گیرد.' },
];

const whyUs = [
    { icon: Target, title: 'برنامه‌های شخصی‌سازی‌شده', desc: 'هر نوجوان مسیر و برنامه اختصاصی خودش را دارد؛ نه یک نسخه تکراری.' },
    { icon: Award, title: 'تجربه و تخصص', desc: 'سال‌ها تجربه کار با نوجوانان و خانواده‌ها در کنار تیم متخصص.' },
    { icon: FlaskConical, title: 'رویکرد علمی و عملی', desc: 'تلفیق ارزیابی‌های علمی با تمرین‌های کاربردی قابل اجرا در زندگی.' },
    { icon: HeartHandshake, title: 'پشتیبانی مستمر', desc: 'همراهی خانواده‌ها در تمام مراحل مسیر؛ از شناخت تا استقلال.' },
];

const methodology = [
    { icon: Lightbulb, step: '۰۱', title: 'شناخت', desc: 'با ارزیابی علمی و مصاحبه تخصصی، استعدادها، علایق و شخصیت نوجوان را دقیق می‌شناسیم.' },
    { icon: Compass, step: '۰۲', title: 'طراحی مسیر', desc: 'بر اساس شناخت، یک مسیر رشد شخصی‌سازی‌شده با اهداف کوتاه‌مدت و بلندمدت طراحی می‌شود.' },
    { icon: Rocket, step: '۰۳', title: 'اجرا و همراهی', desc: 'با کوچینگ، آموزش مهارت‌ها و پشتیبانی مستمر، نوجوان گام‌به‌گام مسیر را طی می‌کند.' },
];

const journey = [
    { title: 'شناخت', desc: 'ارزیابی و خودشناسی' },
    { title: 'کشف', desc: 'استعداد و علاقه' },
    { title: 'تجربه', desc: 'آزمون و خطا امن' },
    { title: 'مهارت', desc: 'یادگیری کاربردی' },
    { title: 'تصمیم', desc: 'انتخاب آگاهانه' },
    { title: 'اجرا', desc: 'اقدام و پیشرفت' },
    { title: 'استقلال', desc: 'مالکیت مسیر' },
];

const iconRegistry: Record<string, LucideIcon> = { Award, BookOpen, CheckCircle2, Compass, FlaskConical, HeartHandshake, Lightbulb, MessageCircleQuestion, Rocket, Sparkles, Target, TrendingUp, Users };

const iconFor = (value: string, fallback: LucideIcon): LucideIcon => iconRegistry[value] ?? fallback;

const quickFeatures = [
    { icon: Compass, title: 'مسیر رشد شخصی', desc: 'طراحی مسیر اختصاصی' },
    { icon: BookOpen, title: 'دوره‌های کاربردی', desc: 'مهارت برای آینده' },
    { icon: Users, title: 'مدرسین مجرب', desc: 'تیم متخصص مجموعه' },
    { icon: HeartHandshake, title: 'کوچینگ تخصصی', desc: 'همراهی در تمام مسیر' },
];

export default function Home() {
    const { courses, services, testimonials, posts, books, podcast, stats, site, pageContent } = usePage<
        PageProps & {
            courses: CourseCardData[];
            services: ServiceData[];
            testimonials: TestimonialData[];
            posts: PostData[];
            books: ProductData[];
            podcast: ProductData | null;
            stats: Array<{ value: number; suffix: string; label: string }>;
        }
    >().props;

    const pageFields = pageContent?.fields ?? {};
    const editable = (key: string, fallback: string) => pageFields[key]?.value?.trim() || fallback;
    const media = (key: string) => pageFields[key]?.value?.trim() || '';

    const heroRef = useReveal<HTMLDivElement>();
    const servicesRef = useReveal<HTMLDivElement>();
    const journeyRef = useReveal<HTMLDivElement>();
    const statsRef = useReveal<HTMLDivElement>();
    const consultationRef = useReveal<HTMLDivElement>();
    const coursesRef = useReveal<HTMLDivElement>();
    const testimonialsRef = useReveal<HTMLDivElement>();
    const contentRef = useReveal<HTMLDivElement>();
    const ctaRef = useReveal<HTMLDivElement>();
    const mediaParallaxRef = useParallax<HTMLDivElement>(0.1);

    const lead = useForm({
        name: '',
        phone: '',
        need: '',
        consent: false,
    });

    const submitLead = (e: FormEvent) => {
        e.preventDefault();
        lead.post('/leads', { preserveScroll: true });
    };

    const heroTitle = editable('hero_title', site.hero.title).split('؟');
    const typewriter = useTypewriter(heroTitle[0] ?? '', { speed: 170 });
    const showMotivational = typewriter.done && heroTitle.length === 1;

    const heroBackgroundStyle = site.hero.background
        ? { backgroundImage: `linear-gradient(90deg, rgb(8 36 28 / 0.9), rgb(8 36 28 / 0.68)), url("${site.hero.background}")` }
        : undefined;

    return (
        <div>
            <JourneyProgress />
            {/* ── ۱. Hero ── */}
            <section id="home-hero" data-journey-section="hero" style={heroBackgroundStyle} data-has-background={Boolean(site.hero.background)} className="reference-hero relative overflow-hidden pb-20 pt-28 md:pb-24 md:pt-32">
                <div className="container-site relative z-10 grid items-center gap-10 pb-4 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
                    <div ref={heroRef} className="reveal flex flex-col items-start gap-6">
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" />
                            <span>{editable('hero_eyebrow', 'مرکز رشد و کارآفرینی دکتر بیدی')}</span>
                            <span className="hero-kicker-index">۰۱ / ۰۵</span>
                        </div>
                        <h1 className="hero-title text-5xl font-black leading-[1.2] text-navy md:text-6xl lg:text-7xl">
                            {typewriter.typed}
                            {typewriter.caret && <span className="typewriter-caret" aria-hidden />}
                            {typewriter.done && heroTitle.length > 1 && (
                                <>
                                    ؟
                                    <span className="mt-2 block text-gradient">{heroTitle[1] ?? ''}</span>
                                </>
                            )}
                        </h1>
                        {showMotivational && (
                            <p className="hero-motivational text-base font-black text-gold md:text-lg">
                                <Sparkles className="size-4" aria-hidden />
                                فرزندتان را به ستاره‌های فردا تبدیل کنید
                            </p>
                        )}
                        <p className="max-w-xl text-base leading-8 text-navy/60 md:text-lg md:leading-9">
                            {editable('hero_subtitle', site.hero.subtitle)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="#home-consultation"
                                onClick={() => vibrate()}
                                className="btn-glow btn-sparkle inline-flex min-h-[3.125rem] items-center gap-2 rounded-2xl bg-accent px-7 py-3.5 text-base font-bold text-white shadow-glow transition-all hover:bg-accent-strong active:scale-[0.97]"
                            >
                                <span className="sparkle-dot" aria-hidden />
                                <Phone className="size-5" aria-hidden />
                                {editable('hero_cta_primary', site.hero.cta_primary)}
                            </Link>
                            <Link
                                href="/services"
                                className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-white px-7 py-3.5 text-base font-bold text-brand-700 transition-all hover:border-brand-400 hover:bg-brand-50 active:scale-[0.97]"
                            >
                                {editable('hero_cta_secondary', site.hero.cta_secondary)}
                                <ArrowLeft className="size-5" aria-hidden />
                            </Link>
                        </div>
                        <div className="hero-proof-row">
                            <span><CheckCircle2 className="size-4" /> روش اختصاصی</span>
                            <span><CheckCircle2 className="size-4" /> کوچینگ ۱:۱</span>
                            <span><CheckCircle2 className="size-4" /> گواهینامه معتبر</span>
                        </div>
                    </div>

                    <div ref={mediaParallaxRef} className="hero-media-wrap">
                    {media('hero_video') ? (
                        <SectionMedia video={media('hero_video')} className="w-full" />
                    ) : (
                    <div className="reference-hero-media" aria-hidden>
                        {site.hero.image ? (
                            <img
                                src={site.hero.image}
                                alt="تصویر مسیر رشد"
                                loading="eager"
                                className="reference-hero-image"
                            />
                        ) : (
                        <div className="reference-hero-placeholder" role="img" aria-label="تصویر مسیر رشد">
                            <Route className="size-16 text-brand-500" aria-hidden />
                            <span>مسیر رشد</span>
                        </div>
                        )}
                        <div className="reference-hero-media-shade" />
                        <div className="hero-chip hero-chip-one">
                            <span className="hero-chip-icon"><Target className="size-4" aria-hidden /></span>
                            <div>
                                <strong>طراحی مسیر رشد</strong>
                                <small>متناسب با استعداد فرزند شما</small>
                            </div>
                        </div>
                        <div className="hero-chip hero-chip-two">
                            <span className="hero-chip-icon"><Sparkles className="size-4" aria-hidden /></span>
                            <div>
                                <strong>ارزیابی علمی استعداد</strong>
                                <small>گزارش تخصصی و نقشه راه</small>
                            </div>
                        </div>
                        <div className="reference-hero-media-note">
                            <span>۰۱</span>
                            <span>مسیر رشد، از همین‌جا آغاز می‌شود</span>
                        </div>
                    </div>
                    )}
                    </div>
                </div>
            </section>

            {/* ── ۲. Quick nav pills ── */}
            <section className="relative z-10 overflow-hidden bg-white pb-12 md:-mt-16 md:pb-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-teal ambient-b" aria-hidden />
                <div className="container-site relative">
                    <div className="reference-quicknav">
                        {quickFeatures.map((feature, index) => {
                            const Icon = iconFor(editable(`quick_${index + 1}_icon`, ''), feature.icon);
                            return <div key={feature.title} className="reference-quicknav-item">
                                <span className="reference-quicknav-icon"><Icon className="size-5" aria-hidden /></span>
                                <span>
                                    <strong>{feature.title}</strong>
                                    <small>{feature.desc}</small>
                                </span>
                            </div>;
                        })}
                    </div>
                </div>
            </section>

            {/* ── ۳. Stats: کارت‌های آماری برجسته درست بعد از بنر ── */}
            <section id="home-stats" data-journey-section="stats" ref={statsRef} className="reveal reference-stat-section py-10 md:py-12">
                <div className="container-site">
                    <div className="reference-stat-bar grid grid-cols-2 gap-0 md:grid-cols-4">
                        {stats.map((stat) => (
                            <StatCard key={stat.label} dark icon={Target} value={stat.value} suffix={stat.suffix} label={stat.label} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ۳.۵. مشاوره رایگان: فرم کوتاه در باکس برجسته ── */}
            <section id="home-consultation" data-journey-section="consultation" ref={consultationRef} className="reveal relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-gold ambient-a" aria-hidden />
                <div className="ambient ambient-green ambient-b" aria-hidden />
                <div className="container-site relative">
                    <div className="grid overflow-hidden rounded-[2.5rem] border-2 border-brand-100 bg-soft-gray shadow-lift lg:grid-cols-[1fr_1fr]">
                        <div className="relative flex flex-col justify-center gap-5 p-8 md:p-12">
                            <div className="hero-kicker"><span className="hero-kicker-line" /><span>ایستگاه تصمیم</span></div>
                            <h2 className="text-3xl font-black leading-snug text-navy md:text-4xl">{editable('cta_title', 'اولین قدم مسیر رشد فرزندتان را همین امروز بردارید')}</h2>
                            <p className="max-w-md text-sm leading-8 text-navy/60 md:text-base md:leading-9">{editable('cta_description', 'فرم کوتاه زیر را پر کنید؛ کارشناسان ما در اولین فرصت با شما تماس می‌گیرند و ارزیابی اولیه رایگان انجام می‌شود.')}</p>
                            <ul className="flex flex-col gap-2.5 text-sm font-bold text-navy/60">
                                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" aria-hidden /> ارزیابی اولیه <span className="text-highlight">رایگان</span></li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" aria-hidden /> بدون هیچ تعهدی</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-accent" aria-hidden /> پاسخ در کمتر از ۲۴ ساعت</li>
                            </ul>
                        </div>
                        <form onSubmit={submitLead} className="bg-white p-8 shadow-soft ring-1 ring-navy/5 md:p-12" dir="rtl">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label htmlFor="lead-name" className="mb-1.5 block text-xs font-bold text-navy/70">نام و نام خانوادگی *</label>
                                    <input id="lead-name" type="text" required value={lead.data.name} onChange={(e) => lead.setData('name', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3.5 text-sm text-navy outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-100" placeholder="مثلاً: مریم احمدی" />
                                    {lead.errors.name && <p className="mt-1 text-xs text-red-600">{lead.errors.name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="lead-phone" className="mb-1.5 block text-xs font-bold text-navy/70">شماره تماس *</label>
                                    <input id="lead-phone" type="tel" required dir="ltr" value={lead.data.phone} onChange={(e) => lead.setData('phone', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3.5 text-right text-sm text-navy outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-100" placeholder="0933xxxxxxx" />
                                    {lead.errors.phone && <p className="mt-1 text-xs text-red-600">{lead.errors.phone}</p>}
                                </div>
                                <div>
                                    <label htmlFor="lead-need" className="mb-1.5 block text-xs font-bold text-navy/70">موضوع (اختیاری)</label>
                                    <select id="lead-need" value={lead.data.need} onChange={(e) => lead.setData('need', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3.5 text-sm text-navy outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-100">
                                        <option value="">انتخاب کنید</option>
                                        {services.map((service) => <option key={service.id}>{service.title}</option>)}
                                        <option>مهارت‌های آینده</option>
                                        <option>سایر</option>
                                    </select>
                                </div>
                                <label className="flex items-start gap-2.5 text-xs leading-6 text-navy/55">
                                    <input type="checkbox" checked={Boolean(lead.data.consent)} onChange={(e) => lead.setData('consent', e.target.checked)} className="mt-1 size-4 shrink-0 rounded border-navy/20 text-accent focus:ring-accent" required />
                                    <span>با قوانین و حریم خصوصی مرکز موافقم و اجازه می‌دهم با من تماس گرفته شود.</span>
                                </label>
                                {lead.errors.consent && <p className="text-xs text-red-600">{lead.errors.consent}</p>}
                                <button type="submit" onClick={() => vibrate()} disabled={lead.processing} className="btn-glow btn-sparkle inline-flex min-h-[3.125rem] w-full items-center justify-center gap-2 rounded-2xl bg-accent px-7 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-accent-strong active:scale-[0.98] disabled:opacity-60">
                                    <span className="sparkle-dot" aria-hidden />
                                    <HeartHandshake className="size-5" aria-hidden />
                                    {lead.processing ? 'در حال ارسال...' : 'دریافت مشاوره رایگان'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* ── ۴. Services ── */}
            <section id="home-services" data-journey-section="services" ref={servicesRef} className="reveal relative overflow-hidden bg-white pb-16 pt-2 md:pb-20">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative">
                    <SectionHeading
                        station
                        eyebrow="ایستگاه کشف"
                        title={editable('services_title', 'راهکارهایی جامع برای رشد و پیشرفت نوجوانان')}
                        description={editable('services_description', 'از ارزیابی استعداد تا کوچینگ تخصصی و آموزش مدرسین؛ همه خدمات برای مسیر رشد شما آماده است.')}
                        action={
                            <Link href="/services" className="text-sm font-bold text-brand-700 hover:text-brand-800">
                                مشاهده همه خدمات ←
                            </Link>
                        }
                    />
                    <SectionMedia video={media('services_video')} image={media('services_image')} className="mx-auto mt-8 w-full max-w-3xl" />
                    <div className="reference-service-grid mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                                        مشاهده بیشتر <ArrowLeft className="inline size-3.5" />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── ۵. Why Us ── */}
            <section className="section-padding relative overflow-hidden bg-white">
                <div className="ambient ambient-teal ambient-b" aria-hidden />
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="container-site relative">
                    <SectionHeading
                        eyebrow="چرا مرکز رشد دکتر بیدی؟"
                        title={editable('why_title', 'اعتماد خانواده‌ها، ساخته‌شده با نتیجه')}
                        description="چهار دلیل که خانواده‌ها مسیر فرزندشان را به ما می‌سپارند."
                    />
                    <SectionMedia video={media('why_video')} image={media('why_image')} className="mx-auto mt-8 w-full max-w-3xl" />
                    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {whyUs.map((item, index) => {
                            const Icon = iconFor(editable(`why_${index + 1}_icon`, ''), item.icon);
                            return <div key={item.title} className="liquid-card group p-6">
                                <span className="liquid-blob blob-a" aria-hidden />
                                <span className="liquid-blob blob-b" aria-hidden />
                                <span className="glass-tile glass-tile-lg">
                                    <Icon strokeWidth={1.7} aria-hidden />
                                </span>
                                <h3 className="mt-4 text-base font-black text-navy">{item.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-navy/55">{item.desc}</p>
                            </div>;
                        })}
                    </div>
                    <div className="mt-10 text-center">
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-2xl bg-deep-green px-7 py-3.5 text-base font-bold text-white shadow-soft transition-all hover:bg-brand-800 active:scale-[0.97]"
                        >
                            درباره ما بیشتر بدانید
                            <ArrowLeft className="size-5" aria-hidden />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── ۶. Problem ── */}
            <section className="section-padding relative overflow-hidden bg-soft-gray">
                <div className="ambient ambient-gold ambient-a" aria-hidden />
                <div className="ambient ambient-green ambient-b" aria-hidden />
                <div className="container-site relative">
                    <SectionHeading
                        eyebrow="آیا این مسئله برای شما آشناست؟"
                        title="نگرانی‌های واقعی والدین و نوجوانان"
                        description="بیشتر خانواده‌ها این چالش‌ها را تجربه می‌کنند؛ اما تعداد کمی می‌دانند که راه‌حل علمی دارد."
                    />
                    <SectionMedia video={media('problem_video')} image={media('problem_image')} className="mx-auto mt-8 w-full max-w-3xl" />
                    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {problems.map((p, i) => (
                            <div key={p.title} className="liquid-card group p-6">
                                <span className="liquid-blob blob-a" aria-hidden />
                                <span className="liquid-blob blob-b" aria-hidden />
                                <span className="absolute -left-2 -top-3 text-6xl font-black text-brand-900/5">
                                    {formatNumber(i + 1)}
                                </span>
                                <span className={`glass-tile glass-tile-lg ${i % 2 ? 'tile-gold' : ''}`}>
                                    <p.icon strokeWidth={1.7} aria-hidden />
                                </span>
                                <h3 className="mt-4 text-base font-black text-navy">{p.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-navy/55">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ۷. Methodology + Journey ── */}
            <section className="bg-deep-gradient section-padding relative overflow-hidden text-white">
                <div className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full bg-brand-400/10 blur-3xl" aria-hidden />
                <div className="container-site relative">
                    <SectionHeading
                        dark
                        eyebrow="روش اختصاصی دکتر بیدی"
                        title="چرا مرکز رشد و کارآفرینی دکتر بیدی؟"
                        description="ما فقط آموزش نمی‌دهیم؛ مسیر رشد هر نوجوان را با یک روش سه‌مرحله‌ای ثابت‌شده طراحی و همراهی می‌کنیم."
                    />
                    <SectionMedia video={media('method_video')} image={media('method_image')} className="mx-auto mt-10 w-full max-w-3xl ring-1 ring-white/15" />
                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {methodology.map((m, index) => {
                            const Icon = iconFor(editable(`method_${index + 1}_icon`, ''), m.icon);
                            return <div
                                key={m.step}
                                className="group glass-dark relative rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                            >
                                <span className="text-gradient-gold text-4xl font-black">{m.step}</span>
                                <span className="panel-inline-icon mt-4 text-brand-300 transition-transform duration-300 group-hover:scale-110">
                                    <Icon className="size-6" aria-hidden />
                                </span>
                                <h3 className="mt-4 text-lg font-black">{m.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-white/65">{m.desc}</p>
                            </div>;
                        })}
                    </div>

                    {/* ── Coaching Journey ── */}
                    <div ref={journeyRef} className="reveal mt-24">
                        <SectionHeading
                            dark
                            eyebrow="مسیر رشد"
                            title="هفت ایستگاه سفر رشد نوجوان"
                            description="هر نوجوان این مسیر را با همراهی کوچ اختصاصی خود طی می‌کند؛ بدون شتابزدگی و با برنامه."
                        />
                        <div className="growth-journey mt-12">
                            <div className="growth-journey-line" aria-hidden />
                            <ol className="growth-journey-list">
                                {journey.map((step, i) => (
                                    <li key={step.title} className="growth-journey-step">
                                        <span className="growth-journey-node">
                                            <span>{formatNumber(i + 1)}</span>
                                        </span>
                                        <div className="growth-journey-card">
                                            <span className="growth-journey-index">ایستگاه {formatNumber(i + 1)}</span>
                                            <h3>{step.title}</h3>
                                            <p>{step.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ۸. Courses ── */}
            <section id="home-courses" data-journey-section="courses" ref={coursesRef} className="reveal section-padding relative overflow-hidden bg-soft-gray">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-teal ambient-b" aria-hidden />
                <div className="container-site relative">
                    <SectionHeading
                        station
                        eyebrow="ایستگاه مهارت"
                        title="یادگیری کاربردی با گواهینامه معتبر"
                        description="دوره‌های آنلاین و حضوری طراحی‌شده برای نوجوانان، والدین و مدرسین."
                        action={
                            <Link href="/courses" className="text-sm font-bold text-brand-700 hover:text-brand-800">
                                مشاهده همه دوره‌ها ←
                            </Link>
                        }
                    />
                    <SectionMedia video={media('courses_video')} image={media('courses_image')} className="mx-auto mt-8 w-full max-w-3xl" />
                    <div className="chaos-grid mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ۹. Testimonials ── */}
            <section id="home-testimonials" data-journey-section="testimonials" ref={testimonialsRef} className="reveal section-padding relative overflow-hidden bg-white">
                <div className="ambient ambient-gold ambient-a" aria-hidden />
                <div className="ambient ambient-green ambient-b" aria-hidden />
                <div className="container-site relative">
                    <SectionHeading
                        eyebrow="نتایج واقعی"
                        title="خانواده‌ها چه می‌گویند؟"
                        description="بدون ادعاهای جعلی؛ فقط تجربه واقعی والدین، نوجوانان و مدرسین."
                    />
                    <SectionMedia video={media('testimonials_video')} image={media('testimonials_image')} className="mx-auto mt-8 w-full max-w-3xl" />
                    <div className="chaos-grid mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {testimonials.map((t) => (
                            <figure key={t.id} className="liquid-card flex flex-col gap-4 p-6">
                                <span className="liquid-blob blob-b" aria-hidden />
                                <div className="flex gap-1" aria-label={`امتیاز ${t.rating}`}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`size-4 ${i < (t.rating ?? 0) ? 'fill-gold text-gold' : 'text-navy/15'}`}
                                        />
                                    ))}
                                </div>
                                <blockquote className="flex-1 text-sm leading-7 text-navy/70">«{t.content}»</blockquote>
                                <figcaption className="flex items-center gap-3 border-t border-navy/5 pt-4">
                                    <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-deep-green text-sm font-black text-white">
                                        {t.name.slice(0, 1)}
                                    </span>
                                    <div>
                                        <div className="text-sm font-black text-navy">{t.name}</div>
                                        <div className="text-xs text-navy/45">{roleLabels[t.role] ?? t.role}</div>
                                    </div>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ۱۰. Content: Blog / Podcast / Books ── */}
            <section ref={contentRef} className="reveal section-padding relative overflow-hidden bg-soft-gray">
                <div className="ambient ambient-teal ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative">
                    <SectionHeading
                        station
                        eyebrow="ایستگاه آگاهی"
                        title="بخوانید، بشنوید، یاد بگیرید"
                        description="جدیدترین مقالات، پادکست‌ها و کتاب‌های مجموعه برای همراهی مستمر خانواده‌ها."
                    />
                    <SectionMedia video={media('content_video')} image={media('content_image')} className="mx-auto mt-8 w-full max-w-3xl" />
                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-2 text-sm font-black text-navy">
                                <BookOpen className="size-4 text-brand-600" /> مقالات تازه
                            </div>
                            {posts.map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/blog/${post.slug}`}
                                    className="liquid-card group p-5"
                                >
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <h3 className="line-clamp-2 text-sm font-black leading-6 text-navy group-hover:text-brand-700">
                                        {post.title}
                                    </h3>
                                    <p className="mt-2 line-clamp-2 text-xs leading-6 text-navy/50">{post.excerpt}</p>
                                </Link>
                            ))}
                        </div>

                        {podcast && (
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-2 text-sm font-black text-navy">
                                    <Mic className="size-4 text-brand-600" /> پادکست مسیر رشد
                                </div>
                                <div className="rounded-3xl bg-deep-gradient p-6 text-white shadow-lift">
                                    <span className="panel-inline-icon text-brand-300">
                                        <Headphones className="size-6" />
                                    </span>
                                    <h3 className="mt-4 text-base font-black">{podcast.title}</h3>
                                    {podcast.episodes?.slice(0, 3).map((ep) => (
                                        <div key={ep.id} className="mt-3 flex items-center gap-2 text-xs text-white/70">
                                            <span className="size-1.5 rounded-full bg-brand-400" />
                                            {ep.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-2 text-sm font-black text-navy">
                                <BookOpen className="size-4 text-brand-600" /> کتاب‌های مجموعه
                            </div>
                            {books.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/shop/${book.slug}`}
                                    className="liquid-card group flex items-center gap-4 p-4"
                                >
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                                        <BookOpen className="size-6" />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="line-clamp-1 text-sm font-black text-navy group-hover:text-brand-700">
                                            {book.title}
                                        </h3>
                                        <p className="text-xs text-navy/45">
                                            {book.author} · {book.pages} صفحه
                                        </p>
                                        <p className="mt-1 text-sm font-black text-brand-700">{formatPrice(book.discount_price ?? book.price)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── ۱۱. CTA پایانی: بدون فرم، هدایت به باکس مشاوره ── */}
            <section id="home-cta" data-journey-section="cta" ref={ctaRef} className="reveal section-padding relative overflow-hidden bg-white">
                <div className="container-site">
                    <SectionMedia video={media('cta_video')} image={media('cta_image')} className="mx-auto mb-8 w-full max-w-3xl" />
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-deep-gradient p-8 text-center md:p-14">
                        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand-400/15 blur-3xl" aria-hidden />
                        <Badge tone="gold">
                            <Sparkles className="size-3.5" /> مشاوره رایگان
                        </Badge>
                        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-tight text-white md:text-4xl">
                            {editable('cta_title', 'اولین قدم مسیر رشد فرزندتان را همین امروز بردارید')}
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl leading-8 text-white/65">
                            {editable('cta_description', 'فرم کوتاه را پر کنید؛ کارشناسان ما در اولین فرصت با شما تماس می‌گیرند و ارزیابی اولیه رایگان انجام می‌شود.')}
                        </p>
                        <a href="#home-consultation" onClick={() => vibrate()} className="btn-glow btn-sparkle mt-7 inline-flex min-h-[3.125rem] items-center gap-2 rounded-2xl bg-accent px-8 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-accent-strong active:scale-[0.97]">
                            <span className="sparkle-dot" aria-hidden />
                            <HeartHandshake className="size-5" aria-hidden />
                            دریافت مشاوره رایگان
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
}

Home.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
