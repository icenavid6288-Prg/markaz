import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Filter, Headphones, Mic, PlayCircle, Search, ShoppingBag, Star } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { PageHeader } from '@/Components/ui/PageHeader';
import { Pagination, type PaginationMeta } from '@/Components/ui/Pagination';
import { formatNumber, formatPrice } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface CategoryData {
    id: number;
    name: string;
    slug: string;
}

interface ProductData {
    id: number;
    title: string;
    slug: string;
    type: string;
    description?: string | null;
    image?: string | null;
    preview_url?: string | null;
    price: number;
    discount_price?: number | null;
    author?: string | null;
    pages?: number | null;
    category?: { name?: string; slug?: string } | null;
    episodes?: Array<{ id: number; title: string; duration_seconds: number | null; is_free: boolean }>;
}

interface PaginatedProducts extends PaginationMeta {
    data: ProductData[];
}

const typeOptions = [
    { value: '', label: 'همه محصولات' },
    { value: 'book', label: 'کتاب‌ها' },
    { value: 'podcast', label: 'پادکست‌ها' },
    { value: 'digital', label: 'فایل‌های دیجیتال' },
];

const sortOptions = [
    { value: 'latest', label: 'جدیدترین' },
    { value: 'oldest', label: 'قدیمی‌ترین' },
    { value: 'price_asc', label: 'ارزان‌ترین' },
    { value: 'price_desc', label: 'گران‌ترین' },
    { value: 'popular', label: 'محبوب‌ترین' },
    { value: 'title', label: 'الفبایی' },
];

