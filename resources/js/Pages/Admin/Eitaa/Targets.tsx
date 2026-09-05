import { router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowRight, Crosshair, Download, RefreshCw, SendHorizontal, ShieldCheck, Trash2 } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/Button';
import type { PageProps } from '@/types';

type Target = {
    id: number; bot?: string | null; chat_id: string; title: string; type: string;
    status: string; opt_in_status: string; tags: string[]; last_send_at?: string | null; last_error?: string | null;
};
type Paginator = { data: Target[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number };
type Bot = { id: number; name: string; test_mode?: boolean };

const inputClass = 'w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
const statusTone: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    paused: 'bg-amber-50 text-amber-700',
    blocked: 'bg-red-50 text-red-600',
};
const optInLabels: Record<string, string> = {
    opted_in: 'رضایت داده', unknown: 'نامشخص', opted_out: 'انصراف داده', blocked: 'بلاک',
};

export default function EitaaTargets() {
    const { targets, bots, filters } = usePage<PageProps & {
        targets: Paginator; bots: Bot[]; filters: { search: string };
    }>().props;
    const form = useForm({ bot_id: bots[0]?.id?.toString() ?? '', chat_id: '', title: '', type: 'channel', tags: '' });
    const manualForm = useForm({ bot_id: bots[0]?.id?.toString() ?? '', chat_id: '', body: '' });
    const importForm = useForm({ bot_id: bots[0]?.id?.toString() ?? '', file: null as File | null });

    const search = (value: string) => router.get('/admin/eitaa/targets', { search: value || undefined }, { preserveState: true, preserveScroll: true });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/admin/eitaa/targets', { preserveScroll: true, onSuccess: () => { form.setData('chat_id', ''); form.reset(); } });
    };

    const manualSubmit = (event: FormEvent) => {
        event.preventDefault();
        manualForm.post('/admin/eitaa/targets/manual-send', {
            preserveScroll: true,
            onSuccess: () => { manualForm.setData('chat_id', ''); manualForm.setData('body', ''); },
        });
    };

    const importSubmit = (event: FormEvent) => {
        event.preventDefault();
        importForm.post('/admin/eitaa/targets/import', { preserveScroll: true, forceFormData: true, onSuccess: () => importForm.reset() });
    };

    const updateStatus = (target: Target, status: string) =>
        router.put(`/admin/eitaa/targets/${target.id}`, { status }, { preserveScroll: true });

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><Crosshair className="size-6 text-brand-600" /> مقاصد ارسال</h1>
            <p className="mt-2 text-sm text-navy/50">چنل‌ها و گروه‌هایی که ربات در آن‌ها پیام ارسال می‌کند. قبل از کمپین، دسترسی ربات را با «بررسی دسترسی» تأیید کنید.</p>
        </div>

        <form onSubmit={manualSubmit} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-brand-200">
            <div className="flex items-center gap-2 text-sm font-black text-navy"><SendHorizontal className="size-5 text-brand-600" /> ارسال به شناسه دلخواه</div>
            <p className="mt-1 text-xs leading-6 text-navy/55">شناسه چنل/گروه (عددی، یوزرنیم یا لینک دعوت) را وارد کنید و پیام را همان لحظه بفرستید. شناسه به فهرست مقاصد اضافه می‌شود و می‌توانید بعداً برای کمپین‌ها هم از آن استفاده کنید.</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
                <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">ربات</span>
                    <select value={manualForm.data.bot_id} onChange={(e) => manualForm.setData('bot_id', e.target.value)} className={inputClass}>
                        {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}{bot.test_mode ? ' (آزمایشی)' : ''}</option>)}
                    </select></label>
                <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">شماره / شناسه چنل‌ یا گروه</span>
                    <input value={manualForm.data.chat_id} onChange={(e) => manualForm.setData('chat_id', e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="@mychannel یا -1001234567890" dir="ltr" /></label>
                <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">متن پیام</span>
                    <textarea rows={1} value={manualForm.data.body} onChange={(e) => manualForm.setData('body', e.target.value)} className={`${inputClass} resize-none`} placeholder="متن پیام..." /></label>
                <div className="flex items-end">
                    <Button type="submit" loading={manualForm.processing} disabled={!manualForm.data.chat_id.trim() || !manualForm.data.body.trim()}><SendHorizontal className="size-4" /> ارسال</Button>
                </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[0.68rem] leading-5 text-navy/45"><AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <span>API رسمی ایتا فقط به چنل/گروه‌هایی پیام می‌دهد که برنامه <strong dir="ltr">@sender</strong> مدیر آن‌ها باشد؛ شماره موبایل افراد به‌صورت پیام خصوصی پشتیبانی نمی‌شود و برای گروه‌ها باید شناسه لینک دعوت را وارد کنید.</span></p>
        </form>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
                <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                    <h2 className="text-sm font-black text-navy">مقصد جدید</h2>
                    <div className="mt-4 space-y-4">
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">ربات</span>
                            <select value={form.data.bot_id} onChange={(e) => form.setData('bot_id', e.target.value)} className={inputClass}>
                                {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
                            </select></label>
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">شناسه چنل/گروه</span>
                            <input value={form.data.chat_id} onChange={(e) => form.setData('chat_id', e.target.value)} className={`${inputClass} font-mono text-xs`} placeholder="@mychannel یا -1001234567890" dir="ltr" /></label>
                        <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">عنوان نمایشی</span>
                            <input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} className={inputClass} placeholder="کانال اصلی مرکز" /></label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">نوع</span>
                                <select value={form.data.type} onChange={(e) => form.setData('type', e.target.value)} className={inputClass}>
                                    <option value="channel">کانال</option><option value="group">گروه</option>
                                </select></label>
                            <label className="block"><span className="mb-1.5 block text-xs font-black text-navy/70">برچسب‌ها (با کاما)</span>
                                <input value={form.data.tags} onChange={(e) => form.setData('tags', e.target.value)} className={inputClass} placeholder="ویژه، والدین" /></label>
                        </div>
                        <Button type="submit" loading={form.processing}>ثبت مقصد</Button>
                    </div>
                </form>

                <form onSubmit={importSubmit} className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
                    <h2 className="flex items-center gap-2 text-sm font-black text-navy"><Download className="size-4 text-brand-600" /> ورود از فایل CSV</h2>
                    <p className="mt-1 text-[0.68rem] leading-5 text-navy/45">ستون‌ها: chat_id, title, type, tags — سطر اول عنوان ستون‌ها باشد.</p>
                    <div className="mt-4 space-y-3">
                        <select value={importForm.data.bot_id} onChange={(e) => importForm.setData('bot_id', e.target.value)} className={inputClass}>
                            {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
                        </select>
                        <input type="file" accept=".csv,.txt" onChange={(e) => importForm.setData('file', e.target.files?.[0] ?? null)} className="w-full text-xs text-navy/60" />
                        <Button type="submit" variant="outline" loading={importForm.processing} disabled={!importForm.data.file}>ورود مقاصد</Button>
                    </div>
                </form>
            </div>

            <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/5 px-5 py-4">
                    <h2 className="text-sm font-black text-navy">مقاصد ({targets.total})</h2>
                    <input defaultValue={filters.search} onKeyDown={(e) => { if (e.key === 'Enter') search(e.currentTarget.value); }} placeholder="جستجوی عنوان یا شناسه..." className="w-52 rounded-lg border border-navy/10 px-3 py-2 text-xs outline-none focus:border-brand-500" />
                </div>
                <div className="divide-y divide-navy/5">
                    {targets.data.map((target) => <div key={target.id} className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <strong className="text-sm font-black text-navy">{target.title}</strong>
                                    <span className="rounded-md bg-soft-gray px-2 py-1 text-[0.62rem] font-black text-navy/50">{target.type === 'group' ? 'گروه' : 'کانال'}</span>
                                    <span className={`rounded-md px-2 py-1 text-[0.62rem] font-black ${statusTone[target.status] ?? 'bg-soft-gray text-navy/50'}`}>
                                        {target.status === 'active' ? 'فعال' : target.status === 'blocked' ? 'بلاک' : 'مکث'}
                                    </span>
                                    <span className="rounded-md bg-brand-50 px-2 py-1 text-[0.62rem] font-black text-brand-700">{optInLabels[target.opt_in_status] ?? target.opt_in_status}</span>
                                </div>
                                <p className="mt-1 font-mono text-xs text-navy/45" dir="ltr">{target.chat_id}</p>
                                {target.tags.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{target.tags.map((tag) => <span key={tag} className="rounded bg-brand-50 px-1.5 py-0.5 text-[0.6rem] font-bold text-brand-700">{tag}</span>)}</div>}
                                {target.last_error && <p className="mt-1 text-xs font-bold text-red-600">{target.last_error}</p>}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                <button type="button" onClick={() => router.post(`/admin/eitaa/targets/${target.id}/verify`, {}, { preserveScroll: true })} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-[0.65rem] font-black text-brand-700 hover:bg-brand-100"><ShieldCheck className="size-3.5" /> بررسی دسترسی</button>
                                <button type="button" onClick={() => updateStatus(target, target.status === 'active' ? 'paused' : 'active')} className="inline-flex items-center gap-1.5 rounded-lg bg-soft-gray px-3 py-2 text-[0.65rem] font-black text-navy/60"><RefreshCw className="size-3.5" /> {target.status === 'active' ? 'مکث' : 'فعال‌سازی'}</button>
                                <button type="button" onClick={() => confirm('این مقصد حذف شود؟') && router.delete(`/admin/eitaa/targets/${target.id}`, { preserveScroll: true })} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-red-500 hover:bg-red-50"><Trash2 className="size-3.5" /></button>
                            </div>
                        </div>
                    </div>)}
                    {targets.data.length === 0 && <div className="p-10 text-center"><Crosshair className="mx-auto size-8 text-navy/25" /><p className="mt-3 text-sm font-bold text-navy/45">مقصدی ثبت نشده است.</p></div>}
                </div>
                {targets.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">
                    {targets.links.map((link, index) => <a key={index} href={link.url || '#'} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}
                </div>}
            </section>
        </section>
    </div>;
}

EitaaTargets.layout = (page: ReactNode) => <AdminLayout title="مقاصد ایتا">{page}</AdminLayout>;