import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Rocket, ShieldCheck, Smartphone, Ticket, User } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

export default function SurveyRegister({
    survey,
    answeredCount,
    remainingCount,
    registerBeforeStart,
    status,
    step = 'form',
    phone = '',
    dev_code = null,
}: {
    survey: { title: string; poster_url?: string | null };
    answeredCount: number;
    remainingCount: number;
    registerBeforeStart?: boolean;
    status?: string;
    step?: 'form' | 'code';
    phone?: string;
    dev_code?: string | null;
}) {
    const isCodeStep = step === 'code';
    const form = useForm({
        name: '',
        phone: isCodeStep ? phone : '',
        code: '',
    });
    const [resendSeconds, setResendSeconds] = useState(isCodeStep ? 60 : 0);
    const input = 'w-full rounded-xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

    useEffect(() => {
        setResendSeconds(isCodeStep ? 60 : 0);
    }, [isCodeStep, phone]);

    useEffect(() => {
        if (resendSeconds <= 0) return;
        const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => window.clearTimeout(timer);
    }, [resendSeconds]);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (isCodeStep) {
            form.post(`${window.location.pathname.replace(/\/$/, '')}/verify`, { preserveScroll: true });
            return;
        }
        form.post(window.location.pathname, { preserveScroll: true });
    };

    const resendCode = () => {
        if (resendSeconds > 0 || form.processing || !form.data.phone) return;
        form.setData('code', '');
        form.post(window.location.pathname.replace(/\/verify$/, '').replace(/\?.*$/, ''), {
            preserveScroll: true,
            onSuccess: () => setResendSeconds(60),
        });
    };

    return (
        <div dir="rtl" className="min-h-screen bg-soft-gray px-4 py-8 md:px-6">
            <Head title={`ورود برای ${survey.title}`} />
            <main className="mx-auto flex w-full max-w-2xl flex-col gap-5">
                <header className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-soft ring-1 ring-navy/5">
                    <div className="text-sm font-black text-navy">ادامه فرم</div>
                    <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-navy/45 hover:text-brand-700">سایت <ArrowRight className="size-3.5" /></Link>
                </header>
                {survey.poster_url && (
                    <section className="overflow-hidden rounded-[2rem] bg-white shadow-lift ring-1 ring-navy/5">
                        <img src={survey.poster_url} alt={survey.title} className="max-h-[28rem] w-full object-cover" />
                    </section>
                )}
                <section className="rounded-[2rem] bg-deep-gradient p-7 text-white shadow-lift md:p-10">
                    <div className="flex items-center gap-2 text-xs font-black text-brand-200"><Rocket className="size-4" /> تأیید شماره موبایل</div>
                    <h1 className="mt-4 text-2xl font-black leading-relaxed">
                        {isCodeStep ? 'کد تأیید را وارد کنید' : registerBeforeStart ? 'برای شروع فرم، شماره موبایل را تأیید کنید' : 'برای ادامه، شماره موبایل را تأیید کنید'}
                    </h1>
                    <p className="mt-3 text-sm leading-8 text-white/65">
                        {isCodeStep
                            ? `کد شش‌رقمی ارسال‌شده به شماره ${phone} را وارد کنید.`
                            : registerBeforeStart
                                ? `مثل ورود سایت، فقط نام و موبایل کافی است. کد یک‌بارمصرف پیامک می‌شود و بعد ${remainingCount} سؤال نمایش داده می‌شود.`
                                : `${answeredCount} پاسخ شما ذخیره شده است. بعد از تأیید پیامکی، ${remainingCount} سؤال باقی‌مانده نمایش داده می‌شود.`}
                    </p>
                </section>
                <section className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-navy/5 md:p-8">
                    {status && <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-xs font-bold text-brand-900">{status}</div>}
                    {isCodeStep && dev_code && (
                        <div className="mb-5 rounded-xl border border-dashed border-gold/40 bg-gold/10 px-4 py-3 text-xs font-bold text-[#7a5c10]">
                            کد تستی (فقط در محیط توسعه): {dev_code}
                        </div>
                    )}
                    {!isCodeStep && (
                        <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
                            <CheckCircle2 className="size-5 shrink-0 text-brand-600" />
                            <p className="text-xs font-bold leading-6 text-brand-900">رمز عبور لازم نیست. اگر قبلاً حساب دارید، همان شماره را بزنید تا با کد پیامکی وارد شوید.</p>
                        </div>
                    )}
                    <form onSubmit={submit} className="flex flex-col gap-5">
                        {isCodeStep ? (
                            <>
                                <input type="hidden" name="phone" value={form.data.phone} />
                                <Field label="کد تأیید پیامکی" error={form.errors.code}>
                                    <div className="relative">
                                        <Ticket className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" />
                                        <input autoFocus dir="ltr" inputMode="numeric" maxLength={6} value={form.data.code} onChange={(e) => form.setData('code', e.target.value.replace(/\D/g, ''))} className={`${input} text-center tracking-[0.45em]`} placeholder="••••••" />
                                    </div>
                                </Field>
                                {form.errors.phone && <p className="text-xs font-bold text-red-600">{form.errors.phone}</p>}
                            </>
                        ) : (
                            <>
                                <Field label="نام و نام خانوادگی" error={form.errors.name}>
                                    <div className="relative">
                                        <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" />
                                        <input autoFocus value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={input} placeholder="مثلاً: مریم احمدی" />
                                    </div>
                                    <p className="mt-1.5 text-[0.68rem] font-bold text-navy/40">اگر قبلاً ثبت‌نام کرده‌اید این فیلد اختیاری است.</p>
                                </Field>
                                <Field label="شماره موبایل" error={form.errors.phone}>
                                    <div className="relative">
                                        <Smartphone className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" />
                                        <input type="tel" dir="ltr" inputMode="numeric" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} className={`${input} text-left`} placeholder="09xxxxxxxxx" />
                                    </div>
                                </Field>
                            </>
                        )}
                        <button type="submit" disabled={form.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-4 text-base font-black text-white shadow-glow disabled:opacity-60">
                            <Rocket className="size-5" />
                            {form.processing ? 'لطفاً صبر کنید...' : isCodeStep ? 'تأیید و ادامه فرم' : 'دریافت کد تأیید'}
                        </button>
                    </form>
                    {isCodeStep && (
                        <div className="mt-5 flex flex-col items-center justify-center gap-2 text-xs font-bold text-navy/45">
                            <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-600" /> کد فقط ۵ دقیقه اعتبار دارد.</div>
                            <button type="button" onClick={resendCode} disabled={form.processing || resendSeconds > 0} className="font-black text-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:text-navy/35">
                                {resendSeconds > 0 ? `ارسال مجدد کد تا ${resendSeconds} ثانیه` : 'ارسال مجدد کد'}
                            </button>
                            <Link href={window.location.pathname.replace(/\?.*$/, '')} className="mt-1 text-navy/40 hover:text-brand-700">تغییر شماره موبایل</Link>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-black text-navy/70">{label}</label>
            {children}
            {error && <p className="mt-1.5 text-xs font-bold text-red-600">{error}</p>}
        </div>
    );
}
