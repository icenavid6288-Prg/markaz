import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Award, BriefcaseBusiness, GraduationCap, HeartHandshake, Route, Star, Target, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import SectionMedia from '@/Components/SectionMedia';
import { PageHeader } from '@/Components/ui/PageHeader';
import { StatCard } from '@/Components/ui/StatCard';
import { formatNumber } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface TeamMember {
    id: number;
    name: string;
    avatar?: string | null;
    specialty?: string | null;
    bio?: string | null;
    experience_years?: number | null;
    rating?: number | null;
    is_featured?: boolean;
    role?: string | null;
}

interface FounderData extends Omit<TeamMember, 'id' | 'is_featured'> {
    role: string;
}

interface ServiceData {
    id: number;
    title: string;
    slug: string;
    summary?: string | null;
}

function ProfileAvatar({ member, large = false }: { member: Pick<TeamMember, 'name' | 'avatar'>; large?: boolean }) {
    const size = large ? 'size-24 md:size-28' : 'size-14';
    return member.avatar ? (
        <img
            src={member.avatar}
            alt={member.name}
            className={`${size} shrink-0 rounded-2xl object-cover shadow-lift`}
        />
    ) : (
        <span className={`flex ${size} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-deep-green ${large ? 'text-4xl' : 'text-lg'} font-black text-white shadow-lift`}>
            {member.name.slice(0, 1)}
        </span>
    );
}

function TeamCard({ member, kind }: { member: TeamMember; kind: 'instructor' | 'coach' }) {
    const Icon = kind === 'instructor' ? GraduationCap : BriefcaseBusiness;
    const card = (
        <article className="liquid-card group h-full p-5">
            <span className="liquid-blob blob-a" aria-hidden />
            <span className="liquid-blob blob-b" aria-hidden />
            <div className="relative z-10 flex items-start gap-4">
                <ProfileAvatar member={member} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-navy">{member.name}</h3>
                        {member.is_featured && <span className="rounded-lg bg-gold/15 px-2 py-0.5 text-[0.62rem] font-black text-gold">منتخب مجموعه</span>}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-brand-700">
                        <Icon className="size-3.5" aria-hidden />
                        {member.specialty || member.role}
                    </p>
                </div>
            </div>
            {member.bio && <p className="relative z-10 mt-4 line-clamp-2 text-sm leading-6 text-navy/55">{member.bio}</p>}
            <div className="relative z-10 mt-4 flex flex-wrap items-center gap-3 border-t border-navy/5 pt-3 text-xs font-bold text-navy/50">
                {member.experience_years ? <span>{formatNumber(member.experience_years)} سال تجربه</span> : null}
                {kind === 'coach' && member.rating ? (
                    <span className="flex items-center gap-1 text-gold"><Star className="size-3.5 fill-gold" aria-hidden /> {formatNumber(member.rating)}</span>
                ) : null}
                <span className="mr-auto inline-flex items-center gap-1 text-brand-700">
                    {kind === 'instructor' ? 'صفحه مدرس' : 'صفحه کوچ'} <ArrowLeft className="size-3.5" aria-hidden />
                </span>
            </div>
        </article>
    );

    const href = kind === 'instructor' ? `/instructors/${member.id}` : `/coaches/${member.id}`;
    return <Link href={href} className="block h-full">{card}</Link>;
}

