import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    CalendarClock,
    FileQuestion,
    GraduationCap,
    HeartHandshake,
    ListChecks,
    ListVideo,
    Target,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { CourseCard, type CourseCardData } from '@/Components/CourseCard';
import { StatCard } from '@/Components/ui/StatCard';
import { formatNumber } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface InstructorData {
    id: number;
    name: string;
    avatar?: string | null;
    specialty?: string | null;
    bio?: string | null;
    experience_years?: number | null;
    is_featured?: boolean;
}

interface QuizData {
    id: number;
    title: string;
    description?: string | null;
    passing_score: number;
    time_limit_minutes?: number | null;
    questions_count: number;
    course?: { title: string; slug: string } | null;
    lesson?: { title: string } | null;
}

function ProfileAvatar({ instructor, large = false }: { instructor: InstructorData; large?: boolean }) {
    const size = large ? 'size-28 md:size-40' : 'size-14';
    return instructor.avatar ? (
        <img
            src={instructor.avatar}
            alt={instructor.name}
            className={`${size} shrink-0 rounded-3xl object-cover shadow-lift ring-4 ring-white/15`}
        />
    ) : (
        <span className={`flex ${size} shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-deep-green text-4xl font-black text-white shadow-lift ring-4 ring-white/15`}>
            {instructor.name.slice(0, 1)}
        </span>
    );
}

