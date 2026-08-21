import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Award, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Clock3, HeartHandshake, Route, ShoppingBag, Sparkles, Target, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { CourseCard, type CourseCardData } from '@/Components/CourseCard';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDate, formatDuration, formatNumber, formatPrice } from '@/lib/format';
import type { PageProps } from '@/types';

interface DashboardCourse {
    id: number;
    title: string;
    slug: string;
    thumbnail?: string | null;
    duration_minutes: number;
    progress_percent: number;
    status: string;
}

interface Session {
    id: number;
    scheduled_at?: string | null;
    duration_minutes: number;
    status: string;
    coach?: string | null;
}

interface Goal {
    id: number;
    title: string;
    status: string;
    total_tasks: number;
    completed_tasks: number;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    total: number;
    created_at?: string | null;
    items_count: number;
}

interface Certificate {
    id: number;
    certificate_number: string;
    issued_at: string;
    course: { id: number; title: string } | null;
    url: string;
}

interface Assignment {
    id: number;
    title: string;
    course: string;
    lesson_id?: number | null;
    course_slug?: string | null;
    status: string;
    score?: number | null;
    max_score: number;
    feedback?: string | null;
    submitted_at?: string | null;
    url?: string | null;
}

interface RecommendationCourse extends CourseCardData {
    type: 'course';
}

interface RecommendationService {
    type: 'service';
    title: string;
    slug: string;
    url: string;
    thumbnail?: string | null;
    price?: number | null;
    summary?: string | null;
}

type Recommendation = RecommendationCourse | RecommendationService;

interface DashboardProps {
    onboarding_incomplete: boolean;
    profile: { name: string; avatar?: string | null; role: string };
    stats: {
        courses_count: number;
        average_progress: number;
        active_goals: number;
        upcoming_sessions: number;
    };
    courses: DashboardCourse[];
    sessions: Session[];
    goals: Goal[];
    certificates: Certificate[];
    assignments: Assignment[];
    assignment_stats: { pending: number; graded: number; average_score: number };
    orders: Order[];
    recommendations: Recommendation[];
}

const statusLabels: Record<string, string> = {
    pending: 'در انتظار',
    confirmed: 'تأیید شده',
    active: 'در حال یادگیری',
    completed: 'تکمیل شده',
    paid: 'پرداخت موفق',
};

