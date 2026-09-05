import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, CreditCard, LockKeyhole, ShoppingBag, Tag } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatPrice } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';

interface CheckoutItem {
    id: number;
    title: string;
    unit_price: number;
    quantity: number;
    total: number;
    course_slug?: string | null;
    product_slug?: string | null;
}

interface CheckoutOrder {
    order_number: string;
    status: string;
    subtotal: number;
    discount: number;
    total: number;
    billing?: { name?: string; email?: string; phone?: string | null } | null;
    items: CheckoutItem[];
}

interface CouponData {
    code: string;
    discount: number;
}

export default function CheckoutShow({
    order,
    coupon: initialCoupon = null,
    payment = { enabled: false, gateway: 'local' },
}: {
    order: CheckoutOrder;
    coupon?: CouponData | null;
    payment?: { enabled: boolean; gateway: string };
}) {
    const firstCourse = order.items.find((item) => item.course_slug);
    const firstProduct = order.items.find((item) => item.product_slug);
    const form = useForm({});
    // The applied coupon comes from server props so it stays in sync after apply/remove.
    const coupon = initialCoupon;
    const couponForm = useForm({ code: '' });
    const gatewayLabels: Record<string, string> = { zarinpal: 'زرین‌پال', idpay: 'آیدی‌پی', zibal: 'زیبال', local: 'حالت آزمایشی' };

    const handleApplyCoupon = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedCode = couponForm.data.code.replace(/\s+/g, '').toUpperCase();
        couponForm.transform(() => ({ code: normalizedCode }));
        couponForm.post(`/checkout/${order.order_number}/coupon`, {
            preserveScroll: true,
            onSuccess: () => couponForm.reset(),
        });
    };

    const handleRemoveCoupon = () => {
        router.delete(`/checkout/${order.order_number}/coupon`, { preserveScroll: true });
    };

    return (
        <>
            <Head title={`تکمیل سفارش ${order.order_number}`} />
            <div className="relative overflow-hidden bg-soft-gray py-28 md:py-36">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative max-w-5xl">
                    <div className="mb-8">
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" />
                            <span>تکمیل سفارش</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-navy md:text-4xl">آماده شروع مسیر یادگیری هستید؟</h1>
                                <p className="mt-2 text-sm text-navy/55">سفارش شما ثبت شده و برای تکمیل پرداخت آماده است.</p>
                            </div>
                            <span className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-black text-brand-700">
                                سفارش {order.order_number}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                        <section className="liquid-card p-6 md:p-8">
                            <span className="liquid-blob blob-a" aria-hidden />
                            <span className="liquid-blob blob-b" aria-hidden />
                            <div className="relative">
                                <div className="flex items-center gap-3">
                                    <span className="glass-tile glass-tile-lg">
                                        <ShoppingBag className="size-6" aria-hidden />
                                    </span>
                                    <div>
                                        <h2 className="text-lg font-black text-navy">جزئیات سفارش</h2>
                                        <p className="mt-1 text-xs text-navy/45">محتوای انتخاب‌شده برای شما</p>
                                    </div>
                                </div>

                                <div className="mt-7 flex flex-col gap-3">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-navy/5 bg-white/70 p-4">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                                                <CheckCircle2 className="size-5" aria-hidden />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-black text-navy">{item.title}</div>
                                                <div className="mt-1 text-xs text-navy/45">تعداد: {item.quantity}</div>
                                            </div>
                                            <span className="text-sm font-black text-brand-700">{formatPrice(item.total)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-7 border-t border-navy/10 pt-5">
                                    <div className="flex items-center justify-between text-sm text-navy/55">
                                        <span>جمع سفارش</span>
                                        <span>{formatPrice(order.subtotal)}</span>
                                    </div>
                                    {order.discount > 0 && (
                                        <div className="mt-2 flex items-center justify-between text-sm text-brand-700">
                                            <span>تخفیف</span>
                                            <span>− {formatPrice(order.discount)}</span>
                                        </div>
                                    )}
                                    <div className="mt-4 flex items-center justify-between border-t border-navy/5 pt-4">
                                        <span className="font-black text-navy">مبلغ قابل پرداخت</span>
                                        <span className="text-2xl font-black text-brand-700">{formatPrice(order.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <aside className="flex flex-col gap-5">
                            {/* Coupon Section */}
                            <section className="liquid-card p-6">
                                <span className="liquid-blob blob-b" aria-hidden />
                                <div className="relative">
                                    <div className="flex items-center gap-3">
                                        <span className="glass-tile">
                                            <Tag className="size-5" aria-hidden />
                                        </span>
                                        <h2 className="text-base font-black text-navy">کد تخفیف</h2>
                                    </div>
                                    {coupon ? (
                                        <div className="mt-4">
                                            <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2">
                                                <span className="text-xs font-black text-brand-700">{coupon.code}</span>
                                                <span className="text-[0.65rem] text-brand-600">اعمال شد</span>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveCoupon}
                                                    className="mr-auto rounded-lg border border-navy/10 px-2 py-0.5 text-[0.65rem] font-black text-navy/60 hover:bg-navy/5"
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                            <p className="mt-2 text-[0.7rem] font-bold text-brand-700">
                                                مبلغ تخفیف: {formatPrice(coupon.discount)}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <form onSubmit={handleApplyCoupon} className="mt-4 flex gap-2">
                                                <input
                                                    value={couponForm.data.code}
                                                    onChange={(e) => couponForm.setData('code', e.target.value.toUpperCase())}
                                                    placeholder="کد تخفیف را وارد کنید"
                                                    className="min-w-0 flex-1 rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-bold text-navy outline-none focus:border-brand-500"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={couponForm.processing}
                                                    className="rounded-xl bg-brand-50 px-4 py-2 text-xs font-black text-brand-700 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {couponForm.processing ? '...' : 'اعمال'}
                                                </button>
                                            </form>
                                            {couponForm.errors.code && (
                                                <p className="mt-2 text-[0.7rem] font-bold text-red-600">{couponForm.errors.code}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </section>

                            <section className="liquid-card p-6">
                                <span className="liquid-blob blob-b" aria-hidden />
                                <div className="relative">
                                    <div className="flex items-center gap-3">
                                        <span className="glass-tile">
                                            <CreditCard className="size-5" aria-hidden />
                                        </span>
                                        <h2 className="text-base font-black text-navy">روش پرداخت</h2>
                                    </div>
                                    <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/80 p-4">
                                        <div className="flex items-start gap-3">
                                            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                                            <div>
                                                <p className="text-sm font-black text-brand-800">پرداخت آنلاین امن</p>
                                                <p className="mt-1 text-xs leading-6 text-brand-800/65">
                                                    {payment.enabled ? `پرداخت شما از طریق ${gatewayLabels[payment.gateway] ?? 'درگاه انتخاب‌شده'} انجام می‌شود و پس از تأیید، دسترسی دوره بلافاصله فعال خواهد شد.` : 'درگاه هنوز فعال نشده است؛ مدیر سایت باید آن را از پنل مدیریت تنظیم و فعال کند.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {order.total === 0 ? (
                                        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-center">
                                            <p className="text-sm font-black text-green-700">🏆 سفارش شما رایگان شد!</p>
                                            <p className="mt-1 text-xs text-green-600">برای فعال‌سازی دسترسی دوره، دکمه زیر را بزنید.</p>
                                            <button
                                                type="button"
                                                disabled={form.processing}
                                                onClick={() => form.post(`/checkout/${order.order_number}/pay`)}
                                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-deep-green px-6 py-3.5 text-sm font-black text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {form.processing ? 'در حال فعال‌سازی...' : 'فعال‌سازی دسترسی دوره'}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                disabled={!payment.enabled || form.processing}
                                                onClick={() => form.post(`/checkout/${order.order_number}/pay`)}
                                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-deep-green px-6 py-3.5 text-sm font-black text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <CreditCard className="size-4" aria-hidden />
                                                {form.processing ? 'در حال اتصال به درگاه...' : 'ادامه به پرداخت آنلاین'}
                                            </button>
                                            <p className="mt-3 text-center text-[0.7rem] leading-5 text-navy/40">
                                                {payment.enabled ? `درگاه فعال: ${gatewayLabels[payment.gateway] ?? payment.gateway}` : 'سفارش شما ذخیره شده است؛ درگاه از تنظیمات پنل مدیریت فعال می‌شود.'}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </section>

                            <section className="liquid-card p-6">
                                <span className="liquid-blob blob-a" aria-hidden />
                                <div className="relative">
                                    <h2 className="text-sm font-black text-navy">اطلاعات خریدار</h2>
                                    <div className="mt-4 flex flex-col gap-2 text-sm text-navy/60">
                                        <span>{order.billing?.name}</span>
                                        <span dir="ltr" className="text-right">{order.billing?.email}</span>
                                        {order.billing?.phone && <span dir="ltr" className="text-right">{order.billing.phone}</span>}
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                                {firstCourse?.course_slug ? (
                                    <Link href={`/courses/${firstCourse.course_slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
                                        <ArrowRight className="size-4" aria-hidden /> بازگشت به دوره
                                    </Link>
                                ) : firstProduct?.product_slug ? (
                                    <Link href={`/shop/${firstProduct.product_slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
                                        <ArrowRight className="size-4" aria-hidden /> بازگشت به محصول
                                    </Link>
                                ) : (
                                    <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
                                        <ArrowRight className="size-4" aria-hidden /> بازگشت به فروشگاه
                                    </Link>
                                )}
                                <Link href="/" className="text-sm font-bold text-navy/45 hover:text-navy">صفحه اصلی</Link>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}

CheckoutShow.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
