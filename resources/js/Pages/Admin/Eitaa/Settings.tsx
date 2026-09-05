import { usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Copy, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

export default function EitaaSettings() {
    const { webhookUrl, inboundSupported, queueConnection } = usePage<PageProps & {
        webhookUrl: string; inboundSupported: boolean; queueConnection: string;
    }>().props;

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 text-2xl font-black text-navy">تنظیمات ماژول ایتا</h1>
            <p className="mt-2 text-sm text-navy/50">وضعیت وب‌هوک، صف ارسال و نکات استقرار.</p>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
            <h2 className="flex items-center gap-2 text-sm font-black text-navy"><XCircle className="size-5 text-sky-600" /> دریافت پیام ورودی (Webhook)</h2>
            <div className="mt-3 flex items-center gap-2">
                {inboundSupported
                    ? <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700"><CheckCircle2 className="size-4" /> پشتیبانی می‌شود</span>
                    : <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700"><XCircle className="size-4" /> ایتا هنوز API رسمی دریافت پیام ندارد</span>}
            </div>
            <p className="mt-3 text-xs leading-6 text-navy/60">
                آدرس وب‌هوک رزرو‌شده برای آینده: <code className="rounded bg-soft-gray px-2 py-1 font-mono text-[0.68rem] text-navy" dir="ltr">{webhookUrl}</code>
                <button type="button" onClick={() => navigator.clipboard?.writeText(webhookUrl)} className="mr-2 inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[0.62rem] font-black text-brand-700 hover:bg-brand-100"><Copy className="size-3" /> کپی</button>
            </p>
            <p className="mt-2 text-[0.68rem] leading-5 text-navy/45">
                تا فعال شدن API ورودی، پاسخ‌های خودکار ذخیره می‌شوند و ارسال پیام فقط به‌صورت خروجی (کمپین و ارسال سریع) کار می‌کند. مسیر فعلی درخواست را با پاسخ ۵۰۱ و توضیح می‌پذیرد تا آینده سازگار بماند.
            </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
            <h2 className="text-sm font-black text-navy">صف ارسال و زمان‌بر</h2>
            <div className="mt-3 space-y-2 text-xs font-bold text-navy/60">
                <div className="flex items-center justify-between rounded-xl bg-soft-gray px-4 py-3">
                    <span>اتصال صف (queue connection)</span>
                    <code className="rounded bg-white px-2 py-1 font-mono text-[0.68rem] text-navy" dir="ltr">{queueConnection}</code>
                </div>
                <div className="rounded-xl bg-soft-gray px-4 py-3 leading-6">
                    کمپین‌های زمان‌بندی‌شده توسط دستور <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.68rem]" dir="ltr">eitaa:cron</code> ارسال می‌شوند. این دستور در <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.68rem]" dir="ltr">routes/console.php</code> به زمان‌بر متصل است؛ روی هاست، <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.68rem]" dir="ltr">php artisan schedule:run</code> را هر دقیقه روی cron قرار دهید.
                </div>
            </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
            <h2 className="text-sm font-black text-navy">نکات امنیتی</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-xs leading-6 text-navy/60">
                <li>توکن ربات‌ها به‌صورت رمزنگاری‌شده ذخیره می‌شوند و در هیچ پاسخی به مرورگر برنمی‌گردند.</li>
                <li>حالت آزمایشی هر ربات را تا تأیید اتصال روشن نگه دارید تا پیام واقعی به چنل‌ها ارسال نشود.</li>
                <li>قبل از کمپین انبوه، دسترسی ربات به مقاصد را با «بررسی دسترسی» تأیید کنید.</li>
                <li>برای احترام به محدودیت نرخ ایتا، سرعت ارسال کمپین را معقول (مثلاً ۲۰ پیام در دقیقه) نگه دارید.</li>
            </ul>
        </section>
    </div>;
}

EitaaSettings.layout = (page: ReactNode) => <AdminLayout title="تنظیمات ایتا">{page}</AdminLayout>;
