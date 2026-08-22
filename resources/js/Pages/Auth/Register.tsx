import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Gift, Rocket, ShieldCheck, Smartphone, Ticket, User } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import type { PageProps } from '@/types';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Register({
    status,
    step = 'form',
    phone = '',
    dev_code = null,
}: {
    status?: string;
    step?: 'form' | 'code';
    phone?: string;
    dev_code?: string | null;
}) {
    const { url } = usePage<PageProps>();
    const query = new URLSearchParams(url.split('?')[1] ?? '');
    const referralFromQuery = query.get('referral') ?? '';
    const phoneFromQuery = query.get('phone') ?? '';
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        phone: step === 'code' ? phone : phoneFromQuery,
        code: '',
        referral_code: referralFromQuery,
    });
    const [resendSeconds, setResendSeconds] = useState(0);

    useEffect(() => {
        if (resendSeconds <= 0) return;

        const timer = window.setTimeout(() => {
            setResendSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [resendSeconds]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (step === 'code') {
            post(route('register.verify.store'), {
                preserveScroll: true,
                preserveState: true,
            });
            return;
        }

        post(route('register'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const resendCode = () => {
        if (resendSeconds > 0 || processing) return;

        post(route('register'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setResendSeconds(60),
        });
    };

    const isCodeStep = step === 'code';

    return (
        <GuestLayout>
            <Head title={isCodeStep ? 'تأیید کد ثبت‌نام' : 'ساخت حساب کاربری'} />

            <div className="hero-kicker">
                <span className="hero-kicker-line" />
                <span>{isCodeStep ? 'تأیید امن ثبت‌نام' : 'آغاز مسیر'}</span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-navy md:text-3xl">
                {isCodeStep ? 'کد تأیید را وارد کنید' : 'ساخت حساب کاربری'}
            </h1>
            <p className="mt-2 text-sm leading-7 text-navy/55">
                {isCodeStep
                    ? `کد شش‌رقمی ارسال‌شده به شماره ${phone} را وارد کنید تا ساخت حساب کامل شود.`
                    : 'مسیر رشد فرزندتان را بسازید؛ دوره‌ها، کوچینگ و محتوای اختصاصی در یک پنل واحد.'}
            </p>

            {status && (
                <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold leading-6 text-brand-800">
                    {status}
                </div>
            )}

            {isCodeStep && dev_code && (
                <div className="mt-4 rounded-2xl border border-dashed border-gold/40 bg-gold/10 px-4 py-3 text-xs font-bold leading-6 text-[#7a5c10]">
                    <span className="flex items-center gap-1.5">
                        <Ticket className="size-4" aria-hidden />
                        کد تستی (فقط در محیط توسعه): {dev_code}
                    </span>
                </div>
            )}

            <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
                {isCodeStep ? (
                    <>
                        <div>
                            <label htmlFor="code" className="mb-1.5 block text-xs font-black text-navy/70">
                                کد تأیید پیامکی
                            </label>
                            <div className="relative">
                                <Ticket className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" aria-hidden />
                                <input
                                    id="code"
                                    type="text"
                                    name="code"
                                    dir="ltr"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    autoFocus
                                    value={data.code}
                                    placeholder="••••••"
                                    onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                                    className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-center text-lg font-black tracking-[0.45em] text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                                />
                            </div>
                            {errors.code && (
                                <p className="mt-1.5 text-xs font-bold text-red-600">{errors.code}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-3.5 text-base font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] disabled:opacity-60"
                        >
                            <Rocket className="size-5" aria-hidden />
                            {processing ? 'در حال بررسی...' : 'تأیید و ساخت حساب'}
                        </button>

                        <div className="flex flex-col items-center justify-center gap-2 text-xs font-bold text-navy/45">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-brand-600" aria-hidden />
                                کد تأیید فقط ۵ دقیقه اعتبار دارد.
                            </div>
                            <button
                                type="button"
                                onClick={resendCode}
                                disabled={processing || resendSeconds > 0}
                                className="font-black text-brand-700 transition-colors hover:text-brand-800 disabled:cursor-not-allowed disabled:text-navy/35"
                            >
                                {resendSeconds > 0 ? `ارسال مجدد کد تا ${resendSeconds} ثانیه` : 'ارسال مجدد کد'}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <label htmlFor="name" className="mb-1.5 block text-xs font-black text-navy/70">
                                نام و نام خانوادگی
                            </label>
                            <div className="relative">
                                <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" aria-hidden />
                                <input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    autoComplete="name"
                                    autoFocus
                                    placeholder="مثلاً: مریم احمدی"
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-sm text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1.5 text-xs font-bold text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="phone" className="mb-1.5 block text-xs font-black text-navy/70">
                                شماره موبایل
                            </label>
                            <div className="relative">
                                <Smartphone className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" aria-hidden />
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    dir="ltr"
                                    inputMode="numeric"
                                    value={data.phone}
                                    autoComplete="tel"
                                    placeholder="09xxxxxxxxx"
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-left text-sm text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                                />
                            </div>
                            {errors.phone && (
                                <p className="mt-1.5 text-xs font-bold text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="referral_code" className="mb-1.5 block text-xs font-black text-navy/70">
                                کد معرف (اختیاری)
                            </label>
                            <div className="relative">
                                <Gift className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" aria-hidden />
                                <input
                                    id="referral_code"
                                    type="text"
                                    name="referral_code"
                                    dir="ltr"
                                    maxLength={12}
                                    value={data.referral_code}
                                    placeholder="مثلاً AB3K7QP"
                                    onChange={(e) => setData('referral_code', e.target.value.toUpperCase())}
                                    className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-left text-sm text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                                />
                            </div>
                            {errors.referral_code && (
                                <p className="mt-1.5 text-xs font-bold text-red-600">{errors.referral_code}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-3.5 text-base font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] disabled:opacity-60"
                        >
                            <Rocket className="size-5" aria-hidden />
                            {processing ? 'در حال ساخت حساب...' : 'شروع مسیر رشد'}
                        </button>
                    </>
                )}
            </form>

            <div className="mt-6 flex items-center gap-3 text-[0.65rem] font-black text-navy/30">
                <span className="h-px flex-1 bg-navy/10" />
                {isCodeStep ? 'شماره دیگری دارید؟' : 'قبلاً حساب ساخته‌اید؟'}
                <span className="h-px flex-1 bg-navy/10" />
            </div>

            <div className="mt-5">
                <Link
                    href={isCodeStep ? route('register', { fresh: 1 }) : route('login')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-7 py-3.5 text-base font-black text-brand-700 transition-all hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98]"
                >
                    {isCodeStep ? 'شروع دوباره با شماره دیگر' : 'ورود به حساب'}
                    <ArrowLeft className="size-5" aria-hidden />
                </Link>
            </div>
        </GuestLayout>
    );
}
