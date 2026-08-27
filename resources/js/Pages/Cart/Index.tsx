import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Check, Headphones, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { formatNumber, formatPrice } from '@/lib/format';
import type { PageProps } from '@/types';

interface CartItem {
    id: number;
    title: string;
    slug: string;
    type: string;
    image?: string | null;
    price: number;
    discount_price?: number | null;
    final_price: number;
    purchase_mode: 'online' | 'download';
    purchase_mode_label: string;
    quantity: number;
    total: number;
    stock: number;
}

interface CartProps {
    items: CartItem[];
    totals: { subtotal: number; discount: number; total: number };
    coupon?: { code: string; discount: number } | null;
}

export default function CartIndex() {
    const { items, totals, auth, coupon = null } = usePage<PageProps & CartProps>().props;
    const [couponCode, setCouponCode] = useState('');
    const [quantities, setQuantities] = useState<Record<number, number>>(() => Object.fromEntries(items.map((item) => [item.id, item.quantity])));

    useEffect(() => {
        setQuantities(Object.fromEntries(items.map((item) => [item.id, item.quantity])));
    }, [items]);

    const updateQuantity = (item: CartItem, quantity: number) => {
        const next = Math.max(1, Math.min(item.stock, quantity));
        setQuantities((current) => ({ ...current, [item.id]: next }));
        router.patch(`/cart/products/${item.id}`, { quantity: next }, { preserveScroll: true });
    };

    const removeItem = (item: CartItem) => {
        router.delete(`/cart/products/${item.id}`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="سبد خرید" />
            <section className="relative overflow-hidden bg-soft-gray py-28 md:py-36">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative">
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="hero-kicker"><span className="hero-kicker-line" /><span>فروشگاه آموزشی</span></div>
                            <h1 className="mt-3 text-3xl font-black text-navy md:text-4xl">سبد خرید شما</h1>
                            <p className="mt-2 text-sm leading-7 text-navy/55">محصولات انتخاب‌شده را بررسی کنید و خرید خود را کامل کنید.</p>
                        </div>
                        <Link href="/shop" className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white/70 px-4 py-2.5 text-xs font-black text-brand-700 hover:bg-brand-50"><ArrowLeft className="size-4" /> ادامه خرید</Link>
                    </div>

                    {items.length > 0 ? (
                        <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
                            <section className="liquid-card p-5 md:p-7">
                                <span className="liquid-blob blob-a" aria-hidden />
                                <div className="relative flex flex-col gap-4">
                                    {items.map((item) => {
                                        const Icon = item.type === 'podcast' ? Headphones : BookOpen;
                                        const hasDiscount = item.discount_price !== null && item.discount_price !== undefined;
                                        return (
                                            <article key={item.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-navy/5 bg-white/75 p-4">
                                                <Link href={`/shop/${item.slug}`} className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-deep-green text-white">
                                                    {item.image ? <img src={item.image} alt={item.title} className="size-full object-cover" /> : <Icon className="size-8" />}
                                                </Link>
                                                <div className="min-w-0 flex-1">
                                                    <Link href={`/shop/${item.slug}`} className="line-clamp-2 text-sm font-black leading-6 text-navy hover:text-brand-700">{item.title}</Link>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy/45">
                                                        <span className="rounded-md bg-brand-50 px-2 py-1 font-black text-brand-700">{item.purchase_mode_label}</span>
                                                        <span>{formatPrice(item.final_price)} برای هر عدد</span>
                                                        {hasDiscount && <span className="line-through">{formatPrice(item.price)}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 rounded-xl border border-navy/10 bg-white px-1 py-1">
                                                    <button type="button" onClick={() => updateQuantity(item, (quantities[item.id] ?? item.quantity) - 1)} className="flex size-7 items-center justify-center rounded-lg text-navy/50 hover:bg-brand-50 hover:text-brand-700" aria-label={`کاهش تعداد ${item.title}`} disabled={(quantities[item.id] ?? item.quantity) <= 1}><Minus className="size-3.5" /></button>
                                                    <span className="w-8 text-center text-sm font-black text-navy">{formatNumber(quantities[item.id] ?? item.quantity)}</span>
                                                    <button type="button" onClick={() => updateQuantity(item, (quantities[item.id] ?? item.quantity) + 1)} className="flex size-7 items-center justify-center rounded-lg text-navy/50 hover:bg-brand-50 hover:text-brand-700" aria-label={`افزایش تعداد ${item.title}`} disabled={(quantities[item.id] ?? item.quantity) >= item.stock}><Plus className="size-3.5" /></button>
                                                </div>
                                                <div className="flex items-center gap-3 sm:min-w-28 sm:justify-end">
                                                    <strong className="text-sm font-black text-brand-700">{formatPrice(item.total)}</strong>
                                                    <button type="button" onClick={() => removeItem(item)} className="text-navy/30 transition-colors hover:text-red-500" aria-label={`حذف ${item.title}`}><Trash2 className="size-4" /></button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>

                            <aside className="liquid-card h-fit p-6 lg:sticky lg:top-28">
                                <span className="liquid-blob blob-b" aria-hidden />
                                <div className="relative">
                                    <div className="flex items-center gap-3"><ShoppingBag className="size-5 text-brand-600" /><h2 className="text-base font-black text-navy">خلاصه خرید</h2></div>
                                    <form
                                        className="mt-6 flex gap-2"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            router.post('/cart/coupon', { code: couponCode }, { preserveScroll: true });
                                        }}
                                    >
                                        <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="کد تخفیف" className="min-w-0 flex-1 rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-bold text-navy outline-none focus:border-brand-500" />
                                        {coupon ? (
                                            <button type="button" onClick={() => router.delete('/cart/coupon', { preserveScroll: true })} className="rounded-xl border border-navy/10 px-3 py-2 text-xs font-black text-navy/60">حذف</button>
                                        ) : (
                                            <button type="submit" className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-black text-brand-700">اعمال</button>
                                        )}
                                    </form>
                                    {coupon && <p className="mt-2 text-[0.7rem] font-bold text-brand-700">کد {coupon.code} اعمال شد.</p>}
                                    <div className="mt-6 flex flex-col gap-3 border-b border-navy/10 pb-5 text-sm">
                                        <div className="flex items-center justify-between text-navy/55"><span>جمع محصولات</span><span>{formatPrice(totals.subtotal)}</span></div>
                                        {totals.discount > 0 && <div className="flex items-center justify-between text-brand-700"><span>تخفیف</span><span>− {formatPrice(totals.discount)}</span></div>}
                                    </div>
                                    <div className="mt-5 flex items-center justify-between"><span className="font-black text-navy">مبلغ نهایی</span><strong className="text-xl font-black text-brand-700">{formatPrice(totals.total)}</strong></div>
                                    <Link href="/cart/checkout" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-deep-green px-5 py-3.5 text-sm font-black text-white shadow-soft transition hover:bg-brand-700"><Check className="size-4" /> {auth.user ? 'ادامه و ثبت سفارش' : 'ورود و ادامه خرید'}</Link>
                                    {!auth.user && <p className="mt-3 text-center text-[0.7rem] leading-5 text-navy/40">برای ثبت سفارش، ابتدا با شماره موبایل وارد شوید.</p>}
                                </div>
                            </aside>
                        </div>
                    ) : (
                        <div className="liquid-card flex flex-col items-center justify-center p-14 text-center">
                            <ShoppingBag className="size-12 text-brand-500" aria-hidden />
                            <h2 className="mt-5 text-xl font-black text-navy">سبد خرید شما خالی است</h2>
                            <p className="mt-2 text-sm text-navy/50">از فروشگاه، محصول آموزشی موردنظر خود را انتخاب کنید.</p>
                            <Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-deep-green px-6 py-3 text-sm font-black text-white"><ArrowLeft className="size-4" /> مشاهده محصولات</Link>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

CartIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