export default function AboutIndex() {
    const { pageContent, stats, founder, instructors, coaches, services, testimonials, course_count } = usePage<
        PageProps & {
            stats: Array<{ value: number; suffix: string; label: string }>;
            founder: FounderData | null;
            instructors: TeamMember[];
            coaches: TeamMember[];
            services: ServiceData[];
            testimonials: Array<{ id: number; name: string; role: string; content: string }>;
            course_count: number;
        }
    >().props;

    const pageFields = pageContent?.fields ?? {};
    const media = (key: string) => pageFields[key]?.value?.trim() || '';

    return (
        <div>
            <PageHeader
                eyebrow="درباره ما"
                title="مرکزی برای طراحی مسیر آینده نوجوانان"
                subtitle="مرکز رشد و کارآفرینی دکتر بیدی با تلفیق آموزش، کوچینگ و ارزیابی علمی، به نوجوانان کمک می‌کند استعدادهایشان را بشناسند و مسیر آینده‌شان را آگاهانه طراحی کنند."
            />

            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <SectionMedia video={media('intro_video')} image={media('intro_image')} className="mx-auto mb-8 w-full max-w-3xl" />
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="container-site relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative mx-auto w-full max-w-md">
                        <div className="growth-art-panel rounded-3xl">
                            <div className="growth-art-grid" />
                            <div className="growth-art-sun" />
                            <div className="growth-art-route growth-art-route-one" />
                            <div className="growth-art-route growth-art-route-two" />
                            <span className="growth-art-node growth-art-node-one" />
                            <span className="growth-art-node growth-art-node-two" />
                            <span className="growth-art-node growth-art-node-three" />
                            <div className="growth-art-monogram">ر</div>
                            <div className="growth-art-caption"><span>مسیر رشد</span><small>از شناخت تا استقلال</small></div>
                            <div className="growth-art-index">۰۱ — ۰۷</div>
                        </div>
                    </div>
                    <div>
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>چرا ما؟</span></div>
                        <h2 className="mt-3 text-2xl font-black leading-snug text-navy md:text-3xl">«هر نوجوان، یک مسیر منحصر‌به‌فرد»</h2>
                        <div className="mt-5 flex flex-col gap-4 text-sm leading-8 text-navy/65">
                            <p>ما باور داریم که نمره و کلاس‌های بیشتر، پاسخ سوال اصلی نوجوان نیست؛ سوالی که هر روز از خودش می‌پرسد: «چه کاره شوم؟» پاسخ این سوال در شناخت استعدادها، تجربه مهارت‌ها و طراحی یک مسیر شخصی‌سازی‌شده است.</p>
                            <p>در این مرکز، ارزیابی‌های علمی با کوچینگ یک‌به‌یک، آموزش مهارت‌های آینده و همراهی مستمر خانواده‌ها ترکیب شده است تا نوجوان نه فقط درس بخواند، بلکه مسیر آینده‌اش را خودش طراحی کند.</p>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <Link href="/services" className="inline-flex items-center gap-2 rounded-2xl bg-deep-green px-6 py-3 text-sm font-bold text-white shadow-soft transition-all hover:bg-brand-800"><Route className="size-4" aria-hidden /> آشنایی با خدمات</Link>
                            <Link href="/contact" className="inline-flex items-center gap-2 rounded-2xl border border-navy/10 px-6 py-3 text-sm font-bold text-navy/70 transition-colors hover:border-brand-300 hover:text-brand-700">گفتگو با کارشناسان</Link>
                        </div>
                    </div>
                </div>
            </section>

            {founder && (
                <section id="founder" className="relative overflow-hidden bg-deep-gradient py-12 md:py-16">
                    <div className="ambient ambient-teal ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <div className="hero-kicker text-brand-200"><span className="hero-kicker-line bg-brand-300" /><span>چهره پشت این مسیر</span></div>
                        <div className="mt-7 grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
                            <div className="liquid-card border-white/15 bg-white/10 p-6 text-white md:p-8">
                                <span className="liquid-blob blob-a" aria-hidden />
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <ProfileAvatar member={founder} large />
                                    <p className="mt-5 text-xs font-bold text-brand-200">{founder.role}</p>
                                    <h2 className="mt-2 text-2xl font-black">{founder.name}</h2>
                                    <p className="mt-2 text-sm font-bold text-brand-200">{founder.specialty}</p>
                                    <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-bold text-white/65">
                                        {founder.experience_years ? <span className="rounded-full border border-white/15 px-3 py-1.5">{formatNumber(founder.experience_years)} سال تجربه</span> : null}
                                        {founder.rating ? <span className="flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5"><Star className="size-3.5 fill-gold text-gold" aria-hidden /> {formatNumber(founder.rating)}</span> : null}
                                    </div>
                                </div>
                            </div>
                            <div className="text-white">
                                <div className="flex items-center gap-3 text-brand-300"><span className="h-px w-10 bg-brand-400" /><span className="text-xs font-black">بنیان‌گذار مجموعه</span></div>
                                <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">رشد، وقتی ماندگار می‌شود که به یک مسیر تبدیل شود.</h2>
                                <p className="mt-5 max-w-2xl text-sm leading-8 text-white/70">{founder.bio || 'روایت و تجربه این مسیر در کنار نوجوانان و خانواده‌ها، پایه شکل‌گیری مرکز رشد و کارآفرینی دکتر بیدی است.'}</p>
                                <div className="mt-7 flex flex-wrap gap-3">
                                    <Link href="/contact" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-deep-green transition-colors hover:bg-brand-100">گفتگو با دکتر بیدی <ArrowLeft className="size-4" aria-hidden /></Link>
                                    <Link href="/courses" className="inline-flex items-center gap-2 rounded-2xl border border-white/25 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">مشاهده دوره‌ها</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="reference-stat-section py-10 md:py-12">
                <div className="container-site"><div className="reference-stat-bar grid grid-cols-2 gap-0 md:grid-cols-4">
                    {stats.map((stat) => <StatCard key={stat.label} dark icon={Target} value={stat.value} suffix={stat.suffix} label={stat.label} />)}
                </div></div>
            </section>

            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-teal ambient-a" aria-hidden />
                <SectionMedia video={media('mission_video')} image={media('mission_image')} className="container-site relative mx-auto w-full max-w-3xl" />
                <div className="container-site relative grid gap-10 lg:grid-cols-2">
                    <div>
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>ارزش‌های ما</span></div>
                        <h2 className="mt-3 text-2xl font-black text-navy">چه چیزهایی برای ما مهم است؟</h2>
                        <div className="mt-7 flex flex-col gap-4">
                            {[
                                { icon: Target, title: 'مسیر شخصی، نه نسخه تکراری', desc: 'هر برنامه بر اساس ارزیابی واقعی همان نوجوان طراحی می‌شود.' },
                                { icon: Award, title: 'علم و عمل با هم', desc: 'روش‌های علمی در کنار تمرین‌های قابل اجرا در زندگی روزمره.' },
                                { icon: HeartHandshake, title: 'همراهی خانواده', desc: 'والدین در تمام مراحل از گزارش‌ها و پیشنهادهای کوچ آگاه هستند.' },
                            ].map((item) => <div key={item.title} className="liquid-card flex items-start gap-4 p-5"><span className="liquid-blob blob-b" aria-hidden /><span className="glass-tile"><item.icon strokeWidth={1.7} aria-hidden /></span><div><h3 className="text-sm font-black text-navy">{item.title}</h3><p className="mt-1 text-sm leading-6 text-navy/55">{item.desc}</p></div></div>)}
                        </div>
                    </div>
                    <div>
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>خدمات ما</span></div>
                        <h2 className="mt-3 text-2xl font-black text-navy">با ما شروع کنید</h2>
                        <div className="mt-7 flex flex-col gap-4">
                            {services.map((service) => <Link key={service.id} href={`/services/${service.slug}`} className="liquid-card group flex items-center gap-4 p-5"><span className="liquid-blob blob-a" aria-hidden /><span className="glass-tile"><Route strokeWidth={1.7} className="size-5" aria-hidden /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-black text-navy transition-colors group-hover:text-brand-700">{service.title}</h3><p className="mt-1 line-clamp-1 text-xs text-navy/45">{service.summary}</p></div><ArrowLeft className="size-4 shrink-0 text-navy/30 transition-colors group-hover:text-brand-600" aria-hidden /></Link>)}
                        </div>
                    </div>
                </div>
            </section>

            {(instructors.length > 0 || coaches.length > 0) && (
                <section className="relative overflow-hidden bg-soft-gray py-12 md:py-16">
                    <div className="ambient ambient-green ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <SectionMedia video={media('team_video')} image={media('team_image')} className="mx-auto mb-8 w-full max-w-3xl" />
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>تیم متخصص ما</span></div>
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <h2 className="mt-3 text-2xl font-black text-navy">آدم‌هایی که کنار شما هستند</h2>
                            <Link href="/team" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 transition-colors hover:text-brand-500">مشاهده همه تیم <ArrowLeft className="size-4" aria-hidden /></Link>
                        </div>
                        {instructors.length > 0 && <div className="mt-8"><div className="mb-4 flex items-center gap-2 text-sm font-black text-navy"><GraduationCap className="size-5 text-brand-600" aria-hidden /> مدرسین و مربیان</div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{instructors.map((member) => <TeamCard key={`instructor-${member.id}`} member={member} kind="instructor" />)}</div></div>}
                        {coaches.length > 0 && <div className="mt-10"><div className="mb-4 flex items-center gap-2 text-sm font-black text-navy"><UsersRound className="size-5 text-brand-600" aria-hidden /> کوچ‌ها و همراهان مسیر رشد</div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{coaches.map((member) => <TeamCard key={`coach-${member.id}`} member={member} kind="coach" />)}</div></div>}
                    </div>
                </section>
            )}

            {testimonials.length > 0 && (
                <section className="relative overflow-hidden bg-white py-12 md:py-16">
                    <div className="ambient ambient-gold ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <SectionMedia video={media('testimonials_video')} image={media('testimonials_image')} className="mx-auto mb-8 w-full max-w-3xl" />
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>اعتماد خانواده‌ها</span></div>
                        <h2 className="mt-3 text-2xl font-black text-navy">آنها چه می‌گویند؟</h2>
                        <div className="mt-8 grid gap-5 md:grid-cols-3">
                            {testimonials.map((t) => <figure key={t.id} className="liquid-card flex flex-col gap-4 p-6"><span className="liquid-blob blob-b" aria-hidden /><blockquote className="flex-1 text-sm leading-7 text-navy/70">«{t.content}»</blockquote><figcaption className="flex items-center gap-3 border-t border-navy/5 pt-4"><span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-deep-green text-sm font-black text-white">{t.name.slice(0, 1)}</span><div><div className="text-sm font-black text-navy">{t.name}</div><div className="text-xs text-navy/45">{t.role}</div></div></figcaption></figure>)}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

AboutIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
