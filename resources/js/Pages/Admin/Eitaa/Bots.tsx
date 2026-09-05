import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Bot, Plug, Plus, Save, ShieldQuestionMark, Trash2, Wrench } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type Bot = {
    id: number; name: string; username?: string | null; bot_id?: string | null; status: string;
    is_active: boolean; test_mode: boolean; rate_limit_per_minute: number; has_token: boolean;
    last_connected_at?: string | null; last_error?: string | null; targets_count: number;
};

const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
const statusTone: Record<string, string> = {
    connected: 'bg-emerald-50 text-emerald-700',
    disconnected: 'bg-soft-gray text-navy/50',
    error: 'bg-red-50 text-red-600',
};

export default function EitaaBots() {
    const { bots, legacy } = usePage<PageProps & { bots: Bot[]; legacy: { token_configured: boolean; channel_id: string } }>().props;
    const form = useForm({ name: '', token: '', rate_limit_per_minute: 20 });
    const testModeForm = useForm({ test_mode: false });
    const tokenForm = useForm({ token: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/eitaa/bots', { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const saveTestMode = (bot: Bot, value: boolean) => {
        testModeForm.setData('test_mode', value);
        testModeForm.put(`/admin/eitaa/bots/${bot.id}`, { preserveScroll: true });
    };

    const saveToken = (bot: Bot) => {
        tokenForm.put(`/admin/eitaa/bots/${bot.id}`, { preserveScroll: true, onSuccess: () => tokenForm.reset() });
    };

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><Bot className="size-6 text-brand-600" /> ربات‌های ایتا</h1>
            <p className="mt-2 text-sm text-navy/50">اتصال به ایتا از طریق سامانه رسمی «ایتایار» انجام می‌شود؛ ایتا برخلاف تلگرام @BotFather ندارد.</p>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
            <h2 className="text-sm font-black text-navy">اتصال در سه قدم</h2>
            <ol className="mt-4 space-y-3 text-xs leading-6 text-navy/65">
                <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[0.7rem] font-black text-brand-700">۱</span>
                    <span>در <a href="https://eitaayar.ir" target="_blank" rel="noreferrer" className="font-black text-brand-700 hover:underline">eitaayar.ir</a> ثبت‌نام کنید (سرویس رسمیِ ساخته‌شده توسط تیم ایتا) و از پنل، <strong className="text-navy">توکن API</strong> را کپی کنید.</span></li>
                <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[0.7rem] font-black text-brand-700">۲</span>
                    <span>در ایتا، برنامه <strong className="text-navy" dir="ltr">@sender</strong> (برنامه ایتایار) را به‌عنوان <strong className="text-navy">مدیر</strong> چنل/گروه اضافه کنید و دسترسی «ارسال پیام» بدهید — بدون این مرحله هیچ پیامی ارسال نمی‌شود.</span></li>
                <li className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[0.7rem] font-black text-brand-700">۳</span>
                    <span><strong className="text-navy">شناسه چنل/گروه</strong> (chat_id) را از پنل ایتایار بردارید و در صفحه «مقاصد» ثبت کنید؛ برای گروه‌ها شناسه لینک دعوت است و برای چنل‌ها شناسه عددی یا یوزرنیم.</span></li>
            </ol>
        </section>

        {legacy.token_configured && <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-900">
            <strong className="text-sm font-black">توکن قدیمی ماژول نظرسنجی پیدا شد.</strong>
            <p className="mt-1 text-xs leading-6 text-sky-900/70">ماژول قبلی فقط ارسال به کانال داشت. برای قابلیت کامل (کمپین، پاسخ خودکار و آمار) ربات جدید اضافه کنید؛ توکن قدیمی همچنان برای نظرسنجی‌ها کار می‌کند.</p>
        </section>}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={submit} className="h-fit rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                <div className="flex items-center gap-2 text-sm font-black text-navy"><Plus className="size-5 text-brand-600" /> ربات جدید</div>
                <div className="mt-5 space-y-4">
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">نام ربات</span>
                        <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className={inputClass} placeholder="ربات اصلی مرکز" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">توکن ایتایار</span>
                        <input value={form.data.token} onChange={(e) => form.setData('token', e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="توکن پنل eitaayar.ir" dir="ltr" /></label>
                    <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">محدودیت ارسال در دقیقه</span>
                        <input type="number" min={1} max={600} value={form.data.rate_limit_per_minute} onChange={(e) => form.setData('rate_limit_per_minute', Number(e.target.value))} className={inputClass} /></label>
                    <Button type="submit" loading={form.processing}><Save className="size-4" /> ثبت ربات</Button>
                    <p className="text-[0.68rem] leading-5 text-navy/40">توکن به‌صورت رمزنگاری‌شده ذخیره می‌شود و بعد از ثبت فقط قابل تعویض است.</p>
                </div>
            </form>

            <div className="space-y-4">
                {bots.map((bot) => <article key={bot.id} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <strong className="text-sm font-black text-navy">{bot.name}</strong>
                                <span className={`rounded-md px-2 py-1 text-[0.62rem] font-black ${statusTone[bot.status] ?? 'bg-soft-gray text-navy/50'}`}>
                                    {bot.status === 'connected' ? 'متصل' : bot.status === 'error' ? 'خطا' : 'قطع'}
                                </span>
                                {bot.test_mode && <span className="rounded-md bg-amber-100 px-2 py-1 text-[0.62rem] font-black text-amber-700">حالت آزمایشی</span>}
                            </div>
                            <p className="mt-1 text-xs text-navy/45" dir="ltr">{bot.username ? `@${bot.username}` : 'بدون شناسه'} · {bot.targets_count} مقصد · آخرین اتصال: {bot.last_connected_at || '—'}</p>
                            {bot.last_error && <p className="mt-1 text-xs font-bold text-red-600">{bot.last_error}</p>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <button type="button" onClick={() => router.post(`/admin/eitaa/bots/${bot.id}/connect`, {}, { preserveScroll: true })} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-[0.65rem] font-black text-brand-700 hover:bg-brand-100"><Plug className="size-3.5" /> اتصال</button>
                            <button type="button" onClick={() => router.post(`/admin/eitaa/bots/${bot.id}/test`, {}, { preserveScroll: true })} className="inline-flex items-center gap-1.5 rounded-lg bg-soft-gray px-3 py-2 text-[0.65rem] font-black text-navy/60 hover:bg-navy/10"><Wrench className="size-3.5" /> تست</button>
                            <button type="button" onClick={() => confirm('این ربات حذف شود؟') && router.delete(`/admin/eitaa/bots/${bot.id}`, { preserveScroll: true })} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-red-500 hover:bg-red-50"><Trash2 className="size-3.5" /></button>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-3 border-t border-navy/5 pt-4 md:grid-cols-2">
                        <label className="flex items-center justify-between gap-3 rounded-xl bg-soft-gray px-4 py-3">
                            <span className="flex items-center gap-2 text-xs font-black text-navy/70"><ShieldQuestionMark className="size-4 text-amber-600" /> حالت آزمایشی (ارسال واقعی نمی‌شود)</span>
                            <input type="checkbox" checked={bot.test_mode} onChange={(e) => saveTestMode(bot, e.target.checked)} className="rounded border-navy/20 text-brand-600" />
                        </label>
                        <div className="flex items-center gap-2 rounded-xl bg-soft-gray px-4 py-3">
                            <input value={tokenForm.data.token} onChange={(e) => tokenForm.setData('token', e.target.value)} className="w-full bg-transparent text-xs text-navy outline-none" placeholder={bot.has_token ? 'توکن جدید برای تعویض' : 'توکن ثبت نشده — وارد کنید'} dir="ltr" />
                            <button type="button" onClick={() => saveToken(bot)} disabled={!tokenForm.data.token} className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-[0.62rem] font-black text-white disabled:opacity-40">ذخیره</button>
                        </div>
                    </div>
                </article>)}
                {bots.length === 0 && <div className="rounded-2xl bg-white p-10 text-center shadow-soft ring-1 ring-navy/5"><Bot className="mx-auto size-8 text-navy/25" /><p className="mt-3 text-sm font-bold text-navy/45">هنوز رباتی ثبت نشده است.</p></div>}
            </div>
        </section>
    </div>;
}

EitaaBots.layout = (page: ReactNode) => <AdminLayout title="ربات‌های ایتا">{page}</AdminLayout>;
