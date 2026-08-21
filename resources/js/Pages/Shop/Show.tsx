import { Link, useForm, usePage } from '@inertiajs/react';
import { ReviewComposer, type ExistingReviewData } from '@/Components/ReviewComposer';
import { ArrowLeft, BookOpen, Download, ExternalLink, Eye, Headphones, PlayCircle, ShoppingBag, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { PodcastPlayer } from '@/Components/PodcastPlayer';
import { PageHeader } from '@/Components/ui/PageHeader';
import { formatDate, formatNumber, formatPrice } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

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
    download_price?: number | null;
    download_discount_price?: number | null;
    has_preview_file?: boolean;
    has_download_edition?: boolean;
    can_view_preview?: boolean;
    can_download?: boolean;
    preview_endpoint?: string | null;
    download_endpoint?: string | null;
    author?: string | null;
    pages?: number | null;
    publisher?: string | null;
    isbn?: string | null;
    audio_duration_seconds?: number | null;
    episodes?: Array<{ id: number; title: string; description?: string | null; audio_url?: string | null; duration_seconds: number | null; is_free: boolean }>;
    reviews?: Array<{ id: number; name: string; avatar?: string | null; rating: number; title?: string | null; body?: string | null; created_at?: string | null }>;
    review_summary?: { count: number; average: number };
    my_review?: ExistingReviewData | null;
    can_review?: boolean;
}

