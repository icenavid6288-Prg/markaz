import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Clock3, Filter, Newspaper, PlayCircle, Search } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { PageHeader } from '@/Components/ui/PageHeader';
import { Pagination, type PaginationMeta } from '@/Components/ui/Pagination';
import { formatDate, formatNumber } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface CategoryData {
    id: number;
    name: string;
    slug: string;
}

interface PostData {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    cover_image?: string | null;
    video_url?: string | null;
    reading_time?: number | null;
    published_at?: string | null;
    author?: { name?: string } | null;
    category?: { name?: string; slug?: string } | null;
}

interface PaginatedPosts extends PaginationMeta {
    data: PostData[];
}

const sortOptions = [
    { value: 'latest', label: 'جدیدترین' },
    { value: 'oldest', label: 'قدیمی‌ترین' },
    { value: 'popular', label: 'محبوب‌ترین' },
    { value: 'reading_time', label: 'کوتاه‌ترین مطالعه' },
];

export default function BlogIndex() {
    const { posts, featured, categories, filters } = usePage<
        PageProps & {
            posts: PaginatedPosts;
            featured: PostData | null;
            categories: CategoryData[];
            filters: { q: string; category: string; sort: string };
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
        router.get('/blog', params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ q });
    };

    return (
        <div>
            <PageHeader
                eyebrow="بلاگ و دانش‌نامه"
                title="بخوانید، یاد بگیرید، همراه شوید"
                subtitle="مقالات تخصصی درباره استعدادیابی، کوچینگ نوجوان، مهارت‌های آینده و تربیت؛ نوشته‌شده برای خانواده‌ها و مدرسین."
            />

            <section className="blog-index-content relative overflow-hidden py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative">
                    <div className="liquid-card relative p-4 md:p-5">
                        <span className="liquid-blob blob-a" aria-hidden />
                        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center">
                            <form onSubmit={submitSearch} className="relative flex-1">
                                <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/40" aria-hidden />
                                <input
                                    type="search"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="جستجو در عنوان و خلاصه مقالات..."
                                    className="w-full rounded-xl border border-navy/10 bg-white/85 py-3 pl-4 pr-11 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                                />
                            </form>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <label className="flex min-w-48 items-center gap-2 rounded-xl border border-navy/10 bg-white/75 px-3 text-sm text-navy/60">
                                    <Filter className="size-4 shrink-0 text-brand-600" aria-hidden />
                                    <span className="sr-only">دسته‌بندی</span>
                                    <select
                                        value={filters.category ?? ''}
                                        onChange={(e) => applyFilters({ category: e.target.value })}
                                        className="w-full bg-transparent py-3 text-sm font-bold text-navy outline-none"
                                        aria-label="فیلتر دسته‌بندی"
                                    >
                                        <option value="">همه دسته‌ها</option>
                                        {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                                    </select>
                                </label>
                                <label className="flex min-w-48 items-center gap-2 rounded-xl border border-navy/10 bg-white/75 px-3 text-sm text-navy/60">
                                    <span className="text-xs font-black text-brand-700">مرتب‌سازی</span>
                                    <select
                                        value={filters.sort ?? 'latest'}
                                        onChange={(e) => applyFilters({ sort: e.target.value })}
                                        className="w-full bg-transparent py-3 text-sm font-bold text-navy outline-none"
                                        aria-label="مرتب‌سازی مقالات"
                                    >
                                        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* فیلتر سریع دسته‌بندی */}
                    {categories.length > 0 && (
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => applyFilters({ category: '' })}
                                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${!filters.category ? 'bg-accent text-white shadow-glow' : 'border border-navy/10 bg-white text-navy/60 hover:border-brand-200 hover:text-brand-700'}`}
                            >
                                همه مقالات
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => applyFilters({ category: category.slug })}
                                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${filters.category === category.slug ? 'bg-accent text-white shadow-glow' : 'border border-navy/10 bg-white text-navy/60 hover:border-brand-200 hover:text-brand-700'}`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 flex items-center justify-between gap-4 text-xs font-bold text-navy/45">
                        <span>{formatNumber(posts.total)} مقاله یافت شد</span>
                        {(filters.q || filters.category || filters.sort !== 'latest') && (
                            <Link href="/blog" className="text-brand-700 hover:text-brand-800">حذف فیلترها</Link>
                        )}
                    </div>

                    {featured && (
                        <Link href={`/blog/${featured.slug}`} className="liquid-card group mt-6 grid gap-6 overflow-hidden p-0 md:grid-cols-2">
                            <span className="liquid-blob blob-a" aria-hidden />
                            <span className="liquid-blob blob-b" aria-hidden />
                            <div className="relative min-h-56 overflow-hidden">
                                {featured.cover_image ? (
                                    <img src={featured.cover_image} alt={featured.title} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-600 to-deep-green text-white"><Newspaper className="size-16" /></div>
                                )}
                                <span className="absolute right-4 top-4 rounded-xl bg-white/85 px-3 py-1.5 text-xs font-black text-brand-700 backdrop-blur-md">مقاله ویژه</span>
                            </div>
                            <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                                <div className="flex flex-wrap items-center gap-4 text-xs text-navy/45">
                                    {featured.category?.name && <span className="rounded-lg bg-brand-50 px-2 py-1 font-bold text-brand-700">{featured.category.name}</span>}
                                    {featured.author?.name && <span className="font-bold">{featured.author.name}</span>}
                                    {featured.published_at && <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {formatDate(featured.published_at)}</span>}
                                    {featured.reading_time ? <span className="flex items-center gap-1"><Clock3 className="size-3.5" /> {formatNumber(featured.reading_time)} دقیقه</span> : null}
                                    {featured.video_url && <span className="flex items-center gap-1 text-brand-700"><PlayCircle className="size-3.5" /> ویدیویی</span>}
                                </div>
                                <h2 className="text-xl font-black leading-8 text-navy transition-colors group-hover:text-brand-700 md:text-2xl">{featured.title}</h2>
                                <p className="line-clamp-3 text-sm leading-7 text-navy/55">{featured.excerpt}</p>
                                <span className="service-more text-sm font-bold text-brand-700">خواندن مقاله <ArrowLeft className="inline size-4" aria-hidden /></span>
                            </div>
                        </Link>
                    )}

                    {posts.data.length > 0 ? (
                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {posts.data.map((post) => (
                                <Link key={post.id} href={`/blog/${post.slug}`} className="liquid-card group flex min-h-[25rem] flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lift">
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <div className="relative aspect-[16/10] overflow-hidden">
                                        {post.cover_image ? <img src={post.cover_image} alt={post.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex size-full items-center justify-center bg-gradient-to-br from-brand-100 to-emerald-50 text-brand-400"><Newspaper className="size-10" /></div>}
                                    </div>
                                    <div className="flex flex-1 flex-col gap-3 p-5">
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-navy/45">
                                            {post.category?.name && <span className="font-bold text-brand-700">{post.category.name}</span>}
                                            {post.published_at && <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {formatDate(post.published_at)}</span>}
                                            {post.video_url && <span className="flex items-center gap-1 text-brand-700"><PlayCircle className="size-3.5" /> ویدیویی</span>}
                                        </div>
                                        <h2 className="line-clamp-2 text-base font-black leading-7 text-navy transition-colors group-hover:text-brand-700">{post.title}</h2>
                                        <p className="line-clamp-2 flex-1 text-sm leading-7 text-navy/55">{post.excerpt}</p>
                                        <span className="mt-auto inline-flex items-center gap-2 text-xs font-black text-brand-700 transition-all group-hover:gap-3">خواندن مقاله <ArrowLeft className="size-3.5" aria-hidden /></span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="liquid-card mt-8 flex flex-col items-center gap-3 p-12 text-center">
                            <span className="glass-tile glass-tile-lg"><Search className="size-6" aria-hidden /></span>
                            <p className="text-sm font-bold text-navy/60">مقاله‌ای با این مشخصات پیدا نشد.</p>
                            <Link href="/blog" className="text-sm font-bold text-brand-700 hover:text-brand-800">نمایش همه مقالات ←</Link>
                        </div>
                    )}

                    <Pagination meta={posts} path="/blog" filters={{ q: filters.q, category: filters.category, sort: filters.sort === 'latest' ? undefined : filters.sort }} />
                </div>
            </section>
        </div>
    );
}

BlogIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
