import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    LogIn,
    MessageSquareText,
    ShieldCheck,
    Smartphone,
    Ticket,
} from 'lucide-react';
import { useEffect, useState, type FormEventHandler } from 'react';
import BrandLogo from '@/Components/BrandLogo';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Login({
    status,
    step = 'phone',
    phone = '',
    dev_code,
}: {
    status?: string;
    step?: 'phone' | 'code';
    phone?: string;
    dev_code?: string | null;
}) {
    const { data, setData, post, processing, errors } = useForm({
        phone,
        code: '',
    });

    const isCodeStep = step === 'code';
    const [resendSeconds, setResendSeconds] = useState(0);

    useEffect(() => {
        setResendSeconds(isCodeStep ? 60 : 0);
    }, [isCodeStep, phone]);

    useEffect(() => {
        if (resendSeconds <= 0) return;

        const timer = window.setTimeout(() => {
            setResendSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [resendSeconds]);

    const resendCode = () => {
        if (resendSeconds > 0 || processing || !data.phone) return;

        setData('code', '');
        post(route('login'), {
            preserveScroll: true,
            onSuccess: () => setResendSeconds(60),
        });
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(isCodeStep ? route('login.verify.store') : route('login'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <GuestLayout>
            <Head title={isCodeStep ? 'تأیید کد ورود' : 'ورود به حساب کاربری'} />

            <div className="flex items-center gap-3">
                <BrandLogo className="guest-brand-mark" />
                <div>
                    <div className="text-xs font-black text-brand-700">مرکز رشد و کارآفرینی</div>
                    <div className="mt-0.5 text-[0.68rem] font-bold text-navy/45">دکتر بیدی · مسیر رشد شما</div>
                </div>
            </div>

            <div className="hero-kicker mt-6">
                <span className="hero-kicker-line" />
                <span>{isCodeStep ? 'تأیید امن ورود' : 'خوش برگشتید'}</span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-navy md:text-3xl">
                {isCodeStep ? 'کد ورود را وارد کنید' : 'ورود به حساب کاربری'}
            </h1>
            <p className="mt-2 text-sm leading-7 text-navy/55">
                {isCodeStep
                    ? 'کد شش‌رقمی ارسال‌شده به شماره موبایل خود را وارد کنید تا وارد پنل شوید.'                        : 'فقط شماره موبایل خود را وارد کنید؛ کد ورود برایتان پیامک می‌شود.'}
            </p>

            {status && (
                <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold leading-6 text-brand-800">
                    {status}
                </div>
            )}

            {isCodeStep && dev_code && (
                <div className="mt-5 rounded-2xl border border-dashed border-gold/40 bg-gold/10 px-4 py-3 text-xs font-bold leading-6 text-[#7a5c10]">
                    <span className="flex items-center gap-1.5">
                        <Ticket className="size-4" aria-hidden />
                        کد تستی (فقط در محیط توسعه): {dev_code}
                    </span>
                </div>
            )}

            <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
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
                            autoFocus={!isCodeStep}
                            readOnly={isCodeStep}
                            placeholder="09xxxxxxxxx"
                            onChange={(event) => setData('phone', event.target.value)}
                            className={`w-full rounded-2xl border border-navy/10 py-3 pl-4 pr-11 text-left text-sm outline-none transition-all ${isCodeStep ? 'cursor-not-allowed bg-navy/[0.03] text-navy/60' : 'bg-white text-navy placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40'}`}
                        />
                    </div>
                    {errors.phone && (
                        <p className="mt-1.5 text-xs font-bold text-red-600">{errors.phone}</p>
                    )}
                </div>


                {isCodeStep && (
                    <div>
                        <label htmlFor="code" className="mb-1.5 block text-xs font-black text-navy/70">
                            کد ورود پیامکی
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
                                value={data.code}
                                autoFocus
                                placeholder="••••••"
                                onChange={(event) => setData('code', event.target.value.replace(/\D/g, ''))}
                                className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-center text-lg font-black tracking-[0.5em] text-navy outline-none transition-all placeholder:text-navy/25 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                            />
                        </div>
                        {errors.code && (
                            <p className="mt-1.5 text-xs font-bold text-red-600">{errors.code}</p>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-3.5 text-base font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] disabled:opacity-60"
                >
                    {isCodeStep ? <LogIn className="size-5" aria-hidden /> : <MessageSquareText className="size-5" aria-hidden />}
                    {processing ? 'در حال بررسی...' : isCodeStep ? 'ورود به حساب' : 'دریافت کد ورود'}
                </button>

                {isCodeStep && (
                    <div className="flex flex-col items-center justify-center gap-2 text-xs font-bold text-navy/45">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-brand-600" aria-hidden />
                            کد ورود فقط ۵ دقیقه اعتبار دارد.
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
                )}
            </form>

            {isCodeStep ? (
                <div className="mt-5 flex flex-col gap-3">
                    <Link
                        href={route('login', { fresh: 1 })}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-7 py-3.5 text-sm font-black text-brand-700 transition-all hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98]"
                    >
                        ورود با شماره دیگر
                        <ArrowLeft className="size-4" aria-hidden />
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mt-6 flex items-center gap-3 text-[0.65rem] font-black text-navy/30">
                        <span className="h-px flex-1 bg-navy/10" />
                        حساب کاربری ندارید؟
                        <span className="h-px flex-1 bg-navy/10" />
                    </div>

                    <div className="mt-5">
                        <Link
                            href={route('register')}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-7 py-3.5 text-base font-black text-brand-700 transition-all hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98]"
                        >
                            ساخت حساب جدید
                            <ArrowLeft className="size-5" aria-hidden />
                        </Link>
                    </div>
                </>
            )}
        </GuestLayout>
    );
}
