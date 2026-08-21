import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, KeyRound, Rocket, Smartphone, Ticket, User } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

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
    survey: { title: string };
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
        password: '',
        password_confirmation: '',
        code: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const input = 'w-full rounded-xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (isCodeStep) {
            form.post(`${window.location.pathname.replace(/\/$/, '')}/verify`, { preserveScroll: true });
            return;
        }
        form.post(window.location.pathname, {
            preserveScroll: true,
            onFinish: () => form.reset('password', 'password_confirmation'),
        });
    };

    return (
        <div dir="rtl" className="min-h-screen bg-soft-gray px-4 py-8 md:px-6">
            <Head title={`ثبت‌نام برای ${survey.title}`} />
            <main className="mx-auto flex w-full max-w-2xl flex-col gap-5">
                <header className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-soft ring-1 ring-navy/5">
                    <div className="text-sm font-black text-navy">ادامه نظرسنجی</div>
                    <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-navy/45 hover:text-brand-700">سایت <ArrowRight className="size-3.5" /></Link>
                </header>
                <section className="rounded-[2rem] bg-deep-gradient p-7 text-white shadow-lift md:p-10">
                    <div className="flex items-center gap-2 text-xs font-black text-brand-200"><Rocket className="size-4" /> یک قدم تا تکمیل دیدگاه شما</div>
                    <h1 className="mt-4 text-2xl font-black leading-relaxed">
                        {isCodeStep ? 'کد تأیید را وارد کنید' : registerBeforeStart ? 'برای شروع نظرسنجی، حساب کاربری بسازید' : 'برای ادامه، حساب کاربری بسازید'}
                    </h1>
                    <p className="mt-3 text-sm leading-8 text-white/65">
                        {isCodeStep
                            ? `کد شش‌رقمی ارسال‌شده به شماره ${phone} را وارد کنید.`
                            : registerBeforeStart
                                ? `ثبت‌نام کنید تا ${remainingCount} سؤال نظرسنجی را پاسخ دهید.`
                                : `${answeredCount} پاسخ شما ذخیره شده است و بعد از ثبت‌نام، ${remainingCount} سؤال باقی‌مانده نمایش داده می‌شود.`}
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
                            <p className="text-xs font-bold leading-6 text-brand-900">پس از ارسال فرم، کد تأیید به موبایل شما پیامک می‌شود.</p>
                        </div>
                    )}
                    <form onSubmit={submit} className="flex flex-col gap-5">
                        {isCodeStep ? (
                            <Field label="کد تأیید پیامکی" error={form.errors.code}>
                                <div className="relative">
                                    <Ticket className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" />
                                    <input autoFocus dir="ltr" inputMode="numeric" maxLength={6} value={form.data.code} onChange={(e) => form.setData('code', e.target.value.replace(/\D/g, ''))} className={`${input} text-center tracking-[0.45em]`} placeholder="••••••" />
                                </div>
                            </Field>
                        ) : (
                            <>
                                <Field label="نام و نام خانوادگی" error={form.errors.name}>
                                    <div className="relative">
                                        <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" />
                                        <input autoFocus value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={input} placeholder="مثلاً: مریم احمدی" />
                                    </div>
                                </Field>
                                <Field label="شماره موبایل" error={form.errors.phone}>
                                    <div className="relative">
                                        <Smartphone className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" />
                                        <input type="tel" dir="ltr" inputMode="numeric" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} className={`${input} text-left`} placeholder="09xxxxxxxxx" />
                                    </div>
                                </Field>
                                <Field label="رمز عبور" error={form.errors.password}>
                                    <div className="relative">
                                        <KeyRound className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" />
                                        <input type={showPassword ? 'text' : 'password'} dir="ltr" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} className={`${input} text-left`} placeholder="حداقل ۸ کاراکتر" />
                                    </div>
                                </Field>
                                <Field label="تکرار رمز عبور" error={form.errors.password_confirmation}>
                                    <div className="relative">
                                        <KeyRound className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" />
                                        <input type={showPassword ? 'text' : 'password'} dir="ltr" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} className={`${input} text-left`} placeholder="رمز عبور را دوباره وارد کنید" />
                                    </div>
                                </Field>
                                <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-navy/55">
                                    <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="size-4 rounded border-navy/20 text-brand-600 focus:ring-brand-500" /> نمایش رمز عبور
                                </label>
                            </>
                        )}
                        <button type="submit" disabled={form.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-4 text-base font-black text-white shadow-glow disabled:opacity-60">
                            <Rocket className="size-5" />
                            {form.processing ? 'لطفاً صبر کنید...' : isCodeStep ? 'تأیید و ادامه نظرسنجی' : 'ارسال کد تأیید'}
                        </button>
                    </form>
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
