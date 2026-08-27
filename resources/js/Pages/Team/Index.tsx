import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowDown, BriefcaseBusiness, Check, GraduationCap, HeartHandshake, Sparkles, Star, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface TeamProfile {
    id: number;
    name: string;
    avatar?: string | null;
    specialty?: string | null;
    bio?: string | null;
    experience_years?: number | null;
    rating?: number | null;
    is_featured?: boolean;
    role?: string | null;
    profile_id?: number | null;
}

interface TeamMemberData {
    id: number;
    name: string;
    title?: string | null;
    avatar?: string | null;
    bio?: string | null;
    specialties?: string[] | null;
    is_featured?: boolean;
    role?: string | null;
}

function Avatar({ src, name, large = false }: { src?: string | null; name: string; large?: boolean }) {
    const size = large ? 'size-20 md:size-24' : 'size-14';
    return src ? (
        <img src={src} alt={name} className={`${size} shrink-0 rounded-2xl object-cover shadow-lift`} />
    ) : (
        <span className={`flex ${size} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-deep-green ${large ? 'text-3xl' : 'text-lg'} font-black text-white shadow-lift`}>
            {name.slice(0, 1)}
        </span>
    );
}

type PageFieldMap = Record<string, { value?: string }>;

function TeamHero({ fields, instructors, coaches, team }: { fields: PageFieldMap; instructors: TeamProfile[]; coaches: TeamProfile[]; team: TeamMemberData[] }) {
    const value = (key: string, fallback: string) => {
        const raw = fields[key]?.value;
        return raw && raw.trim() ? raw.trim() : fallback;
    };
    const heroImage = value('hero_image', '');
    const stats = [
        { id: 'instructors', label: 'مدرس و مربی', count: instructors.length, icon: GraduationCap },
        { id: 'coaches', label: 'کوچ همراه', count: coaches.length, icon: HeartHandshake },
        { id: 'team', label: 'همکار مجموعه', count: team.length, icon: UsersRound },
    ];

    return (
        <section className="relative isolate overflow-hidden bg-deep-gradient pb-12 pt-28 text-white md:pb-16 md:pt-36">
            <div className="pointer-events-none absolute -right-28 -top-28 size-[30rem] rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -left-24 bottom-[-12rem] size-[28rem] rounded-full bg-gold/10 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden style={{ backgroundImage: 'linear-gradient(90deg, rgb(255 255 255 / 0.32) 1px, transparent 1px), linear-gradient(rgb(255 255 255 / 0.20) 1px, transparent 1px)', backgroundSize: '5rem 5rem' }} />
            <div className="container-site relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                <div className="order-2 lg:order-1">
                    <div className="hero-kicker text-brand-200"><span className="hero-kicker-line bg-brand-400" /><UsersRound className="size-3.5" aria-hidden /><span>{value('hero_eyebrow', 'تیم ما')}</span></div>
                    <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.35] md:text-6xl md:leading-[1.25]">{value('hero_title', 'مدرس‌ها، کوچ‌ها و همکارانی که مسیر را می‌سازند')}</h1>
                    <p className="mt-5 max-w-2xl text-sm leading-8 text-white/70 md:text-base md:leading-9">{value('hero_subtitle', 'هر عضو این تیم، بخشی از مسیر رشد فرزند شماست؛ از مدرس‌های مهارت‌های آینده تا کوچ‌های اختصاصی و کارشناسان پشتیبان.')}</p>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:bg-accent-strong"><Sparkles className="size-4" aria-hidden /> گفتگو با تیم ما</Link>
                        <a href="#instructors" className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-white"><ArrowDown className="size-4" aria-hidden /> اعضای تیم</a>
                    </div>
                    <div className="mt-9 grid max-w-2xl grid-cols-3 divide-x divide-x-reverse divide-white/15 rounded-2xl border border-white/10 bg-white/[0.07] p-1 backdrop-blur-md">
                        {stats.map((stat) => {
                            const Icon = stat.icon;
                            return <a key={stat.id} href={`#${stat.id}`} className="group rounded-xl px-3 py-4 text-center transition-colors hover:bg-white/10 sm:px-5"><Icon className="mx-auto size-4 text-brand-300 transition-transform group-hover:-translate-y-0.5" aria-hidden /><strong className="mt-1 block text-xl font-black md:text-2xl">{stat.count}</strong><span className="block text-[0.62rem] font-bold text-white/55 md:text-xs">{stat.label}</span></a>;
                        })}
                    </div>
                </div>
                <div className="order-1 mx-auto w-full max-w-xl lg:order-2">
                    <div className="relative rounded-[2rem] border border-white/20 bg-white/10 p-2 shadow-[0_2rem_5rem_-2rem_rgb(0_0_0_/_0.65)] backdrop-blur-sm md:p-3">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-brand-500/40 via-deep-green to-navy">
                            {heroImage ? <img src={heroImage} alt="اعضای تیم مرکز رشد و کارآفرینی دکتر بیدی" className="size-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><div className="absolute size-64 rounded-full border border-white/20 md:size-80" /><div className="absolute size-48 rounded-full border border-brand-300/30 md:size-60" /><div className="relative flex size-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-brand-400 to-deep-green text-white shadow-lift md:size-36"><UsersRound className="size-14 md:size-16" strokeWidth={1.4} aria-hidden /></div></div>}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-deep-green/80 via-transparent to-white/10" />
                            <div className="absolute bottom-4 right-4 left-4 flex items-end justify-between gap-3"><div><span className="text-[0.62rem] font-black text-brand-200">یک تیم، یک مسیر</span><strong className="mt-1 block text-base font-black text-white md:text-lg">کنار خانواده‌ها تا رسیدن به آینده</strong></div><span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-gold backdrop-blur-md"><Check className="size-5" aria-hidden /></span></div>
                        </div>
                        <div className="absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-white/20 bg-white px-4 py-3 text-navy shadow-lift sm:flex"><span className="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><HeartHandshake className="size-5" aria-hidden /></span><span><strong className="block text-xs font-black">همراهی واقعی</strong><small className="block text-[0.62rem] font-bold text-navy/45">تخصص + تجربه + همدلی</small></span></div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ProfileCard({ member, kind, href }: { member: TeamProfile; kind: 'instructor' | 'coach'; href?: string }) {
    const Icon = kind === 'instructor' ? GraduationCap : BriefcaseBusiness;
    const card = (
        <article className="liquid-card group h-full p-5">
            <span className="liquid-blob blob-a" aria-hidden />
            <span className="liquid-blob blob-b" aria-hidden />
            <div className="relative z-10 flex items-start gap-4">
                <Avatar src={member.avatar} name={member.name} />
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
                {member.experience_years ? <span>{member.experience_years} سال تجربه</span> : null}
                {kind === 'coach' && member.rating ? (
                    <span className="flex items-center gap-1 text-gold"><Star className="size-3.5 fill-gold" aria-hidden /> {member.rating}</span>
                ) : null}
                {href && (
                    <span className="mr-auto inline-flex items-center gap-1 text-brand-700 transition-colors hover:text-brand-500">
                        {kind === 'instructor' ? 'صفحه مدرس' : 'صفحه کوچ'} <ArrowLeft className="size-3.5" aria-hidden />
                    </span>
                )}
            </div>
        </article>
    );

    return href ? <Link href={href} className="block h-full">{card}</Link> : card;
}

function TeamCard({ member }: { member: TeamMemberData }) {
    return (
        <article className="liquid-card group p-5">
            <span className="liquid-blob blob-a" aria-hidden />
            <span className="liquid-blob blob-b" aria-hidden />
            <div className="relative z-10 flex items-start gap-4">
                <Avatar src={member.avatar} name={member.name} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-navy">{member.name}</h3>
                        {member.is_featured && <span className="rounded-lg bg-gold/15 px-2 py-0.5 text-[0.62rem] font-black text-gold">منتخب مجموعه</span>}
                    </div>
                    {member.role && <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-brand-700"><HeartHandshake className="size-3.5" aria-hidden /> {member.role}</p>}
                </div>
            </div>
            {member.bio && <p className="relative z-10 mt-4 line-clamp-2 text-sm leading-6 text-navy/55">{member.bio}</p>}
            {member.specialties && member.specialties.length > 0 && (
                <div className="relative z-10 mt-4 flex flex-wrap gap-1.5">
                    {member.specialties.map((item) => (
                        <span key={item} className="rounded-lg bg-brand-50 px-2.5 py-1 text-[0.65rem] font-black text-brand-700">{item}</span>
                    ))}
                </div>
            )}
        </article>
    );
}

function EmptyGroup({ label }: { label: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white/60 p-10 text-center">
            <UsersRound className="mx-auto size-8 text-navy/25" aria-hidden />
            <p className="mt-3 text-sm font-bold text-navy/45">{label} به‌زودی معرفی می‌شوند.</p>
        </div>
    );
}

export default function TeamIndex() {
    const { instructors, coaches, team, pageContent } = usePage<
        PageProps & {
            instructors: TeamProfile[];
            coaches: TeamProfile[];
            team: TeamMemberData[];
        }
    >().props;
    const fields = pageContent?.fields ?? {};

    return (
        <div>
            <TeamHero fields={fields} instructors={instructors} coaches={coaches} team={team} />

            {instructors.length > 0 && (
                <section id="instructors" className="relative overflow-hidden bg-white py-12 md:py-16">
                    <div className="ambient ambient-green ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>مدرس‌های مهارت‌های آینده</span></div>
                        <h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">مدرس‌ها و مربی‌ها</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/55">یادگیری از جایی شروع می‌شود که یک مدرسِ خوب کنار نوجوان می‌ایستد؛ این‌ها کسانی هستند که دوره‌ها را می‌سازند و همراهی می‌کنند.</p>
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {instructors.map((member) => <ProfileCard key={`instructor-${member.profile_id ?? 'team-' + member.id}`} member={member} kind="instructor" href={member.profile_id ? `/instructors/${member.profile_id}` : undefined} />)}
                        </div>
                    </div>
                </section>
            )}

            {coaches.length > 0 && (
                <section id="coaches" className="relative overflow-hidden bg-soft-gray/70 py-12 md:py-16">
                    <div className="ambient ambient-gold ambient-b" aria-hidden />
                    <div className="container-site relative">
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>کوچ‌های مسیر آینده</span></div>
                        <h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">کوچ‌های اختصاصی</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/55">در جلسات یک‌به‌یک کوچینگ، کوچ‌های ما نوجوان را قدم‌به‌قدم در کشف استعداد، ساخت مهارت و طراحی مسیر همراهی می‌کنند.</p>
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {coaches.map((member) => <ProfileCard key={`coach-${member.profile_id ?? 'team-' + member.id}`} member={member} kind="coach" href={member.profile_id ? `/coaches/${member.profile_id}` : undefined} />)}
                        </div>
                    </div>
                </section>
            )}

            {team.length > 0 && (
                <section id="team" className="relative overflow-hidden bg-white py-12 md:py-16">
                    <div className="ambient ambient-green ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>بقیه تیم</span></div>
                        <h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">پشتیبانان و همکاران مجموعه</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/55">کارشناسان پذیرش، پشتیبانی آموزشی و همکارانی که پشت صحنه‌ی این مسیر ایستاده‌اند تا هر خانواده‌ای بهترین تجربه را داشته باشد.</p>
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {team.map((member) => <TeamCard key={member.id} member={member} />)}
                        </div>
                    </div>
                </section>
            )}

            {instructors.length === 0 && coaches.length === 0 && team.length === 0 && (
                <section className="relative overflow-hidden bg-white py-12 md:py-16">
                    <div className="container-site relative"><EmptyGroup label="اعضای تیم" /></div>
                </section>
            )}

            <section className="relative overflow-hidden bg-deep-gradient py-12 text-white md:py-16">
                <div className="ambient ambient-teal ambient-a" aria-hidden />
                <div className="container-site relative flex flex-col items-center text-center">
                    <h2 className="text-2xl font-black md:text-3xl">می‌خواهید با ما همراه شوید؟</h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">اگر مدرس، کوچ یا کارشناس حوزه‌ی رشد نوجوان هستید و دوست دارید به این تیم بپیوندید، به ما پیام بدهید.</p>
                    <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-deep-green transition-all hover:bg-brand-100">
                        عضویت در تیم <ArrowLeft className="size-4" aria-hidden />
                    </Link>
                </div>
            </section>
        </div>
    );
}

TeamIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
