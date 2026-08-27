import { Link } from '@inertiajs/react';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
    return (
        <div dir="rtl" className="flex min-h-screen items-center justify-center bg-soft-gray p-4">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-brand-50">
                    <Compass className="size-10 text-brand-500" />
                </div>
                <div className="mb-2 text-7xl font-black text-navy">۴۰۴</div>
                <h1 className="mt-4 text-2xl font-black text-navy">صفحه یافت نشد</h1>
                <p className="mt-3 text-sm leading-7 text-navy/55">
                    صفحه‌ای که دنبال آن هستید وجود ندارد یا جابه‌جا شده است.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 px-7 py-3.5 text-sm font-black text-white transition-all hover:from-brand-700 hover:to-brand-600"
                    >
                        بازگشت به صفحه اصلی
                        <ArrowLeft className="size-4" />
                    </Link>
                    <Link
                        href="/courses"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-7 py-3.5 text-sm font-black text-brand-700 hover:bg-brand-50"
                    >
                        مشاهده دوره‌ها
                    </Link>
                </div>
            </div>
        </div>
    );
}