export default function ShopShow() {
    const { product, related, auth } = usePage<PageProps & { product: ProductData; related: ProductData[] }>().props;
    const cartForm = useForm({ quantity: 1, purchase_mode: 'download' });

    const addToCart = (purchaseMode: 'online' | 'download' = 'download') => {
        cartForm.transform(() => ({ quantity: 1, purchase_mode: purchaseMode }));
        cartForm.post(`/cart/products/${product.id}`);
    };

    const isBook = product.type === 'book';
    const isPodcast = product.type === 'podcast';
    const productTypeLabel = isBook ? 'کتاب' : isPodcast ? 'پادکست' : 'فایل دیجیتال';
    const finalPrice = product.discount_price ?? product.price;
    const downloadPrice = product.download_discount_price ?? product.download_price ?? finalPrice;
    const hasDiscount = product.discount_price !== null && product.discount_price !== undefined;
    const hasDownloadDiscount = product.download_discount_price !== null && product.download_discount_price !== undefined;

    return (
        <div>
            <PageHeader
                eyebrow="فروشگاه"
                title={product.title}
                subtitle={product.description}
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        {isBook && product.has_preview_file ? <button type="button" onClick={() => addToCart('online')} disabled={cartForm.processing} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-brand-400 to-brand-600 px-5 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-brand-300 hover:to-brand-500 disabled:cursor-wait disabled:opacity-60"><Eye className="size-4" aria-hidden /> خرید مطالعه آنلاین <span className="text-brand-100">{formatPrice(finalPrice)}</span></button> : null}
                        {isBook && product.has_download_edition ? <button type="button" onClick={() => addToCart('download')} disabled={cartForm.processing} className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"><Download className="size-4" aria-hidden /> خرید نسخه دانلودی <span className="text-brand-100">{formatPrice(downloadPrice)}</span></button> : null}
                        {!isBook && <button type="button" onClick={() => addToCart('download')} disabled={cartForm.processing} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-brand-400 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-brand-300 hover:to-brand-500 disabled:cursor-wait disabled:opacity-60"><ShoppingBag className="size-4" aria-hidden /> {cartForm.processing ? 'در حال افزودن...' : 'افزودن به سبد خرید'}</button>}
                        <div className="flex flex-col text-right">{isBook && hasDownloadDiscount && <span className="text-sm text-white/50 line-through">{formatPrice(product.download_price ?? product.price)}</span>}{!isBook && hasDiscount && <span className="text-sm text-white/50 line-through">{formatPrice(product.price)}</span>}<span className="text-xl font-black text-white">{formatPrice(isBook && product.has_download_edition ? downloadPrice : finalPrice)}</span></div>
                    </div>
                }
            />

            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                    {/* cover */}
                    <div>
                        <div className="liquid-card relative overflow-hidden p-6">
                            <span className="liquid-blob blob-a" aria-hidden />
                            <span className="liquid-blob blob-b" aria-hidden />
                            <div className="shop-detail-cover">
                                {product.image ? (
                                    <img src={product.image} alt={product.title} loading="eager" />
                                ) : isPodcast ? (
                                    <div className="flex flex-col items-center gap-4 p-6 text-center"><Headphones className="size-20" aria-hidden /><span className="text-sm font-black">{product.title}</span></div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 p-6 text-center"><BookOpen className="size-14" aria-hidden /><span className="text-sm font-black">{product.title}</span>{product.author && <span className="text-xs text-white/70">{product.author}</span>}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* details */}
                    <div>
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" />
                            <span>{productTypeLabel}</span>
                        </div>
                        <h2 className="mt-3 text-2xl font-black text-navy">مشخصات</h2>

                        <div className="mt-6 flex flex-col gap-3">
                            {product.author && (
                                <div className="liquid-card flex items-center justify-between p-4">
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <span className="text-sm font-bold text-navy/55">نویسنده</span>
                                    <span className="text-sm font-black text-navy">{product.author}</span>
                                </div>
                            )}
                            {product.pages ? (
                                <div className="liquid-card flex items-center justify-between p-4">
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <span className="text-sm font-bold text-navy/55">تعداد صفحات</span>
                                    <span className="text-sm font-black text-navy">{formatNumber(product.pages)} صفحه</span>
                                </div>
                            ) : null}
                            {product.publisher && (
                                <div className="liquid-card flex items-center justify-between p-4">
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <span className="text-sm font-bold text-navy/55">ناشر</span>
                                    <span className="text-sm font-black text-navy">{product.publisher}</span>
                                </div>
                            )}
                            {product.episodes && product.episodes.length > 0 && <PodcastPlayer episodes={product.episodes} />}
                        </div>

                        {product.can_view_preview && product.preview_endpoint && <a href={product.preview_endpoint} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-black text-brand-700 hover:bg-brand-100"><Eye className="size-4" /> مطالعه آنلاین کتاب</a>}
                        {product.can_download && product.download_endpoint && <a href={product.download_endpoint} className="mr-2 mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-black text-brand-700 hover:bg-brand-100"><Download className="size-4" /> دانلود نسخه خریداری‌شده</a>}

                        {product.preview_url && (
                            <a href={product.preview_url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-brand-700 hover:text-brand-800">
                                <PlayCircle className="size-5" aria-hidden /> پیش‌نمایش محصول
                                <ExternalLink className="size-3.5" aria-hidden />
                            </a>
                        )}

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            {isBook && product.has_preview_file ? <button type="button" onClick={() => addToCart('online')} disabled={cartForm.processing} className="inline-flex items-center gap-2 rounded-2xl bg-deep-green px-6 py-3.5 text-sm font-bold text-white shadow-soft transition-all hover:bg-brand-800 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"><Eye className="size-5" aria-hidden /> خرید مطالعه آنلاین · {formatPrice(finalPrice)}</button> : null}
                            {isBook && product.has_download_edition ? <button type="button" onClick={() => addToCart('download')} disabled={cartForm.processing} className="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-6 py-3.5 text-sm font-bold text-brand-800 transition-all hover:bg-brand-100 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"><Download className="size-5" aria-hidden /> خرید نسخه دانلودی · {formatPrice(downloadPrice)}</button> : null}
                            {!isBook && <button type="button" onClick={() => addToCart('download')} disabled={cartForm.processing} className="inline-flex items-center gap-2 rounded-2xl bg-deep-green px-7 py-3.5 text-base font-bold text-white shadow-soft transition-all hover:bg-brand-800 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"><ShoppingBag className="size-5" aria-hidden /> {cartForm.processing ? 'در حال افزودن...' : 'افزودن به سبد خرید'}</button>}
                            <Link href="/shop" className="inline-flex items-center gap-2 rounded-2xl border border-navy/10 px-7 py-3.5 text-base font-bold text-navy/70 transition-colors hover:border-brand-300 hover:text-brand-700">
                                <ArrowLeft className="size-5" aria-hidden />
                                بازگشت به فروشگاه
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {product.reviews && product.review_summary && (
                <section className="relative overflow-hidden bg-soft-gray py-12 md:py-16">
                    <div className="ambient ambient-teal ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div><div className="hero-kicker"><span className="hero-kicker-line" /><span>تجربه خریداران</span></div><h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">نظرات درباره {product.type === 'podcast' ? 'این پادکست' : 'این محصول'}</h2><p className="mt-1 text-xs font-bold text-navy/40">{formatNumber(product.review_summary.count)} نظر ثبت‌شده</p></div>
                            {product.review_summary.average > 0 && <div className="flex items-center gap-2 text-gold"><Star className="size-5 fill-gold" /><strong className="text-xl">{formatNumber(product.review_summary.average)}</strong><span className="text-xs font-bold text-navy/40">از ۵</span></div>}
                        </div>
                        <div className="mt-7"><ReviewComposer action={`/products/${product.slug}/reviews`} canReview={Boolean(product.can_review)} isAuthenticated={Boolean(auth?.user)} existingReview={product.my_review} subjectLabel={product.type === 'podcast' ? 'این پادکست' : 'این محصول'} /></div>
                        {product.reviews.length > 0 ? <div className="mt-7 grid gap-4 md:grid-cols-2">{product.reviews.map((review) => <article key={review.id} className="liquid-card p-5"><span className="liquid-blob blob-b" aria-hidden /><div className="relative z-10 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-deep-green text-base font-black text-white">{review.name.slice(0, 1)}</span><div><h3 className="text-sm font-black text-navy">{review.name}</h3><div className="mt-1 flex items-center gap-1 text-gold">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`size-3.5 ${index < review.rating ? 'fill-gold' : 'text-navy/15'}`} aria-hidden />)}<span className="mr-1 text-[0.68rem] font-bold text-navy/40">{formatDate(review.created_at)}</span></div></div></div>{review.title && <h4 className="relative z-10 mt-4 text-sm font-black text-navy">{review.title}</h4>}{review.body && <p className="relative z-10 mt-2 text-sm leading-7 text-navy/60">{review.body}</p>}</article>)}</div> : <div className="liquid-card mt-7 p-8 text-center text-sm font-bold text-navy/50">هنوز نظری برای این محصول ثبت نشده است.</div>}
                    </div>
                </section>
            )}

            {related.length > 0 && (
                <section className="relative overflow-hidden bg-soft-gray py-12 md:py-16">
                    <div className="ambient ambient-teal ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" />
                            <span>محصولات مرتبط</span>
                        </div>
                        <h2 className="mt-3 text-2xl font-black text-navy">شاید به این‌ها هم علاقه داشته باشید</h2>
                        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((item) => (
                                <Link key={item.id} href={`/shop/${item.slug}`} className="liquid-card group flex gap-5 p-5">
                                    <span className="liquid-blob blob-a" aria-hidden />
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-deep-green text-white">
                                        {item.type === 'book' ? <BookOpen className="size-9" aria-hidden /> : <Headphones className="size-9" aria-hidden />}
                                    </span>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                        <h3 className="line-clamp-2 text-base font-black leading-6 text-navy transition-colors group-hover:text-brand-700">
                                            {item.title}
                                        </h3>
                                        {item.author && <p className="text-xs text-navy/45">{item.author}</p>}
                                        <span className="mt-auto flex items-center gap-1 pt-1 text-sm font-black text-brand-700">
                                            {formatPrice(item.discount_price ?? item.price)}
                                            <Star className="size-3.5 text-gold" aria-hidden />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

ShopShow.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
