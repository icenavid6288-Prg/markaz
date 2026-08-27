import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, KeyRound, ShieldCheck, Smartphone, Ticket } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ResetPassword({
    phone,
    dev_code,
    status,
}: {
    phone: string;
    dev_code?: string | null;
    status?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        phone: phone,
        code: '',
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="تعیین رمز عبور جدید" />

            <div className="hero-kicker">
                <span className="hero-kicker-line" />
                <span>قدم آخر</span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-navy md:text-3xl">
                تعیین رمز عبور جدید
            </h1>
            <p className="mt-2 text-sm leading-7 text-navy/55">
                کد تأیید پیامک‌شده را وارد کنید و یک رمز عبور جدید برای حساب خود انتخاب کنید.
            </p>

            {status && (
                <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold leading-6 text-brand-800">
                    {status}
                </div>
            )}

            {dev_code && (
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
                            readOnly
                            className="w-full cursor-not-allowed rounded-2xl border border-navy/10 bg-navy/[0.03] py-3 pl-4 pr-11 text-left text-sm text-navy/60 outline-none"
                        />
                    </div>
                    {errors.phone && (
                        <p className="mt-1.5 text-xs font-bold text-red-600">{errors.phone}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="code" className="mb-1.5 block text-xs font-black text-navy/70">
                        کد تأیید
                    </label>
                    <div className="relative">
                        <Ticket className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" aria-hidden />
                        <input
                            id="code"
                            type="text"
                            name="code"
                            dir="ltr"
                            inputMode="numeric"
                            maxLength={6}
                            value={data.code}
                            autoComplete="one-time-code"
                            autoFocus
                            placeholder="••••••"
                            onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                            className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-center text-lg font-black tracking-[0.5em] text-navy outline-none transition-all placeholder:text-navy/25 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                        />
                    </div>
                    {errors.code && (
                        <p className="mt-1.5 text-xs font-bold text-red-600">{errors.code}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs font-black text-navy/70">
                        رمز عبور جدید
                    </label>
                    <div className="relative">
                        <KeyRound className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" aria-hidden />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            dir="ltr"
                            value={data.password}
                            autoComplete="new-password"
                            placeholder="حداقل ۸ کاراکتر"
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-12 pr-11 text-left text-sm text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-navy/35 transition-colors hover:text-brand-700"
                            aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1.5 text-xs font-bold text-red-600">{errors.password}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="mb-1.5 block text-xs font-black text-navy/70">
                        تکرار رمز عبور جدید
                    </label>
                    <div className="relative">
                        <KeyRound className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" aria-hidden />
                        <input
                            id="password_confirmation"
                            type={showPassword ? 'text' : 'password'}
                            name="password_confirmation"
                            dir="ltr"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            placeholder="رمز عبور را دوباره وارد کنید"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-12 pr-11 text-left text-sm text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                        />
                    </div>
                    {errors.password_confirmation && (
                        <p className="mt-1.5 text-xs font-bold text-red-600">{errors.password_confirmation}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-3.5 text-base font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] disabled:opacity-60"
                >
                    <ShieldCheck className="size-5" aria-hidden />
                    {processing ? 'در حال ذخیره...' : 'ذخیره رمز عبور جدید'}
                </button>
            </form>

            <div className="mt-4">
                <Link
                    href={route('password.request')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-7 py-3 text-sm font-black text-brand-700 transition-all hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98]"
                >
                    ارسال دوباره کد
                </Link>
            </div>

            <div className="mt-5">
                <Link
                    href={route('login')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-navy/10 bg-white px-7 py-3.5 text-base font-black text-navy/60 transition-all hover:border-navy/25 hover:bg-navy/[0.02] active:scale-[0.98]"
                >
                    <ArrowLeft className="size-5" aria-hidden />
                    بازگشت به ورود
                </Link>
            </div>
        </GuestLayout>
    );
}
