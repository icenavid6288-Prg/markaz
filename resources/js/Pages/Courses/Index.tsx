import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Filter, GraduationCap, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CourseCard, type CourseCardData } from '@/Components/CourseCard';
import { Pagination, type PaginationMeta } from '@/Components/ui/Pagination';
import { PageHeader } from '@/Components/ui/PageHeader';
import { formatNumber } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface CategoryData {
    id: number;
    name: string;
    slug: string;
}

interface PaginatedCourses extends PaginationMeta {
    data: CourseCardData[];
}

const levels = [
    { key: '', label: 'همه سطوح' },
    { key: 'beginner', label: 'مقدماتی' },
    { key: 'intermediate', label: 'متوسط' },
    { key: 'advanced', label: 'پیشرفته' },
];

const sortOptions = [
    { value: 'latest', label: 'جدیدترین دوره‌ها' },
    { value: 'popular', label: 'محبوب‌ترین دوره‌ها' },
    { value: 'price_asc', label: 'ارزان‌ترین' },
    { value: 'price_desc', label: 'گران‌ترین' },
    { value: 'title', label: 'الفبایی' },
];

export default function CoursesIndex() {
    const { courses, categories, filters } = usePage<
        PageProps & {
            courses: PaginatedCourses;
            categories: CategoryData[];
            filters: { q: string; level: string; category: string; sort: string };
        }
    >().props;

    const [q, setQ] = useState(filters.q ?? '');

    useEffect(() => {
        setQ(filters.q ?? '');
    }, [filters.q]);

    const applyFilters = (next: Partial<typeof filters> = {}) => {
        const values = { ...filters, q, ...next };
        const params = Object.fromEntries(
            Object.entries(values).filter(([, value]) => value && value !== 'latest'),
        );
        router.get('/courses', params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        applyFilters({ q });
    };

    const hasFilters = Boolean(filters.q || filters.level || filters.category || filters.sort !== 'latest');

    return (
        <div>
            <PageHeader
                eyebrow="آکادمی مسیر رشد"
                title="دوره‌هایی برای ساختن مهارت‌های آینده"
                subtitle="یادگیری از جایی شروع می‌شود که مسیر مناسب خودت را پیدا کنی. دوره‌های کاربردی مرکز رشد برای نوجوانان، والدین و مدرسین طراحی شده‌اند."
                actions={
                    <Link href="/coaching" className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                        <GraduationCap className="size-4" aria-hidden />
                        مشاوره برای انتخاب مسیر
                    </Link>
                }
            />

            <section className="relative overflow-hidden bg-white py-10 md:py-14">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-teal ambient-b" aria-hidden />
                <div className="container-site relative">
                    <div className="courses-catalog-intro">
                        <div className="flex items-center gap-3">
                            <span className="courses-catalog-icon"><Sparkles className="size-5" aria-hidden /></span>
                            <div>
                                <p className="text-xs font-black text-brand-700">مسیر خودت را انتخاب کن</p>
                                <h2 className="mt-1 text-xl font-black text-navy md:text-2xl">یادگیری با هدف، نه فقط تماشای درس</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 text-xs font-bold text-navy/50">
                            <span className="flex items-center gap-1.5"><BookOpen className="size-4 text-brand-600" /> {formatNumber(courses.total)} دوره</span>
                            <span className="hidden sm:inline">آموزش مرحله‌به‌مرحله و کاربردی</span>
                        </div>
                    </div>

                    <div className="liquid-card relative mt-7 p-4 md:p-5">
                        <span className="liquid-blob blob-a" aria-hidden />
                        <div className="relative flex flex-col gap-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <form onSubmit={submitSearch} className="relative flex-1">
                                    <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/40" aria-hidden />
                                    <input
                                        type="search"
                                        value={q}
                                        onChange={(event) => setQ(event.target.value)}
                                        placeholder="جستجو در عنوان، توضیحات یا مدرس..."
                                        className="w-full rounded-xl border border-navy/10 bg-white/85 py-3 pl-4 pr-11 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                                    />
                                </form>
                                <label className="flex min-w-56 items-center gap-2 rounded-xl border border-navy/10 bg-white/75 px-3 text-sm text-navy/60">
                                    <SlidersHorizontal className="size-4 shrink-0 text-brand-600" aria-hidden />
                                    <span className="sr-only">مرتب‌سازی دوره‌ها</span>
                                    <select value={filters.sort || 'latest'} onChange={(event) => applyFilters({ sort: event.target.value })} className="w-full bg-transparent py-3 text-sm font-bold text-navy outline-none" aria-label="مرتب‌سازی دوره‌ها">
                                        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-navy/5 pt-3 lg:flex-row lg:items-center">
                                <div className="flex items-center gap-2 text-xs font-black text-navy/45"><Filter className="size-4 text-brand-600" aria-hidden /> دسته‌بندی:</div>
                                <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                                    <button type="button" onClick={() => applyFilters({ category: '' })} className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition-all ${!filters.category ? 'bg-deep-green text-white shadow-soft' : 'border border-navy/10 bg-white/70 text-navy/60 hover:border-brand-300 hover:text-brand-700'}`}>همه دسته‌ها</button>
                                    {categories.map((category) => <button key={category.id} type="button" onClick={() => applyFilters({ category: category.slug })} className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition-all ${filters.category === category.slug ? 'bg-deep-green text-white shadow-soft' : 'border border-navy/10 bg-white/70 text-navy/60 hover:border-brand-300 hover:text-brand-700'}`}>{category.name}</button>)}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 border-t border-navy/5 pt-3">
                                <span className="ml-1 text-xs font-black text-navy/45">سطح:</span>
                                {levels.map((level) => <button key={level.key} type="button" onClick={() => applyFilters({ level: level.key })} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${filters.level === level.key || (!filters.level && !level.key) ? 'bg-brand-100 text-brand-800' : 'text-navy/50 hover:bg-brand-50 hover:text-brand-700'}`}>{level.label}</button>)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4 text-xs font-bold text-navy/45">
                        <span>{formatNumber(courses.total)} دوره یافت شد</span>
                        {hasFilters && <Link href="/courses" className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800">حذف فیلترها <ArrowLeft className="size-3.5" /></Link>}
                    </div>

                    {courses.data.length > 0 ? (
                        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.data.map((course) => <CourseCard key={course.id} course={course} />)}
                        </div>
                    ) : (
                        <div className="liquid-card mt-5 flex flex-col items-center gap-3 p-12 text-center">
                            <span className="glass-tile glass-tile-lg"><Search className="size-6" aria-hidden /></span>
                            <p className="text-sm font-bold text-navy/60">دوره‌ای با این مشخصات پیدا نشد.</p>
                            <Link href="/courses" className="text-sm font-bold text-brand-700 hover:text-brand-800">نمایش همه دوره‌ها ←</Link>
                        </div>
                    )}

                    <Pagination meta={courses} path="/courses" filters={{ q: filters.q, level: filters.level, category: filters.category, sort: filters.sort === 'latest' ? undefined : filters.sort }} />
                </div>
            </section>
        </div>
    );
}

CoursesIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