function QuizRow({ quiz }: { quiz: QuizData }) {
    return (
        <article className="liquid-card group flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <span className="liquid-blob blob-a" aria-hidden />
            <span className="glass-tile shrink-0"><FileQuestion className="size-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-navy transition-colors group-hover:text-brand-700">{quiz.title}</h3>
                    {quiz.course && <span className="rounded-lg bg-brand-50 px-2 py-0.5 text-[0.62rem] font-black text-brand-700">آزمون دوره</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-navy/45">
                    {quiz.course && <Link href={`/courses/${quiz.course.slug}`} className="transition-colors hover:text-brand-700">{quiz.course.title}</Link>}
                    {quiz.lesson?.title && <span className="text-navy/35">{quiz.lesson.title}</span>}
                    {quiz.description && <span className="line-clamp-1 text-navy/35">{quiz.description}</span>}
                </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs font-bold text-navy/50">
                <span className="flex items-center gap-1"><FileQuestion className="size-3.5" aria-hidden /> {formatNumber(quiz.questions_count)} سؤال</span>
                <span className="flex items-center gap-1 text-brand-700"><Target className="size-3.5" aria-hidden /> قبولی {formatNumber(quiz.passing_score)}٪</span>
                {quiz.time_limit_minutes ? <span className="flex items-center gap-1"><CalendarClock className="size-3.5" aria-hidden /> {formatNumber(quiz.time_limit_minutes)} دقیقه</span> : null}
            </div>
            {quiz.course && (
                <Link href={`/courses/${quiz.course.slug}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-black text-white shadow-glow transition-colors group-hover:bg-brand-700">
                    مشاهده دوره <ArrowLeft className="size-3.5" aria-hidden />
                </Link>
            )}
        </article>
    );
}

export default function InstructorShow() {
    const { instructor, stats, courses, quizzes } = usePage<
        PageProps & { instructor: InstructorData; stats: { courses: number; lessons: number; students: number; quizzes: number }; courses: CourseCardData[]; quizzes: QuizData[] }
    >().props;

    return (
        <div>
            <section className="reference-hero relative overflow-hidden pb-16 pt-28 md:pb-20 md:pt-32">
                <div className="pointer-events-none absolute -left-24 top-8 size-80 rounded-full bg-brand-400/15 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -right-20 bottom-0 size-64 rounded-full bg-gold/10 blur-3xl" aria-hidden />
                <div className="container-site relative">
                    <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
                        <ProfileAvatar instructor={instructor} large />
                        <div className="min-w-0 flex-1">
                            <div className="hero-kicker">
                                <span className="hero-kicker-line" />
                                <GraduationCap className="size-3.5 text-brand-300" aria-hidden />
                                <span>مدرس مهارت‌های آینده</span>
                            </div>
                            <h1 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">{instructor.name}</h1>
                            {instructor.specialty && <p className="mt-2 text-sm font-black text-brand-300 md:text-base">{instructor.specialty}</p>}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {instructor.is_featured && <span className="rounded-lg bg-gold/15 px-2.5 py-1 text-[0.65rem] font-black text-gold">منتخب مجموعه</span>}
                                {instructor.experience_years ? <span className="rounded-lg border border-white/15 px-2.5 py-1 text-[0.65rem] font-black text-white/70">{formatNumber(instructor.experience_years)} سال تجربه</span> : null}
                                {stats.courses > 0 && <span className="rounded-lg border border-white/15 px-2.5 py-1 text-[0.65rem] font-black text-white/70">{formatNumber(stats.courses)} دوره فعال</span>}
                            </div>
                            {instructor.bio && <p className="mt-4 max-w-2xl text-sm leading-8 text-white/70 md:text-base md:leading-9">{instructor.bio}</p>}
                            <div className="mt-7 flex flex-wrap items-center gap-3">
                                {stats.courses > 0 && (
                                    <a href="#courses" className="inline-flex min-h-[3rem] items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:bg-accent-strong">
                                        مشاهده دوره‌ها <ArrowLeft className="size-4" aria-hidden />
                                    </a>
                                )}
                                <Link href="/contact" className="inline-flex items-center gap-2 rounded-2xl border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                                    <HeartHandshake className="size-4" aria-hidden /> گفتگو با ما
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="reference-stat-section py-10 md:py-12">
                <div className="container-site">
                    <div className="reference-stat-bar grid grid-cols-2 gap-0 md:grid-cols-4">
                        <StatCard dark icon={BookOpen} value={stats.courses} label="دوره فعال" />
                        <StatCard dark icon={ListVideo} value={stats.lessons} label="درس آموزشی" />
                        <StatCard dark icon={Users} value={stats.students} label="دانش‌آموز همراه" />
                        <StatCard dark icon={ListChecks} value={stats.quizzes} label="آزمون و ارزیابی" />
                    </div>
                </div>
            </section>

            <section id="courses" className="relative scroll-mt-24 overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="container-site relative">
                    <div className="hero-kicker"><span className="hero-kicker-line" /><span>دوره‌های این مدرس</span></div>
                    <h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">دوره‌هایی که {instructor.name} می‌سازد</h2>
                    {courses.length > 0 ? (
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course) => <CourseCard key={course.id} course={course} />)}
                        </div>
                    ) : (
                        <div className="mt-8 rounded-2xl border border-dashed border-navy/15 bg-white/60 p-10 text-center">
                            <BookOpen className="mx-auto size-8 text-navy/25" aria-hidden />
                            <p className="mt-3 text-sm font-bold text-navy/45">دوره‌های این مدرس به‌زودی منتشر می‌شوند.</p>
                        </div>
                    )}
                </div>
            </section>

            {quizzes.length > 0 && (
                <section className="relative overflow-hidden bg-soft-gray/70 py-12 md:py-16">
                    <div className="ambient ambient-gold ambient-b" aria-hidden />
                    <div className="container-site relative">
                        <div className="hero-kicker"><span className="hero-kicker-line" /><span>آزمون‌ها و ارزیابی</span></div>
                        <h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">سنجش یادگیری در مسیر</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/55">هر دوره با آزمون‌های کاربردی همراه است تا یادگیری نوجوان قابل اندازه‌گیری باشد؛ این‌ها آزمون‌های دوره‌های {instructor.name} هستند.</p>
                        <div className="mt-8 flex flex-col gap-4">
                            {quizzes.map((quiz) => <QuizRow key={quiz.id} quiz={quiz} />)}
                        </div>
                    </div>
                </section>
            )}

            <section className="relative overflow-hidden bg-deep-gradient py-12 text-white md:py-16">
                <div className="ambient ambient-teal ambient-a" aria-hidden />
                <div className="container-site relative flex flex-col items-center text-center">
                    <h2 className="text-2xl font-black md:text-3xl">می‌خواهید فرزندتان در دوره‌های {instructor.name} همراه شود؟</h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">با کارشناسان ما گفتگو کنید تا مناسب‌ترین مسیر رشد را برای نوجوانتان انتخاب کنیم.</p>
                    <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-deep-green transition-all hover:bg-brand-100">
                        رزرو مشاوره رایگان <ArrowLeft className="size-4" aria-hidden />
                    </Link>
                </div>
            </section>
        </div>
    );
}

InstructorShow.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
