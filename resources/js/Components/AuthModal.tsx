import { Link, useForm } from '@inertiajs/react';
import BrandLogo from '@/Components/BrandLogo';
import {
    ArrowLeft,
    Eye,
    EyeOff,
    KeyRound,
    Gift,
    LogIn,
    MessageSquareText,
    Rocket,
    ShieldCheck,
    Smartphone,
    Ticket,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

interface AuthModalState {
    mode?: 'login' | 'register';
    step?: 'phone' | 'code';
    phone?: string;
    dev_code?: string | null;
    status?: string;
}

export default function AuthModal({
    initialMode,
    sharedState,
    onClose,
}: {
    initialMode: 'login' | 'register';
    sharedState?: AuthModalState | null;
    onClose: () => void;
}) {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const [step, setStep] = useState<'phone' | 'code'>('phone');
    const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
    const [resendSeconds, setResendSeconds] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm({
        name: '',
        phone: sharedState?.phone ?? '',
        code: '',
        password: '',
        password_confirmation: '',
        referral_code: '',
        remember: false,
        modal: true,
    });

    useEffect(() => {
        if (! sharedState) return;

        const nextStep = sharedState.step ?? 'code';
        setMode(sharedState.mode ?? 'login');
        setStep(nextStep);
        setResendSeconds(nextStep === 'code' ? 60 : 0);
        if (sharedState.phone) {
            form.setData('phone', sharedState.phone);
        }
    }, [sharedState]);

    useEffect(() => {
        if (resendSeconds <= 0) return;

        const timer = window.setTimeout(() => {
            setResendSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [resendSeconds]);

    const isLogin = mode === 'login';
    const isCodeStep = step === 'code';

    const resendCode = () => {
        if (resendSeconds > 0 || form.processing || !form.data.phone) return;

        form.setData('code', '');
        form.setData('password', '');
        form.post(isLogin ? route('login') : route('register'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setStep('code');
                setResendSeconds(60);
            },
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (isLogin) {
            form.post(isCodeStep ? route('login.verify.store') : route('login'), {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (!isCodeStep && loginMethod === 'otp') {
                        setStep('code');
                        setResendSeconds(60);
                    }
                },
            });
            return;
        }

        form.post(isCodeStep ? route('register.verify.store') : route('register'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                if (!isCodeStep) {
                    setStep('code');
                    setResendSeconds(60);
                }
            },
        });
    };

    const switchMode = (nextMode: 'login' | 'register') => {
        setMode(nextMode);
        setStep('phone');
        setLoginMethod('password');
        setShowPassword(false);
        form.clearErrors();
        form.reset('name', 'phone', 'code', 'password', 'password_confirmation', 'referral_code');
    };

    const toggleLoginMethod = () => {
        setLoginMethod((current) => (current === 'password' ? 'otp' : 'password'));
        form.setData('password', '');
        setShowPassword(false);
        form.clearErrors('password');
    };

    const copyReferral = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(form.data.referral_code.toUpperCase()).catch(() => {});
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-navy/55 p-4 backdrop-blur-md sm:p-6"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-modal-title"
                className="liquid-card relative my-auto w-full max-w-lg overflow-visible p-6 shadow-2xl sm:p-8"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <span className="liquid-blob blob-a" aria-hidden />
                <span className="liquid-blob blob-b" aria-hidden />

                <button
                    type="button"
                    onClick={onClose}
                    className="absolute left-4 top-4 z-10 flex size-9 items-center justify-center rounded-xl border border-navy/10 bg-white/80 text-navy/45 transition-colors hover:bg-white hover:text-navy"
                    aria-label="بستن پنجره"
                >
                    <X className="size-4" aria-hidden />
                </button>

                <div className="relative">
                    <div className="flex items-center gap-3">
                        <BrandLogo className="auth-brand-mark" />
                        <div>
                            <div className="text-xs font-black text-brand-700">مرکز رشد و کارآفرینی</div>
                            <div className="mt-0.5 text-[0.68rem] font-bold text-navy/45">دکتر بیدی · مسیر رشد شما</div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                        <span className="hero-kicker-line" />
                        <span className="text-xs font-black text-brand-700">
                            {isCodeStep ? (isLogin ? 'تأیید امن ورود' : 'تأیید امن ثبت‌نام') : isLogin ? 'خوش برگشتید' : 'آغاز مسیر'}
                        </span>
                    </div>

                    <h2 id="auth-modal-title" className="mt-2 text-2xl font-black text-navy">
                        {isCodeStep
                            ? isLogin
                                ? 'کد ورود را وارد کنید'
                                : 'کد تأیید را وارد کنید'
                            : isLogin
                                ? 'ورود به حساب کاربری'
                                : 'ساخت حساب کاربری'}
                    </h2>
                    <p className="mt-2 max-w-md text-sm leading-7 text-navy/55">
                        {isCodeStep
                            ? `کد شش‌رقمی ارسال‌شده به شماره ${form.data.phone} را وارد کنید.`
                            : isLogin
                                ? loginMethod === 'password'
                                    ? 'شماره موبایل و رمز عبور خود را وارد کنید.'
                                    : 'فقط شماره موبایل خود را وارد کنید؛ کد ورود برایتان پیامک می‌شود.'
                                : 'با ساخت حساب، دوره‌ها، کوچینگ و مسیر رشد اختصاصی شما یکجا در دسترس است.'}
                    </p>

                    {sharedState?.status && (
                        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800">
                            {sharedState.status}
                        </div>
                    )}

                    {isCodeStep && sharedState?.dev_code && (
                        <div className="mt-4 rounded-2xl border border-dashed border-gold/40 bg-gold/10 px-4 py-3 text-xs font-bold leading-6 text-[#7a5c10]">
                            <span className="flex items-center gap-1.5">
                                <Ticket className="size-4" aria-hidden />
                                کد تستی (فقط در محیط توسعه): {sharedState.dev_code}
                            </span>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                        {!isLogin && !isCodeStep && (
                            <Field label="نام و نام خانوادگی" id="name" error={form.errors.name}>
                                <div className="relative">
                                    <User className="input-icon" aria-hidden />
                                    <input
                                        id="name"
                                        type="text"
                                        value={form.data.name}
                                        autoFocus
                                        autoComplete="name"
                                        placeholder="مثلاً: مریم احمدی"
                                        onChange={(event) => form.setData('name', event.target.value)}
                                        className="auth-modal-input"
                                    />
                                </div>
                            </Field>
                        )}

                        <Field label="شماره موبایل" id="phone" error={form.errors.phone}>
                            <div className="relative">
                                <Smartphone className="input-icon" aria-hidden />
                                <input
                                    id="phone"
                                    type="tel"
                                    dir="ltr"
                                    inputMode="numeric"
                                    value={form.data.phone}
                                    readOnly={isCodeStep}
                                    autoFocus={isLogin && !isCodeStep}
                                    autoComplete="tel"
                                    placeholder="09xxxxxxxxx"
                                    onChange={(event) => form.setData('phone', event.target.value)}
                                    className={`auth-modal-input ${isCodeStep ? 'cursor-not-allowed bg-navy/[0.03] text-navy/60' : ''}`}
                                />
                            </div>
                        </Field>

                        {isLogin && !isCodeStep && loginMethod === 'password' && (
                            <Field label="رمز عبور" id="password" error={form.errors.password}>
                                <div className="relative">
                                    <KeyRound className="input-icon" aria-hidden />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        dir="ltr"
                                        value={form.data.password}
                                        autoComplete="current-password"
                                        placeholder="رمز عبور حساب شما"
                                        onChange={(event) => form.setData('password', event.target.value)}
                                        className="auth-modal-input pl-11"
                                    />
                                    <PasswordToggle show={showPassword} onClick={() => setShowPassword((value) => !value)} />
                                </div>
                            </Field>
                        )}

                        {isCodeStep && (
                            <Field label={isLogin ? 'کد ورود پیامکی' : 'کد تأیید پیامکی'} id="code" error={form.errors.code}>
                                <div className="relative">
                                    <Ticket className="input-icon" aria-hidden />
                                    <input
                                        id="code"
                                        type="text"
                                        dir="ltr"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        autoFocus
                                        value={form.data.code}
                                        placeholder="••••••"
                                        onChange={(event) => form.setData('code', event.target.value.replace(/\D/g, ''))}
                                        className="auth-modal-input text-center text-lg font-black tracking-[0.45em]"
                                    />
                                </div>
                            </Field>
                        )}

                        {!isLogin && !isCodeStep && (
                            <>
                                <Field label="کد معرف (اختیاری)" id="referral_code" error={form.errors.referral_code}>
                                    <div className="relative">
                                        <Gift className="input-icon" aria-hidden />
                                        <input
                                            id="referral_code"
                                            type="text"
                                            dir="ltr"
                                            maxLength={12}
                                            value={form.data.referral_code}
                                            placeholder="مثلاً AB3K7QP"
                                            onChange={(event) => form.setData('referral_code', event.target.value.toUpperCase())}
                                            className="auth-modal-input"
                                        />
                                        {form.data.referral_code && (
                                            <button type="button" onClick={copyReferral} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-brand-700" tabIndex={-1}>کپی</button>
                                        )}
                                    </div>
                                </Field>
                                <Field label="رمز عبور" id="password" error={form.errors.password}>
                                    <div className="relative">
                                        <KeyRound className="input-icon" aria-hidden />
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            dir="ltr"
                                            value={form.data.password}
                                            autoComplete="new-password"
                                            placeholder="حداقل ۸ کاراکتر"
                                            onChange={(event) => form.setData('password', event.target.value)}
                                            className="auth-modal-input pl-11"
                                        />
                                        <PasswordToggle show={showPassword} onClick={() => setShowPassword((value) => !value)} />
                                    </div>
                                </Field>
                                <Field label="تکرار رمز عبور" id="password_confirmation" error={form.errors.password_confirmation}>
                                    <div className="relative">
                                        <KeyRound className="input-icon" aria-hidden />
                                        <input
                                            id="password_confirmation"
                                            type={showPassword ? 'text' : 'password'}
                                            dir="ltr"
                                            value={form.data.password_confirmation}
                                            autoComplete="new-password"
                                            placeholder="تکرار رمز عبور"
                                            onChange={(event) => form.setData('password_confirmation', event.target.value)}
                                            className="auth-modal-input"
                                        />
                                    </div>
                                </Field>
                            </>
                        )}

                        {isLogin && (
                            <div className="flex items-center justify-between gap-3">
                                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-navy/60">
                                    <input
                                        type="checkbox"
                                        checked={form.data.remember}
                                        onChange={(event) => form.setData('remember', event.target.checked)}
                                        className="size-4 rounded-md border-navy/20 text-brand-600 focus:ring-brand-500"
                                    />
                                    مرا به خاطر بسپار
                                </label>
                                {!isCodeStep && (
                                    <Link
                                        href={route('password.request')}
                                        onClick={onClose}
                                        className="text-xs font-black text-brand-700 hover:text-brand-800"
                                    >
                                        فراموشی رمز عبور؟
                                    </Link>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-6 py-3.5 text-sm font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] disabled:opacity-60"
                        >
                            {isLogin ? (isCodeStep ? <LogIn className="size-5" aria-hidden /> : loginMethod === 'password' ? <LogIn className="size-5" aria-hidden /> : <MessageSquareText className="size-5" aria-hidden />) : <Rocket className="size-5" aria-hidden />}
                            {form.processing ? 'در حال بررسی...' : isCodeStep ? (isLogin ? 'ورود به پنل' : 'تأیید و ساخت حساب') : isLogin ? (loginMethod === 'password' ? 'ورود به حساب' : 'دریافت کد ورود') : 'شروع مسیر رشد'}
                        </button>

                        {isLogin && !isCodeStep && (
                            <button
                                type="button"
                                onClick={toggleLoginMethod}
                                className="text-xs font-black text-brand-700 transition-colors hover:text-brand-800"
                            >
                                {loginMethod === 'password' ? 'رمز عبور را ندارید؟ ورود با کد پیامکی' : 'ورود با رمز عبور'}
                            </button>
                        )}

                        {isCodeStep && (
                            <div className="flex flex-col items-center justify-center gap-2 text-xs font-bold text-navy/45">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-brand-600" aria-hidden />
                                    کد {isLogin ? 'ورود' : 'تأیید'} فقط ۵ دقیقه اعتبار دارد.
                                </div>
                                <button
                                    type="button"
                                    onClick={resendCode}
                                    disabled={form.processing || resendSeconds > 0}
                                    className="font-black text-brand-700 transition-colors hover:text-brand-800 disabled:cursor-not-allowed disabled:text-navy/35"
                                >
                                    {resendSeconds > 0 ? `ارسال مجدد کد تا ${resendSeconds} ثانیه` : 'ارسال مجدد کد'}
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="mt-5 border-t border-navy/8 pt-5 text-center">
                        {isCodeStep ? (
                            <Link
                                href={isLogin ? route('login', { fresh: 1 }) : route('register', { fresh: 1 })}
                                onClick={onClose}
                                className="inline-flex items-center gap-2 text-xs font-black text-brand-700 hover:text-brand-800"
                            >
                                {isLogin ? 'ورود با شماره دیگر' : 'شروع دوباره با شماره دیگر'}
                                <ArrowLeft className="size-4" aria-hidden />
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => switchMode(isLogin ? 'register' : 'login')}
                                className="text-xs font-black text-brand-700 hover:text-brand-800"
                            >
                                {isLogin ? 'حساب کاربری ندارید؟ ساخت حساب جدید' : 'قبلاً حساب ساخته‌اید؟ ورود به حساب'}
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

function Field({
    label,
    id,
    error,
    children,
}: {
    label: string;
    id: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-xs font-black text-navy/70">
                {label}
            </label>
            {children}
            {error && <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p>}
        </div>
    );
}

function PasswordToggle({ show, onClick }: { show: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-navy/35 transition-colors hover:text-brand-700"
            aria-label={show ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
            tabIndex={-1}
        >
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
    );
}
