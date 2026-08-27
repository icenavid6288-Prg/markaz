import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { FormEventHandler } from 'react';
import BrandLogo from '@/Components/BrandLogo';
import GuestLayout from '@/Layouts/GuestLayout';

export default function AdminLogin({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        phone: '',
        password: '',
        remember: false,
    });

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
                    <div className="text-xs font-black text-brand-700">ورود اختصاصی مدیران</div>
                    <div className="mt-0.5 text-[0.68rem] font-bold text-navy/45">پنل مدیریت مرکز رشد</div>
                </div>
            </div>

            <div className="hero-kicker mt-7"><span className="hero-kicker-line" /><span>دسترسی امن</span></div>
            <h1 className="mt-3 text-2xl font-black text-navy md:text-3xl">ورود به پنل مدیریت</h1>
            <p className="mt-2 text-sm leading-7 text-navy/55">شماره موبایل و رمز عبور مدیر خود را وارد کنید.</p>

            {status && <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800">{status}</div>}

            <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
                <div>
                    <label htmlFor="phone" className="mb-1.5 block text-xs font-black text-navy/70">شماره موبایل مدیر</label>
                    <input id="phone" type="tel" dir="ltr" inputMode="numeric" autoComplete="username" autoFocus value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="09xxxxxxxxx" className="w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-left text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40" />
                    {errors.phone && <p className="mt-1.5 text-xs font-bold text-red-600">{errors.phone}</p>}
                </div>
                <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs font-black text-navy/70">رمز عبور</label>
                    <div className="relative"><LockKeyhole className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-navy/30" aria-hidden /><input id="password" type="password" dir="ltr" autoComplete="current-password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="رمز عبور خود را وارد کنید" className="w-full rounded-2xl border border-navy/10 bg-white py-3 pl-4 pr-11 text-left text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40" /></div>
                    {errors.password && <p className="mt-1.5 text-xs font-bold text-red-600">{errors.password}</p>}
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-navy/60"><input type="checkbox" checked={data.remember} onChange={(e) => setData('remember', e.target.checked)} className="size-4 rounded-md border-navy/20 text-brand-600 focus:ring-brand-500" /> مرا به خاطر بسپار</label>
                <button type="submit" disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-3.5 text-base font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 disabled:opacity-60"><KeyRound className="size-5" aria-hidden />{processing ? 'در حال ورود...' : 'ورود به پنل مدیریت'}</button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-navy/45"><ShieldCheck className="size-4 text-brand-600" aria-hidden /> دسترسی این صفحه فقط برای مدیران فعال است.</div>
            <div className="mt-5 border-t border-navy/8 pt-5"><Link href={route('login')} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-7 py-3.5 text-sm font-black text-brand-700 hover:bg-brand-50">ورود کاربران عادی <ArrowLeft className="size-4" aria-hidden /></Link></div>
        </GuestLayout>
    );
}