export default function Dashboard() {
    const { onboarding_incomplete, profile, stats, courses, sessions, goals, certificates, assignments, assignment_stats, orders, recommendations } = usePage<PageProps & DashboardProps>().props;
    const nextCourse = courses[0];
    const nextSession = sessions[0];
    const nextGoal = goals[0];
    const latestOrder = orders[0];

    const quickLinks = [
        {
            label: 'دوره‌های من',
            description: nextCourse ? `ادامه «${nextCourse.title}»` : 'دوره‌های ثبت‌نام‌شده و پیشرفت',
            value: formatNumber(stats.courses_count),
            caption: 'دوره',
            href: '/dashboard/courses',
            icon: BookOpen,
        },
        {
            label: 'مسیر رشد',
            description: nextGoal ? nextGoal.title : 'هدف‌ها و قدم‌های بعدی شما',
            value: formatNumber(stats.active_goals),
            caption: 'هدف فعال',
            href: '/dashboard/goals',
            icon: Target,
        },
        {
            label: 'جلسات کوچینگ',
            description: nextSession ? `جلسه با ${nextSession.coach ?? 'کوچ شما'}` : 'جلسه‌های پیش‌رو و تاریخچه',
            value: formatNumber(stats.upcoming_sessions),
            caption: 'جلسه پیش‌رو',
            href: '/dashboard/sessions',
            icon: CalendarDays,
        },
        {
            label: 'سفارش‌ها',
            description: latestOrder ? `آخرین سفارش ${latestOrder.order_number}` : 'تاریخچه خریدهای شما',
            value: formatNumber(orders.length),
            caption: 'سفارش',
            href: '/dashboard/orders',
            icon: ShoppingBag,
        },
        {
            label: 'گواهینامه‌ها',
            description: certificates[0] ? `گواهینامه «${certificates[0].course?.title ?? ''}»` : 'با تکمیل دوره‌ها گواهینامه بگیرید',
            value: formatNumber(certificates.length),
            caption: 'گواهینامه',
            href: '/dashboard/certificates',
            icon: Award,
        },
    ];

    return (
        <UserDashboardLayout>
            <div className="mx-auto flex max-w-7xl flex-col gap-7">
                {onboarding_incomplete && (
                    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-gradient-to-l from-brand-50 to-emerald-50 p-5">
                        <div className="flex items-center gap-4">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-glow"><Sparkles className="size-5" /></span>
                            <div><strong className="block text-sm font-black text-navy">مسیر رشد شما هنوز ساخته نشده است</strong><p className="mt-1 text-xs font-bold leading-6 text-navy/55">با پاسخ به چند سؤال کوتاه، پیشنهادهای اختصاصی دوره و خدمات برایتان فعال می‌شود.</p></div>
                        </div>
                        <Link href="/dashboard/onboarding" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-black text-white shadow-glow transition-colors hover:bg-brand-600">شروع شناخت مسیر <ArrowLeft className="size-4" /></Link>
                    </section>
                )}
                <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
                    <div className="pointer-events-none absolute -left-16 -top-24 size-72 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
                    <div className="relative grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-200"><Route className="size-3.5" /> نمای کلی مسیر رشد</span>
                            <h2 className="mt-4 text-2xl font-black leading-tight md:text-3xl">سلام {profile.name.split(' ')[0]}، قدم بعدی‌ات آماده است.</h2>
                            <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">از اینجا می‌توانید هر بخش از مسیر یادگیری، هدف‌ها، جلسات و خریدها را جداگانه دنبال کنید.</p>
                            <Link href={nextCourse ? '/dashboard/courses' : '/courses'} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-deep-green transition-colors hover:bg-brand-100">
                                {nextCourse ? 'ادامه دوره‌های من' : 'شروع مسیر رشد'} <ArrowLeft className="size-4" />
                            </Link>
                        </div>
                        <div className="rounded-3xl border border-white/15 bg-white/10 p-5">
                            <div className="flex items-center justify-between text-xs font-bold text-white/65"><span>پیشرفت کلی</span><span className="text-brand-200">{formatNumber(stats.average_progress)}٪</span></div>
                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-l from-brand-300 to-brand-500" style={{ width: `${stats.average_progress}%` }} /></div>
                            <p className="mt-4 text-xs leading-6 text-white/55">برای مشاهده جزئیات پیشرفت هر دوره، وارد بخش «دوره‌های من» شوید.</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="خلاصه وضعیت">
                    {[
                        { label: 'دوره‌های من', value: stats.courses_count, icon: BookOpen },
                        { label: 'میانگین پیشرفت', value: `${formatNumber(stats.average_progress)}٪`, icon: TrendingUp },
                        { label: 'هدف‌های فعال', value: stats.active_goals, icon: Target },
                        { label: 'جلسه پیش‌رو', value: stats.upcoming_sessions, icon: CalendarDays },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/75 p-5 shadow-soft">
                            <span className="panel-stat-icon"><item.icon className="size-5" /></span>
                            <div><strong className="block text-2xl font-black text-navy">{typeof item.value === 'number' ? formatNumber(item.value) : item.value}</strong><span className="text-xs font-bold text-navy/45">{item.label}</span></div>
                        </div>
                    ))}
                </section>

                {recommendations.length > 0 && <section>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><div className="dashboard-eyebrow"><span /> پیشنهاد برای شما</div><h2 className="mt-2 text-xl font-black text-navy">قدم‌های پیشنهادی بر اساس مسیر شما</h2><p className="mt-2 text-sm leading-7 text-navy/50">این پیشنهادها بر اساس هدف و علاقه‌های شما در پرسش‌های «شناخت مسیر» چیده شده‌اند.</p></div><Link href="/courses" className="text-xs font-bold text-brand-700 hover:underline">همه دوره‌ها ←</Link></div>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {recommendations.map((item) => item.type === 'service' ? (
                            <Link key={`s-${item.slug}`} href={item.url} className="liquid-card group flex flex-col gap-4 p-5">
                                <span className="liquid-blob blob-a" aria-hidden />
                                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-deep-green text-white"><HeartHandshake className="size-6" /></span>
                                <div className="flex-1"><h3 className="text-base font-black leading-7 text-navy group-hover:text-brand-700">{item.title}</h3>{item.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-navy/55">{item.summary}</p>}</div>
                                <div className="flex items-center justify-between border-t border-navy/5 pt-4"><span className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-black text-brand-700">خدمت اختصاصی</span>{item.price !== null && item.price !== undefined && <span className="text-sm font-black text-brand-700">{formatPrice(item.price)}</span>}</div>
                            </Link>
                        ) : (
                            <CourseCard key={`c-${item.id ?? item.slug}`} course={item as RecommendationCourse} />
                        ))}
                    </div>
                </section>}

                <section>
                    <div className="mb-4"><div className="dashboard-eyebrow"><span /> دسترسی سریع</div><h2 className="mt-2 text-xl font-black text-navy">مسیرهای پنل شما</h2><p className="mt-2 text-sm text-navy/50">هر بخش صفحه مستقل خودش را دارد؛ برای جزئیات روی کارت مربوط کلیک کنید.</p></div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {quickLinks.map((item) => (
                            <Link key={item.href} href={item.href} className="group flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
                                <item.icon className="size-7 shrink-0 text-brand-600 transition-transform group-hover:scale-110" aria-hidden />
                                <div className="min-w-0 flex-1"><h3 className="text-sm font-black text-navy group-hover:text-brand-700">{item.label}</h3><p className="mt-1 truncate text-xs font-bold text-navy/45">{item.description}</p></div>
                                <div className="text-left"><strong className="block text-lg font-black text-brand-700">{item.value}</strong><span className="text-[0.65rem] font-bold text-navy/40">{item.caption}</span></div>
                                <ArrowLeft className="size-4 shrink-0 text-navy/25 transition-transform group-hover:-translate-x-1 group-hover:text-brand-600" aria-hidden />
                            </Link>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><div className="dashboard-eyebrow"><span /> تکلیف‌ها</div><h2 className="mt-2 text-xl font-black text-navy">تکلیف‌های من</h2><p className="mt-2 text-sm text-navy/50">وضعیت ارسال، نمرات و بازخورد مدرس از همه دوره‌ها.</p></div><Link href="/dashboard/assignments" className="text-xs font-bold text-brand-700 hover:underline">مشاهده همه تکالیف ←</Link></div>
                    <div className="mb-4 grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-soft"><span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Clock3 className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{formatNumber(assignment_stats.pending)}</strong><span className="text-[0.68rem] font-bold text-navy/45">در انتظار تصحیح</span></div></div>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-soft"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{formatNumber(assignment_stats.graded)}</strong><span className="text-[0.68rem] font-bold text-navy/45">تصحیح‌شده</span></div></div>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-soft"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><ClipboardList className="size-5" /></span><div><strong className="block text-xl font-black text-navy">{formatNumber(assignment_stats.average_score)}</strong><span className="text-[0.68rem] font-bold text-navy/45">میانگین نمره</span></div></div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {assignments.length > 0 ? assignments.map((assignment) => <Link key={assignment.id} href={assignment.url ?? '/dashboard/assignments'} className="group flex flex-wrap items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
                            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${assignment.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{assignment.status === 'graded' ? <CheckCircle2 className="size-5" /> : <Clock3 className="size-5" />}</span>
                            <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-black text-navy group-hover:text-brand-700">{assignment.title}</h3><p className="mt-1 truncate text-xs font-bold text-navy/45">{assignment.course}{assignment.submitted_at ? ` · ارسال ${formatDate(assignment.submitted_at)}` : ''}</p></div>
                            {assignment.status === 'graded' ? <div className="shrink-0 text-left"><div className="text-base font-black text-brand-700">{formatNumber(assignment.score ?? 0)} از {formatNumber(assignment.max_score)}</div>{assignment.feedback && <div className="mt-1 max-w-56 truncate text-[0.68rem] font-bold text-navy/45">«{assignment.feedback}»</div>}</div> : <span className="shrink-0 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">در انتظار تصحیح</span>}
                            <ArrowLeft className="size-4 shrink-0 text-navy/25 transition-transform group-hover:-translate-x-1 group-hover:text-brand-600" />
                        </Link>) : <div className="rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-10 text-center"><ClipboardList className="mx-auto size-8 text-brand-500" /><p className="mt-3 text-sm font-bold text-navy/50">هنوز تکلیفی ارسال نکرده‌اید. تکالیف هر دوره را از داخل پلیر دوره ارسال کنید.</p><Link href="/dashboard/courses" className="mt-3 inline-block text-xs font-black text-brand-700">رفتن به دوره‌های من ←</Link></div>}
                    </div>
                </section>

                <section className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div><div className="flex items-center gap-2 text-xs font-black text-brand-700"><CheckCircle2 className="size-4" /> یادآوری مسیر</div><p className="mt-2 text-sm font-bold leading-7 text-navy/65">جزئیات هر بخش در صفحه اختصاصی آن نگهداری می‌شود تا پنل شما خلوت و قابل استفاده بماند.</p></div>
                        {nextCourse ? <div className="text-left text-xs font-bold text-navy/45">{formatDuration(nextCourse.duration_minutes)} · {formatNumber(nextCourse.progress_percent)}٪ پیشرفت</div> : nextSession?.scheduled_at ? <div className="text-left text-xs font-bold text-navy/45">جلسه بعدی: {formatDate(nextSession.scheduled_at)}</div> : null}
                    </div>
                </section>
            </div>
        </UserDashboardLayout>
    );
}

Dashboard.layout = (page: ReactNode) => page;
