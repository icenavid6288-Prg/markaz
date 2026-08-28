import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, router, useForm } from '@inertiajs/react';
import BrandLogo from '@/Components/BrandLogo';
import { ArrowLeft, Gift, LogIn, MessageSquareText, Rocket, ShieldCheck, Smartphone, Ticket, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
export default function AuthModal({ initialMode, sharedState, onClose }) {
    const [mode, setMode] = useState(initialMode);
    const [step, setStep] = useState('phone');
    const [resendSeconds, setResendSeconds] = useState(0);
    const form = useForm({ name: '', phone: sharedState?.phone ?? '', code: '', referral_code: '', modal: true });
    useEffect(() => {
        if (!sharedState) return;
        const nextStep = sharedState.step ?? 'code';
        setMode(sharedState.mode ?? 'login');
        setStep(nextStep);
        setResendSeconds(nextStep === 'code' ? 60 : 0);
        if (sharedState.phone) form.setData('phone', sharedState.phone);
    }, [sharedState]);
    useEffect(() => {
        if (resendSeconds <= 0) return;
        const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => window.clearTimeout(timer);
    }, [resendSeconds]);
    const isLogin = mode === 'login';
    const isCodeStep = step === 'code';
    const sendCode = () => {
        if (resendSeconds > 0 || form.processing || !form.data.phone) return;
        form.setData('code', '');
        form.post(isLogin ? route('login') : route('register'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => { setStep('code'); setResendSeconds(60); },
        });
    };
    const submit = (event) => {
        event.preventDefault();
        if (!isCodeStep) {
            sendCode();
            return;
        }
        form.post(isLogin ? route('login.verify.store') : route('register.verify.store'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => { onClose(); router.visit(route('dashboard'), { replace: true }); },
        });
    };
    const switchMode = (nextMode) => {
        setMode(nextMode);
        setStep('phone');
        form.clearErrors();
        form.reset('name', 'phone', 'code', 'referral_code');
    };
    return (_jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-navy/55 p-4 backdrop-blur-md sm:p-6", role: "presentation", onMouseDown: (event) => { if (event.target === event.currentTarget) onClose(); }, children: _jsxs("section", { role: "dialog", "aria-modal": "true", "aria-labelledby": "auth-modal-title", className: "liquid-card relative my-auto w-full max-w-lg overflow-visible p-6 shadow-2xl sm:p-8", onMouseDown: (event) => event.stopPropagation(), children: [_jsx("span", { className: "liquid-blob blob-a", "aria-hidden": true }), _jsx("span", { className: "liquid-blob blob-b", "aria-hidden": true }), _jsx("button", { type: "button", onClick: onClose, className: "absolute left-4 top-4 z-10 flex size-9 items-center justify-center rounded-xl border border-navy/10 bg-white/80 text-navy/45 transition-colors hover:bg-white hover:text-navy", "aria-label": "بستن پنجره", children: _jsx(X, { className: "size-4", "aria-hidden": true }) }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(BrandLogo, { className: "auth-brand-mark" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-black text-brand-700", children: "مرکز رشد و کارآفرینی" }), _jsx("div", { className: "mt-0.5 text-[0.68rem] font-bold text-navy/45", children: "دکتر بیدی · مسیر رشد شما" })] })] }), _jsxs("div", { className: "mt-6 flex items-center gap-2", children: [_jsx("span", { className: "hero-kicker-line" }), _jsx("span", { className: "text-xs font-black text-brand-700", children: isCodeStep ? (isLogin ? 'تأیید امن ورود' : 'تأیید امن ثبت‌نام') : isLogin ? 'ورود با کد یک‌بارمصرف' : 'آغاز مسیر' })] }), _jsx("h2", { id: "auth-modal-title", className: "mt-2 text-2xl font-black text-navy", children: isCodeStep ? (isLogin ? 'کد ورود را وارد کنید' : 'کد تأیید را وارد کنید') : (isLogin ? 'ورود به حساب کاربری' : 'ساخت حساب کاربری') }), _jsx("p", { className: "mt-2 max-w-md text-sm leading-7 text-navy/55", children: isCodeStep ? `کد شش‌رقمی ارسال‌شده به شماره ${form.data.phone} را وارد کنید.` : isLogin ? 'فقط شماره موبایل خود را وارد کنید؛ کد ورود برایتان پیامک می‌شود.' : 'با ساخت حساب، دوره‌ها، کوچینگ و مسیر رشد اختصاصی شما یکجا در دسترس است.' }), sharedState?.status && _jsx("div", { className: "mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800", children: sharedState.status }), isCodeStep && sharedState?.dev_code && _jsx("div", { className: "mt-4 rounded-2xl border border-dashed border-gold/40 bg-gold/10 px-4 py-3 text-xs font-bold leading-6 text-[#7a5c10]", children: _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx(Ticket, { className: "size-4", "aria-hidden": true }), "کد تستی (فقط در محیط توسعه): ", sharedState.dev_code] }) }), _jsxs("form", { onSubmit: submit, className: "mt-6 flex flex-col gap-4", children: [!isLogin && !isCodeStep && _jsx(Field, { label: "نام و نام خانوادگی", id: "name", error: form.errors.name, children: _jsxs("div", { className: "relative", children: [_jsx(User, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "name", type: "text", value: form.data.name, autoFocus: true, autoComplete: "name", placeholder: "مثلاً: مریم احمدی", onChange: (event) => form.setData('name', event.target.value), className: "auth-modal-input" })] }) }), _jsx(Field, { label: "شماره موبایل", id: "phone", error: form.errors.phone, children: _jsxs("div", { className: "relative", children: [_jsx(Smartphone, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "phone", type: "tel", dir: "ltr", inputMode: "numeric", value: form.data.phone, readOnly: isCodeStep, autoFocus: isLogin && !isCodeStep, autoComplete: "tel", placeholder: "09xxxxxxxxx", onChange: (event) => form.setData('phone', event.target.value), className: `auth-modal-input ${isCodeStep ? 'cursor-not-allowed bg-navy/[0.03] text-navy/60' : ''}` })] }) }), isCodeStep && _jsx(Field, { label: isLogin ? 'کد ورود پیامکی' : 'کد تأیید پیامکی', id: "code", error: form.errors.code, children: _jsxs("div", { className: "relative", children: [_jsx(Ticket, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "code", type: "text", dir: "ltr", inputMode: "numeric", autoComplete: "one-time-code", maxLength: 6, autoFocus: true, value: form.data.code, placeholder: "••••••", onChange: (event) => form.setData('code', event.target.value.replace(/\D/g, '')), className: "auth-modal-input text-center text-lg font-black tracking-[0.45em]" })] }) }), !isLogin && !isCodeStep && _jsx(Field, { label: "کد معرف (اختیاری)", id: "referral_code", error: form.errors.referral_code, children: _jsxs("div", { className: "relative", children: [_jsx(Gift, { className: "input-icon", "aria-hidden": true }), _jsx("input", { id: "referral_code", type: "text", dir: "ltr", maxLength: 12, value: form.data.referral_code, placeholder: "مثلاً AB3K7QP", onChange: (event) => form.setData('referral_code', event.target.value.toUpperCase()), className: "auth-modal-input" })] }) }), _jsxs("button", { type: "submit", disabled: form.processing, className: "mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-6 py-3.5 text-sm font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98] disabled:opacity-60", children: [isLogin ? (isCodeStep ? _jsx(LogIn, { className: "size-5", "aria-hidden": true }) : _jsx(MessageSquareText, { className: "size-5", "aria-hidden": true })) : _jsx(Rocket, { className: "size-5", "aria-hidden": true }), form.processing ? 'در حال بررسی...' : isCodeStep ? (isLogin ? 'ورود به حساب' : 'تأیید و ساخت حساب') : isLogin ? 'دریافت کد ورود' : 'شروع مسیر رشد'] }), isCodeStep && _jsxs("div", { className: "flex flex-col items-center justify-center gap-2 text-xs font-bold text-navy/45", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ShieldCheck, { className: "size-4 text-brand-600", "aria-hidden": true }), "کد ", isLogin ? 'ورود' : 'تأیید', " فقط ۵ دقیقه اعتبار دارد."] }), _jsx("button", { type: "button", onClick: sendCode, disabled: form.processing || resendSeconds > 0, className: "font-black text-brand-700 transition-colors hover:text-brand-800 disabled:cursor-not-allowed disabled:text-navy/35", children: resendSeconds > 0 ? `ارسال مجدد کد تا ${resendSeconds} ثانیه` : 'ارسال مجدد کد' })] })] }), _jsxs("div", { className: "mt-5 border-t border-navy/8 pt-5 text-center", children: [isCodeStep ? _jsx(Link, { href: isLogin ? route('login', { fresh: 1 }) : route('register', { fresh: 1 }), onClick: onClose, className: "inline-flex items-center gap-2 text-xs font-black text-brand-700 hover:text-brand-800", children: [isLogin ? 'ورود با شماره دیگر' : 'شروع دوباره با شماره دیگر', _jsx(ArrowLeft, { className: "size-4", "aria-hidden": true })] }) : _jsx("button", { type: "button", onClick: () => switchMode(isLogin ? 'register' : 'login'), className: "text-xs font-black text-brand-700 hover:text-brand-800", children: isLogin ? 'حساب کاربری ندارید؟ ساخت حساب جدید' : 'قبلاً حساب ساخته‌اید؟ ورود به حساب' })] })] })] }) }));
}
function Field({ label, id, error, children }) {
    return _jsxs("div", { children: [_jsx("label", { htmlFor: id, className: "mb-1.5 block text-xs font-black text-navy/70", children: label }), children, error && _jsx("p", { className: "mt-1.5 text-xs font-bold text-red-600", children: error })] });
}
