import { Link, router } from '@inertiajs/react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function Error({ status }: { status: number }) {
    const titles: Record<number, string> = {
        403: 'دسترسی غیرمجاز',
        404: 'صفحه یافت نشد',
        419: 'نشست منقضی شده',
        429: 'درخواست‌های زیادی ارسال شده',
        500: 'خطای سرور',
    };
    const descriptions: Record<number, string> = {
        403: 'شما اجازه دسترسی به این صفحه را ندارید.',
        404: 'صفحه‌ای که دنبال آن هستید وجود ندارد یا جابه‌جا شده است.',
        419: 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.',
        429: 'تعداد درخواست‌های شما بیش از حد مجاز است. کمی صبر کنید.',
        500: 'خطایی در سرور رخ داده است. لطفاً بعداً دوباره تلاش کنید.',
    };

    const title = titles[status] ?? 'خطای غیرمنتظره';
    const description = descriptions[status] ?? 'مشکلی پیش آمده است.';

    return (
        <div dir="rtl" className="flex min-h-screen items-center justify-center bg-soft-gray p-4">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-red-50">
                    <ShieldAlert className="size-10 text-red-500" />
                </div>
                <div className="mb-2 text-6xl font-black text-navy">{status}</div>
                <h1 className="mt-4 text-2xl font-black text-navy">{title}</h1>
                <p className="mt-3 text-sm leading-7 text-navy/55">{description}</p>
                <div className="mt-8 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => router.reload()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-3.5 text-sm font-black text-white transition-all hover:from-brand-700 hover:to-brand-600"
                    >
                        تلاش مجدد
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-7 py-3.5 text-sm font-black text-brand-700 hover:bg-brand-50"
                    >
                        بازگشت به صفحه اصلی
                        <ArrowLeft className="size-4" />
                    </Link>
                    {status === 403 && (
                        <Link
                            href="/admin/login"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-navy/10 bg-white px-7 py-3.5 text-sm font-bold text-navy/60 hover:bg-soft-gray"
                        >
                            ورود به پنل مدیریت
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