export default function ShopIndex() {
    const { products, categories, featured, filters } = usePage<
        PageProps & {
            products: PaginatedProducts;
            categories: CategoryData[];
            featured: ProductData[];
            filters: { q: string; type: string; category: string; sort: string };
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
        router.get('/shop', params, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitSearch = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ q });
    };

    return (
        <div>
            <PageHeader
                eyebrow="فروشگاه"
                title="کتاب‌ها، پادکست‌ها و محتوای آموزشی"
                subtitle="محصولات آموزشی مجموعه برای همراهی خانواده‌ها و مدرسین؛ نسخه چاپی و دیجیتال."
                actions={
                    <Link href="/cart" className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                        <ShoppingBag className="size-4" aria-hidden /> سبد خرید
                    </Link>
                }
            />

            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative">
                    {featured.length > 0 && (
                        <section className="shop-featured-shell mb-8">
                            <div className="flex flex-wrap items-end justify-between gap-4">
                                <div>
                                    <div className="shop-section-eyebrow"><span /> انتخاب ویژه مرکز</div>
                                    <h2 className="mt-2 text-2xl font-black text-navy md:text-3xl">برای شروع مسیر، از اینجا انتخاب کنید</h2>
                                    <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/55">محصولات منتخب برای یادگیری عمیق‌تر، شنیدن تجربه‌های تازه و همراهی روزمره.</p>
                                </div>
                                <Link href="/shop?sort=popular" className="inline-flex items-center gap-2 text-xs font-black text-brand-700 hover:text-brand-800">مشاهده همه محصولات <ArrowLeft className="size-4" /></Link>
                            </div>
                            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                                {featured.map((item) => {
                                    const isPodcast = item.type === 'podcast';
                                    return (
                                        <Link key={item.id} href={`/shop/${item.slug}`} className="shop-featured-card group">
                                            <div className="shop-featured-art">
                                                {item.image ? <img src={item.image} alt={item.title} loading="lazy" /> : isPodcast ? <Headphones className="size-12" aria-hidden /> : <BookOpen className="size-12" aria-hidden />}
                                                <span>{isPodcast ? 'پادکست' : 'کتاب'}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 text-[0.65rem] font-black text-brand-700"><Star className="size-3.5 fill-gold text-gold" /> انتخاب ویژه</div>
                                                <h3 className="mt-2 line-clamp-2 text-sm font-black leading-6 text-navy group-hover:text-brand-700">{item.title}</h3>
                                                {item.author && <p className="mt-1 text-xs text-navy/45">{item.author}</p>}
                                                <div className="mt-3 flex items-center justify-between gap-2"><span className="text-sm font-black text-brand-700">{formatPrice(item.discount_price ?? item.price)}</span><ArrowLeft className="size-4 text-brand-600 transition-transform group-hover:-translate-x-1" /></div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <div className="liquid-card relative p-4 md:p-5">
                        <span className="liquid-blob blob-a" aria-hidden />
                        <div className="relative flex flex-col gap-4">
                            <div className="flex flex-col gap-3 lg:flex-row">
                                <form onSubmit={submitSearch} className="relative flex-1">
                                    <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/40" aria-hidden />
                                    <input
                                        type="search"
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder="جستجو در عنوان، توضیحات یا نویسنده..."
                                        className="w-full rounded-xl border border-navy/10 bg-white/85 py-3 pl-4 pr-11 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                                    />
                                </form>
                                <label className="flex min-w-52 items-center gap-2 rounded-xl border border-navy/10 bg-white/75 px-3 text-sm text-navy/60">
                                    <Filter className="size-4 shrink-0 text-brand-600" aria-hidden />
                                    <span className="sr-only">دسته‌بندی</span>
                                    <select value={filters.category ?? ''} onChange={(e) => applyFilters({ category: e.target.value })} className="w-full bg-transparent py-3 text-sm font-bold text-navy outline-none" aria-label="فیلتر دسته‌بندی">
                                        <option value="">همه دسته‌ها</option>
                                        {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                                    </select>
                                </label>
                                <label className="flex min-w-52 items-center gap-2 rounded-xl border border-navy/10 bg-white/75 px-3 text-sm text-navy/60">
                                    <span className="text-xs font-black text-brand-700">مرتب‌سازی</span>
                                    <select value={filters.sort ?? 'latest'} onChange={(e) => applyFilters({ sort: e.target.value })} className="w-full bg-transparent py-3 text-sm font-bold text-navy outline-none" aria-label="مرتب‌سازی محصولات">
                                        {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 border-t border-navy/5 pt-3">
                                {typeOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => applyFilters({ type: option.value })}
                                        className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${filters.type === option.value ? 'bg-deep-green text-white shadow-soft' : 'border border-navy/10 bg-white/70 text-navy/60 hover:border-brand-300 hover:text-brand-700'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4 text-xs font-bold text-navy/45">
                        <span>{formatNumber(products.total)} محصول یافت شد</span>
                        {(filters.q || filters.type || filters.category || filters.sort !== 'latest') && <Link href="/shop" className="text-brand-700 hover:text-brand-800">حذف فیلترها</Link>}
                    </div>

                    {products.data.length > 0 ? (
                        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {products.data.map((product) => {
                                const isBook = product.type === 'book';
                                const isPodcast = product.type === 'podcast';
                                return (
                                    <Link key={product.id} href={`/shop/${product.slug}`} className="liquid-card group flex flex-col overflow-hidden">
                                        <span className="liquid-blob blob-a" aria-hidden />
                                        <span className="liquid-blob blob-b" aria-hidden />
                                        <div className="shop-product-art">
                                            {product.image ? <img src={product.image} alt={product.title} loading="lazy" /> : <span className={isPodcast ? 'bg-deep-gradient' : 'bg-gradient-to-br from-brand-600 to-deep-green'}>{isPodcast ? <Headphones className="size-10" aria-hidden /> : <BookOpen className="size-10" aria-hidden />}</span>}
                                            <span className="shop-product-type">{product.category?.name ?? (isPodcast ? 'پادکست' : 'کتاب')}</span>
                                            {product.discount_price !== null && product.discount_price !== undefined && <span className="shop-product-discount">تخفیف</span>}
                                        </div>
                                        <div className="flex items-start gap-4 px-5 pt-4">
                                            <div className="min-w-0 flex-1">
                                                <h2 className="line-clamp-2 text-base font-black leading-7 text-navy transition-colors group-hover:text-brand-700">{product.title}</h2>
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-3 px-5 pb-5">
                                            {product.description && <p className="line-clamp-2 text-sm leading-7 text-navy/55">{product.description}</p>}
                                            {product.author && <p className="text-xs text-navy/45">{isPodcast ? 'تولیدکننده: ' : 'نویسنده: '}{product.author}</p>}
                                            {product.pages ? <p className="text-xs text-navy/45">{formatNumber(product.pages)} صفحه</p> : null}
                                            {product.preview_url && <span className="inline-flex items-center gap-1 text-xs font-black text-brand-700"><PlayCircle className="size-3.5" /> پیش‌نمایش موجود است</span>}
                                            {isPodcast && (product.episodes ?? []).length > 0 && (
                                                <div className="flex flex-col gap-2 border-t border-navy/5 pt-3">
                                                    {(product.episodes ?? []).slice(0, 2).map((episode) => (
                                                        <div key={episode.id} className="flex items-center gap-2 text-xs text-navy/60">
                                                            <PlayCircle className="size-3.5 shrink-0 text-brand-500" aria-hidden />
                                                            <span className="truncate font-bold">{episode.title}</span>
                                                        </div>
                                                    ))}
                                                    <span className="flex items-center gap-1 text-[0.68rem] font-bold text-brand-700"><Mic className="size-3.5" /> {formatNumber((product.episodes ?? []).length)} قسمت</span>
                                                </div>
                                            )}
                                            <div className="mt-auto flex items-end justify-between gap-2 border-t border-navy/5 pt-4">
                                                <span className="text-sm font-black text-brand-700">{formatPrice(product.discount_price ?? product.price)}</span>
                                                <span className="service-more text-xs font-bold text-brand-700">مشاهده <ArrowLeft className="inline size-3.5" aria-hidden /></span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="liquid-card mt-8 flex flex-col items-center gap-3 p-12 text-center">
                            <span className="glass-tile glass-tile-lg"><Search className="size-6" aria-hidden /></span>
                            <p className="text-sm font-bold text-navy/60">محصولی با این مشخصات پیدا نشد.</p>
                            <Link href="/shop" className="text-sm font-bold text-brand-700 hover:text-brand-800">نمایش همه محصولات ←</Link>
                        </div>
                    )}

                    <Pagination meta={products} path="/shop" filters={{ q: filters.q, type: filters.type, category: filters.category, sort: filters.sort === 'latest' ? undefined : filters.sort }} />
                </div>
            </section>
        </div>
    );
}

ShopIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
