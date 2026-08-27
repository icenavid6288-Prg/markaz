import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Gift, Sparkles, TicketPercent } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import type { PageProps } from '@/types';

export default function Invite() {
    const { referrer_name, code } = usePage<PageProps & { referrer_name: string; code: string }>().props;

    return (
        <GuestLayout>
            <Head title={`دعوت ${referrer_name}`} />
            <div className="text-center">
                <span className="mx-auto flex size-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-brand-500 to-emerald-600 text-white shadow-glow">
                    <Gift className="size-8" />
                </span>
                <h1 className="mt-6 text-2xl font-black leading-10 text-navy md:text-3xl">
                    {referrer_name} شما را به <span className="text-brand-700">مسیر رشد</span> دعوت کرده است
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-navy/55">
                    با ثبت‌نام از طریق این لینک، هم شما و هم دعوت‌کننده یک کد تخفیف اختصاصی دریافت می‌کنید تا اولین قدم مسیر رشد با تخفیف برداشته شود.
                </p>

                <div className="mx-auto mt-7 flex w-fit items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 px-5 py-3">
                    <TicketPercent className="size-5 text-brand-600" />
                    <span className="text-xs font-black text-navy/60">کد معرف شما:</span>
                    <code dir="ltr" className="text-lg font-black tracking-[0.2em] text-brand-700">{code}</code>
                </div>

                <div className="mx-auto mt-9 flex max-w-sm flex-col gap-3">
                    <Link href={`/register?referral=${code}`} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-3.5 text-base font-black text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98]">
                        ساخت حساب و دریافت کد تخفیف <ArrowLeft className="size-5" />
                    </Link>
                    <Link href="/" className="text-xs font-black text-navy/45 hover:text-brand-700">بازگشت به سایت</Link>
                </div>

                <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-6 text-xs font-bold text-navy/40">
                    <span className="flex items-center gap-1.5"><Sparkles className="size-4 text-brand-600" /> تخفیف برای هر دو نفر</span>
                    <span className="flex items-center gap-1.5"><Gift className="size-4 text-brand-600" /> اعتبار ۳ ماهه</span>
                </div>
            </div>
        </GuestLayout>
    );
}
