import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Eye, EyeOff, KeyRound, LogIn, ShieldCheck, Smartphone } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import BrandLogo from '@/Components/BrandLogo';
import GuestLayout from '@/Layouts/GuestLayout';

export default function AdminLogin({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        phone: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        post(route('admin.login.store'));
    };

    return (
        <GuestLayout>
            <Head title="ورود مدیران" />

            <div className="flex items-center gap-3">
                <BrandLogo className="guest-brand-mark" />
                <div>
                    <div className="text-xs font-black text-brand-700">مرکز رشد و کارآفرینی</div>
                    <div className="mt-0.5 text-[0.68rem] font-bold text-navy/45">دکتر بیدی · مسیر رشد شما</div>
                </div>
            </div>

            <div className="hero-kicker mt-6">
                <span className="hero-kicker-line" />
                <span>ورود امن مدیران</span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-navy md:text-3xl">
                ورود به پنل مدیریت
            </h1>
            <p className="mt-2 text-sm leading-7 text-navy/55">
                برای ورود، شماره موبایل مدیر و رمز عبور خود را وارد کنید.
            </p>

            {status && (
                <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold leading-6 text-brand-800">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
                <div>
                    <label htmlFor="phone" className="mb-1.5 block text-xs font-black text-navy/70">
                        شماره موبایل مدیر
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
                            autoFocus
                            placeholder="09xxxxxxxxx"
                            onChange={(event) => setData('phone', event.target.value)}
                            className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-left text-sm text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                        />
                    </div>
                    {errors.phone && (
                        <p className="mt-1.5 text-xs font-bold text-red-600">{errors.phone}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs font-black text-navy/70">
                        رمز عبور
                    </label>
                    <div className="relative">
                        <KeyRound className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" aria-hidden />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            dir="ltr"
                            value={data.password}
                            autoComplete="current-password"
                            placeholder="رمز عبور مدیر"
                            onChange={(event) => setData('password', event.target.value)}
                            className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-12 pr-11 text-left text-sm text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
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

                <div className="flex items-center justify-between gap-4">
                    <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-navy/60">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(event) => setData('remember', event.target.checked)}
                            className="size-4 rounded-md border-navy/20 text-brand-600 focus:ring-brand-500"
                        />
                        مرا به خاطر بسپار
                    </label>
                    <Link
                        href={route('password.request')}
                        className="text-xs font-black text-brand-700 transition-colors hover:text-brand-800"
                    >
                        فراموشی رمز عبور؟
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-3.5 text-base font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] disabled:opacity-60"
                >
                    <LogIn className="size-5" aria-hidden />
                    {processing ? 'در حال ورود...' : 'ورود به پنل مدیریت'}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-navy/45">
                    <ShieldCheck className="size-4 text-brand-600" aria-hidden />
                    ورود مدیران فقط با رمز عبور انجام می‌شود.
                </div>
            </form>

            <div className="mt-5 border-t border-navy/8 pt-5">
                <Link
                    href={route('login')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-7 py-3.5 text-sm font-black text-brand-700 transition-all hover:border-brand-400 hover:bg-brand-50 active:scale-[0.98]"
                >
                    ورود کاربران عادی
                    <ArrowLeft className="size-4" aria-hidden />
                </Link>
            </div>
        </GuestLayout>
    );
}
