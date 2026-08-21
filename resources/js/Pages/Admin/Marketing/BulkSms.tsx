import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, FileSpreadsheet, Info, Send, Smartphone, Upload, Zap } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

interface PreviewContact {
    name: string;
    phone: string;
}

interface Preview {
    contacts: PreviewContact[];
    total: number;
    skipped: number;
}

export default function BulkSms() {
    const { smsEnabled, preview, stats } = usePage<PageProps & {
        smsEnabled: boolean;
        preview?: Preview;
        stats: { totalSent: number };
    }>().props;

    const form = useForm<{ file: File | null; message: string; replace: boolean; start_campaign: boolean }>({
        file: null,
        message: 'سلام {name}،\n\n',
        replace: true,
        start_campaign: true,
    });

    const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-200';

    const previewFile = (event: FormEvent) => {
        event.preventDefault();
        if (!form.data.file) return;
        form.post('/admin/marketing/bulk-sms/preview', { forceFormData: true, preserveScroll: true });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!form.data.file || !preview || preview.total === 0) return;
        if (!window.confirm(`برای ${preview.total.toLocaleString('fa-IR')} مخاطب پیامک ارسال شود؟`)) return;
        form.post('/admin/marketing/bulk-sms', { forceFormData: true, preserveScroll: true });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4">
                    <Link href="/admin/marketing" className="inline-flex items-center gap-2 text-sm font-bold text-navy/50 hover:text-brand-700">
                        <ArrowRight className="size-4" /> بازگشت به اتومارکتینگ
                    </Link>
                    <Link href="/admin/marketing/bulk-sms/reports" className="text-sm font-black text-brand-700 hover:text-brand-900">مشاهده گزارش ارسال‌ها</Link>
                </div>
            </div>

            {/* Header */}
            <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
                <div className="pointer-events-none absolute -left-16 -top-20 size-64 rounded-full bg-brand-400/20 blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 text-xs font-black text-brand-200">
                        <Zap className="size-4" /> ارسال پیامک انبوه
                    </div>
                    <h1 className="mt-3 text-2xl font-black md:text-3xl">ارسال پیامک از فایل اکسل</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
                        فایل اکسل حاوی شماره موبایل را آپلود کنید و متن پیام را با متغیرهایی مثل {'{name}'} شخصی‌سازی کنید.
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-navy/5">
                    <span className="panel-inline-icon text-brand-600"><Smartphone className="size-5" /></span>
                    <div>
                        <strong className="block text-xl font-black text-navy">{stats.totalSent.toLocaleString('fa-IR')}</strong>
                        <span className="text-xs font-bold text-navy/45">پیامک ارسال‌شده کل</span>
                    </div>
                </div>
                {preview && (
                    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-navy/5">
                        <span className="panel-inline-icon text-brand-600"><FileSpreadsheet className="size-5" /></span>
                        <div>
                            <strong className="block text-xl font-black text-navy">{preview.total.toLocaleString('fa-IR')}</strong>
                            <span className="text-xs font-bold text-navy/45">مخاطب شناسایی‌شده</span>
                        </div>
                    </div>
                )}
            </section>

            {/* SMS Not Enabled Warning */}
            {!smsEnabled && (
                <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
                    <div className="flex items-start gap-3">
                        <Info className="mt-0.5 size-5 text-amber-600" />
                        <div>
                            <h3 className="text-sm font-black text-amber-900">سرویس پیامک فعال نیست</h3>
                            <p className="mt-1 text-xs leading-6 text-amber-700">
                                برای ارسال پیامک، ابتدا تنظیمات سرویس SMS را از{' '}
                                <Link href="/admin/settings/sms" className="font-bold underline">بخش تنظیمات</Link>
                                {' '}تکمیل کنید.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Form */}
            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="flex flex-col gap-6">
                    {/* File Upload */}
                    <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                        <h2 className="flex items-center gap-2 text-sm font-black text-navy">
                            <FileSpreadsheet className="size-4 text-brand-600" /> آپلود فایل
                        </h2>
                        <p className="mt-2 text-xs leading-6 text-navy/50">
                            فایل اکسل یا CSV حاوی ستون <strong>موبایل</strong> و اختیاری <strong>نام</strong> را انتخاب کنید.
                        </p>

                        <div className="mt-4">
                            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 p-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50">
                                <FileSpreadsheet className="size-10 text-brand-400" />
                                <div>
                                    <span className="text-sm font-black text-brand-700">
                                        {form.data.file ? form.data.file.name : 'انتخاب فایل اکسل یا CSV'}
                                    </span>
                                    <p className="mt-1 text-xs text-navy/45">فرمت‌های پشتیبانی: XLSX, CSV, TXT</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    className="sr-only"
                                    onChange={(e) => form.setData('file', e.target.files?.[0] ?? null)}
                                />
                            </label>
                            {form.errors.file && (
                                <p className="mt-2 text-xs font-bold text-red-600">{form.errors.file}</p>
                            )}
                        </div>

                        {/* Sample Format */}
                        <div className="mt-4 rounded-xl bg-soft-gray p-4">
                            <h3 className="text-xs font-black text-navy/70">فرمت نمونه فایل:</h3>
                            <div className="mt-2 overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-navy/10">
                                            <th className="px-3 py-2 text-right font-bold text-navy/60">موبایل</th>
                                            <th className="px-3 py-2 text-right font-bold text-navy/60">نام</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-navy/5">
                                            <td className="px-3 py-2 text-navy/70">09121234567</td>
                                            <td className="px-3 py-2 text-navy/70">علی رضایی</td>
                                        </tr>
                                        <tr>
                                            <td className="px-3 py-2 text-navy/70">09351112233</td>
                                            <td className="px-3 py-2 text-navy/70">سارا محمدی</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* Message Template */}
                    <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                        <h2 className="flex items-center gap-2 text-sm font-black text-navy">
                            <Send className="size-4 text-brand-600" /> متن پیامک
                        </h2>
                        <p className="mt-2 text-xs leading-6 text-navy/50">
                            متن پیام را بنویسید. از متغیرهای زیر می‌توانید استفاده کنید:
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-bold text-navy/45">
                            <span className="rounded-lg bg-soft-gray px-2 py-1">{'{name}'} نام مخاطب</span>
                            <span className="rounded-lg bg-soft-gray px-2 py-1">{'{phone}'} شماره موبایل</span>
                        </div>

                        <textarea
                            rows={6}
                            value={form.data.message}
                            onChange={(e) => form.setData('message', e.target.value)}
                            className={`${inputClass} mt-4 resize-y font-sans`}
                            placeholder="سلام {name}، خوش آمدید..."
                        />
                        {form.errors.message && (
                            <p className="mt-2 text-xs font-bold text-red-600">{form.errors.message}</p>
                        )}

                        <p className="mt-2 text-[0.65rem] text-navy/40">
                            تعداد کاراکتر: {form.data.message.length} / 500
                        </p>
                    </section>

                    {/* Preview and Submit */}
                    <div className="flex flex-wrap justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            loading={form.processing}
                            disabled={!form.data.file}
                            onClick={previewFile}
                        >
                            <Upload className="size-4" /> پیش‌نمایش مخاطبان
                        </Button>
                        <Button
                            type="submit"
                            loading={form.processing}
                            disabled={!form.data.file || !smsEnabled || !preview || preview.total === 0}
                        >
                            <Send className="size-4" /> تأیید و ارسال پیامک
                        </Button>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="flex flex-col gap-4">
                    <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
                        <div className="flex items-center gap-2 text-sm font-black text-brand-900">
                            <Info className="size-4" /> راهنما
                        </div>
                        <ul className="mt-3 space-y-2 text-xs leading-7 text-brand-900/70">
                            <li>• فایل اکسل باید حداقل یک ستون <strong>موبایل</strong> داشته باشد.</li>
                            <li>• شماره‌ها خودکار اعتبارسنجی می‌شوند (فرمت 09XXXXXXXXX).</li>
                            <li>• حداکثر ۱۰٬۰۰۰ ردیف در هر فایل پشتیبانی می‌شود.</li>
                            <li>• از متغیر <code className="rounded bg-white/70 px-1.5 py-0.5">{'{name}'}</code> برای شخصی‌سازی پیام استفاده کنید.</li>
                            <li>• قبل از ارسال عمومی، اتصال سرویس SMS را تست کنید.</li>
                        </ul>
                    </div>

                    {/* Preview */}
                    {preview && (
                        <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5">
                            <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                                <CheckCircle2 className="size-4" /> فایل بررسی شد؛ ارسال فقط بعد از تأیید شما انجام می‌شود.
                            </div>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-navy">پیش‌نمایش مخاطبان</h3>
                                <span className="text-xs font-bold text-brand-700">{preview.total} نفر</span>
                            </div>
                            {preview.contacts.length > 0 ? (
                                <div className="mt-3 divide-y divide-navy/5">
                                    {preview.contacts.map((contact, i) => (
                                        <div key={i} className="flex items-center justify-between py-2">
                                            <span className="text-xs text-navy/70">{contact.name}</span>
                                            <span className="text-xs font-mono text-navy/50">{contact.phone}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">هیچ شماره موبایل معتبری پیدا نشد.</p>
                            )}
                            {preview.total > 10 && (
                                <p className="mt-3 text-[0.65rem] text-center text-navy/40">
                                    و {preview.total - 10} مخاطب دیگر...
                                </p>
                            )}
                            {preview.skipped > 0 && (
                                <p className="mt-2 text-[0.65rem] text-center text-amber-600">
                                    {preview.skipped} ردیف نامعتبر نادیده گرفته شد.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="rounded-2xl bg-soft-gray p-5">
                        <div className="flex items-center gap-2 text-sm font-black text-navy">
                            <Zap className="size-4 text-brand-600" /> مراحل کار
                        </div>
                        <div className="mt-3 space-y-2 text-xs font-bold text-navy/60">
                            <div>۱. فایل اکسل حاوی شماره موبایل را انتخاب کنید</div>
                            <div>۲. متن پیام را با متغیرهای دلخواه بنویسید</div>
                            <div>۳. پیش‌نمایش مخاطبان را بررسی کنید</div>
                            <div>۴. تأیید و ارسال پیامک را بزنید</div>
                            <div>۵. نتیجه ارسال را مشاهده کنید</div>
                        </div>
                    </div>
                </aside>
            </form>
        </div>
    );
}

BulkSms.layout = (page: ReactNode) => <AdminLayout title="ارسال پیامک انبوه">{page}</AdminLayout>;
