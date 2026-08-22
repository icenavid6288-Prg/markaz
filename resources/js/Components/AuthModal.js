import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useForm } from '@inertiajs/react';
import BrandLogo from '@/Components/BrandLogo';
import { ArrowLeft, Eye, EyeOff, KeyRound, Gift, LogIn, MessageSquareText, Rocket, ShieldCheck, Smartphone, Ticket, User, X, } from 'lucide-react';
import { useEffect, useState } from 'react';
export default function AuthModal({ initialMode, sharedState, onClose, }) {
    const [mode, setMode] = useState(initialMode);
    const [step, setStep] = useState('phone');
    const [loginMethod, setLoginMethod] = useState('password');
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
        if (!sharedState)
            return;
        const nextStep = sharedState.step ?? 'code';
        setMode(sharedState.mode ?? 'login');
        setStep(nextStep);
        setResendSeconds(nextStep === 'code' ? 60 : 0);
        if (sharedState.phone) {
            form.setData('phone', sharedState.phone);
        }
    }, [sharedState]);
    useEffect(() => {
        if (resendSeconds <= 0)
            return;
        const timer = window.setTimeout(() => {
            setResendSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);
        return () => window.clearTimeout(timer);
    }, [resendSeconds]);
    const isLogin = mode === 'login';
    const isCodeStep = step === 'code';
    const resendCode = () => {
        if (resendSeconds > 0 || form.processing || !form.data.phone)
            return;
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
    const submit = (event) => {
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
    const switchMode = (nextMode) => {
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
            navigator.clipboard.writeText(form.data.referral_code.toUpperCase()).catch(() => { });
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-navy/55 p-4 backdrop-blur-md sm:p-6", role: "presentation", onMouseDown: (event) => {
            if (event.target === event.currentTarget)
                onClose();
        }, children: _jsxs("section", { role: "dialog", "aria-modal": "true", "aria-labelledby": "auth-modal-title", className: "liquid-card relative my-auto w-full max-w-lg overflow-visible p-6 shadow-2xl sm:p-8", onMouseDown: (event) => event.stopPropagation(), children: [_jsx("span", { className: "liquid-blob blob-a", "aria-hidden": true }), _jsx("span", { className: "liquid-blob blob-b", "aria-hidden": true }), _jsx("button", { type: "button", onClick: onClose, className: "absolute left-4 top-4 z-10 flex size-9 items-center justify-center rounded-xl border border-navy/10 bg-white/80 text-navy/45 transition-colors hover:bg-white hover:text-navy", "aria-label": "\u0628\u0633\u062A\u0646 \u067E\u0646\u062C\u0631\u0647", children: _jsx(X, { className: "size-4", "aria-hidden": true }) }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(BrandLogo, { className: "auth-brand-mark" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-black text-brand-700", children: "\u0645\u0631\u06A9\u0632 \u0631\u0634\u062F \u0648 \u06A9\u0627\u0631\u0622\u0641\u0631\u06CC\u0646\u06CC" }), _jsx("div", { className: "mt-0.5 text-[0.68rem] font-bold text-navy/45", children: "\u062F\u06A9\u062A\u0631 \u0628\u06CC\u062F\u06CC \u00B7 \u0645\u0633\u06CC\u0631 \u0631\u0634\u062F \u0634\u0645\u0627" })] })] }), _jsxs("div", { className: "mt-6 flex items-center gap-2", children: [_jsx("span", { className: "hero-kicker-line" }), _jsx("span", { className: "text-xs font-black text-brand-700", children: isCodeStep ? (isLogin ? 'تأیید امن ورود' : 'تأیید امن ثبت‌نام') : isLogin ? 'خوش برگشتید' : 'آغاز مسیر' })] }), _jsx("h2", { id: "auth-modal-title", className: "mt-2 text-2xl font-black text-navy", children: isCodeStep
                                ? isLogin
                                    ? 'کد ورود را وارد کنید'
                                    : 'کد تأیید را وارد کنید'
                                : isLogin
                                    ? 'ورود به حساب کاربری'
                                    : 'ساخت حساب کاربری' }), _jsx("p", { className: "mt-2 max-w-md text-sm leading-7 text-navy/55", children: isCodeStep
                                ? `کد شش‌رقمی ارسال‌شده به شماره ${form.data.phone} را وارد کنید.`
                                : isLogin
                                    ? loginMethod === 'password'
                                        ? 'شماره موبایل و رمز عبور خود را وارد کنید.'
                                        : 'فقط شماره موبایل خود را وارد کنید؛ کد ورود برایتان پیامک می‌شود.'
                                    : 'با ساخت حساب، دوره‌ها، کوچینگ و مسیر رشد اختصاصی شما یکجا در دسترس است.' }), sharedState?.status && (_jsx("div", { className: "mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800", children: sharedState.status })), isCodeStep && sharedState?.dev_code && (_jsx("div", { className: "mt-4 rounded-2xl border border-dashed border-gold/40 bg-gold/10 px-4 py-3 text-xs font-bold leading-6 text-[#7a5c10]", children: _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx(Ticket, { className: "size-4", "aria-hidden": true }), "\u06A9\u062F \u062A\u0633\u062A\u06CC (\u0641\u0642\u0637 \u062F\u0631 \u0645\u062D\u06CC\u0637 \u062A\u0648\u0633\u0639\u0647): ", sharedState.dev_code] }) })), _jsxs("form", { onSubmit: submit, className: "mt-6 flex flex-col gap-4", children: [!isLogin && !isCodeStep && (_jsx(Field, { label: "\u0646\u0627\u0645 \u0648 \u0646\u0627\u0645 \u062E\u0627\u0646\u0648\u0627\u062F\u06AF\u06CC", id: "name", error: form.errors.name, children: _jsxs("div", { className: "relative", children: [_jsx(User, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "name", type: "text", value: form.data.name, autoFocus: true, autoComplete: "name", placeholder: "\u0645\u062B\u0644\u0627\u064B: \u0645\u0631\u06CC\u0645 \u0627\u062D\u0645\u062F\u06CC", onChange: (event) => form.setData('name', event.target.value), className: "auth-modal-input" })] }) })), _jsx(Field, { label: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644", id: "phone", error: form.errors.phone, children: _jsxs("div", { className: "relative", children: [_jsx(Smartphone, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "phone", type: "tel", dir: "ltr", inputMode: "numeric", value: form.data.phone, readOnly: isCodeStep, autoFocus: isLogin && !isCodeStep, autoComplete: "tel", placeholder: "09xxxxxxxxx", onChange: (event) => form.setData('phone', event.target.value), className: `auth-modal-input ${isCodeStep ? 'cursor-not-allowed bg-navy/[0.03] text-navy/60' : ''}` })] }) }), isLogin && !isCodeStep && loginMethod === 'password' && (_jsx(Field, { label: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631", id: "password", error: form.errors.password, children: _jsxs("div", { className: "relative", children: [_jsx(KeyRound, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "password", type: showPassword ? 'text' : 'password', dir: "ltr", value: form.data.password, autoComplete: "current-password", placeholder: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062D\u0633\u0627\u0628 \u0634\u0645\u0627", onChange: (event) => form.setData('password', event.target.value), className: "auth-modal-input pl-11" }), _jsx(PasswordToggle, { show: showPassword, onClick: () => setShowPassword((value) => !value) })] }) })), isCodeStep && (_jsx(Field, { label: isLogin ? 'کد ورود پیامکی' : 'کد تأیید پیامکی', id: "code", error: form.errors.code, children: _jsxs("div", { className: "relative", children: [_jsx(Ticket, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "code", type: "text", dir: "ltr", inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6, autoFocus: true, value: form.data.code, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022", onChange: (event) => form.setData('code', event.target.value.replace(/\D/g, '')), className: "auth-modal-input text-center text-lg font-black tracking-[0.45em]" })] }) })), !isLogin && !isCodeStep && (_jsxs(_Fragment, { children: [_jsx(Field, { label: "\u06A9\u062F \u0645\u0639\u0631\u0641 (\u0627\u062E\u062A\u06CC\u0627\u0631\u06CC)", id: "referral_code", error: form.errors.referral_code, children: _jsxs("div", { className: "relative", children: [_jsx(Gift, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "referral_code", type: "text", dir: "ltr", maxLength: 12, value: form.data.referral_code, placeholder: "\u0645\u062B\u0644\u0627\u064B AB3K7QP", onChange: (event) => form.setData('referral_code', event.target.value.toUpperCase()), className: "auth-modal-input" }), form.data.referral_code && (_jsx("button", { type: "button", onClick: copyReferral, className: "absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-brand-700", tabIndex: -1, children: "\u06A9\u067E\u06CC" }))] }) }), _jsx(Field, { label: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631", id: "password", error: form.errors.password, children: _jsxs("div", { className: "relative", children: [_jsx(KeyRound, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "password", type: showPassword ? 'text' : 'password', dir: "ltr", value: form.data.password, autoComplete: "new-password", placeholder: "\u062D\u062F\u0627\u0642\u0644 \u06F8 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631", onChange: (event) => form.setData('password', event.target.value), className: "auth-modal-input pl-11" }), _jsx(PasswordToggle, { show: showPassword, onClick: () => setShowPassword((value) => !value) })] }) }), _jsx(Field, { label: "\u062A\u06A9\u0631\u0627\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631", id: "password_confirmation", error: form.errors.password_confirmation, children: _jsxs("div", { className: "relative", children: [_jsx(KeyRound, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "password_confirmation", type: showPassword ? 'text' : 'password', dir: "ltr", value: form.data.password_confirmation, autoComplete: "new-password", placeholder: "\u062A\u06A9\u0631\u0627\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631", onChange: (event) => form.setData('password_confirmation', event.target.value), className: "auth-modal-input" })] }) })] })), isLogin && (_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("label", { className: "flex cursor-pointer items-center gap-2 text-xs font-bold text-navy/60", children: [_jsx("input", { type: "checkbox", checked: form.data.remember, onChange: (event) => form.setData('remember', event.target.checked), className: "size-4 rounded-md border-navy/20 text-brand-600 focus:ring-brand-500" }), "\u0645\u0631\u0627 \u0628\u0647 \u062E\u0627\u0637\u0631 \u0628\u0633\u067E\u0627\u0631"] }), !isCodeStep && (_jsx(Link, { href: route('password.request'), onClick: onClose, className: "text-xs font-black text-brand-700 hover:text-brand-800", children: "\u0641\u0631\u0627\u0645\u0648\u0634\u06CC \u0631\u0645\u0632 \u0639\u0628\u0648\u0631\u061F" }))] })), _jsxs("button", { type: "submit", disabled: form.processing, className: "mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-6 py-3.5 text-sm font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] disabled:opacity-60", children: [isLogin ? (isCodeStep ? _jsx(LogIn, { className: "size-5", "aria-hidden": true }) : loginMethod === 'password' ? _jsx(LogIn, { className: "size-5", "aria-hidden": true }) : _jsx(MessageSquareText, { className: "size-5", "aria-hidden": true })) : _jsx(Rocket, { className: "size-5", "aria-hidden": true }), form.processing ? 'در حال بررسی...' : isCodeStep ? (isLogin ? 'ورود به پنل' : 'تأیید و ساخت حساب') : isLogin ? (loginMethod === 'password' ? 'ورود به حساب' : 'دریافت کد ورود') : 'شروع مسیر رشد'] }), isLogin && !isCodeStep && (_jsx("button", { type: "button", onClick: toggleLoginMethod, className: "text-xs font-black text-brand-700 transition-colors hover:text-brand-800", children: loginMethod === 'password' ? 'رمز عبور را ندارید؟ ورود با کد پیامکی' : 'ورود با رمز عبور' })), isCodeStep && (_jsxs("div", { className: "flex flex-col items-center justify-center gap-2 text-xs font-bold text-navy/45", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ShieldCheck, { className: "size-4 text-brand-600", "aria-hidden": true }), "\u06A9\u062F ", isLogin ? 'ورود' : 'تأیید', " \u0641\u0642\u0637 \u06F5 \u062F\u0642\u06CC\u0642\u0647 \u0627\u0639\u062A\u0628\u0627\u0631 \u062F\u0627\u0631\u062F."] }), _jsx("button", { type: "button", onClick: resendCode, disabled: form.processing || resendSeconds > 0, className: "font-black text-brand-700 transition-colors hover:text-brand-800 disabled:cursor-not-allowed disabled:text-navy/35", children: resendSeconds > 0 ? `ارسال مجدد کد تا ${resendSeconds} ثانیه` : 'ارسال مجدد کد' })] }))] }), _jsx("div", { className: "mt-5 border-t border-navy/8 pt-5 text-center", children: isCodeStep ? (_jsxs(Link, { href: isLogin ? route('login', { fresh: 1 }) : route('register', { fresh: 1 }), onClick: onClose, className: "inline-flex items-center gap-2 text-xs font-black text-brand-700 hover:text-brand-800", children: [isLogin ? 'ورود با شماره دیگر' : 'شروع دوباره با شماره دیگر', _jsx(ArrowLeft, { className: "size-4", "aria-hidden": true })] })) : (_jsx("button", { type: "button", onClick: () => switchMode(isLogin ? 'register' : 'login'), className: "text-xs font-black text-brand-700 hover:text-brand-800", children: isLogin ? 'حساب کاربری ندارید؟ ساخت حساب جدید' : 'قبلاً حساب ساخته‌اید؟ ورود به حساب' })) })] })] }) }));
}
function Field({ label, id, error, children, }) {
    return (_jsxs("div", { children: [_jsx("label", { htmlFor: id, className: "mb-1.5 block text-xs font-black text-navy/70", children: label }), children, error && _jsx("p", { className: "mt-1.5 text-xs font-bold text-red-600", children: error })] }));
}
function PasswordToggle({ show, onClick }) {
    return (_jsx("button", { type: "button", onClick: onClick, className: "absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-navy/35 transition-colors hover:text-brand-700", "aria-label": show ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور', tabIndex: -1, children: show ? _jsx(EyeOff, { className: "size-4", "aria-hidden": true }) : _jsx(Eye, { className: "size-4", "aria-hidden": true }) }));
}
