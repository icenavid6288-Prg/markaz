import { Link, router, usePage } from '@inertiajs/react';
import { BarChart3, ClipboardPen, Clock, Edit3, Eye, FilePlus2, Link2, Megaphone, MessagesSquare, Plus, Send, Share2, Sparkles, Target, Trash2, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface PerslineForm {
    id: number;
    title: string;
    persline_type: string;
    share_token: string;
    share_url: string;
    description: string | null;
    welcome_message: string | null;
    completion_message: string | null;
    status: 'draft' | 'published' | 'closed';
    settings: Record<string, unknown>;
    questions_count: number;
    responses_count: number;
    completed_responses_count: number;
    eitaa_scheduled_at: string | null;
    eitaa_published_at: string | null;
    eitaa_summary_sent_at: string | null;
}
interface FormType { label: string; short_label: string; description: string; }
interface Paginator { data: PerslineForm[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }

const statusLabels: Record<string, string> = { draft: 'پیش‌نویس', published: 'فعال', closed: 'بسته‌شده' };
const typeIcons: Record<string, typeof Megaphone> = { ads: Megaphone, eitaa: MessagesSquare, warm_lead: Target };

export default function PerslineIndex() {
    const { forms, types } = usePage<PageProps & { forms: Paginator; types: Record<string, FormType> }>().props;

    const copyLink = async (form: PerslineForm) => {
        await navigator.clipboard?.writeText(form.share_url);
        alert('لینک فرم کپی شد. حالا می‌توانید آن را در کانال یا تبلیغ منتشر کنید.');
    };
    const remove = (form: PerslineForm) => {
        if (confirm(`فرم «${form.title}» و پاسخ‌های آن حذف شود؟`)) router.delete(`/admin/persline/${form.share_token}`);
    };
    const publishToEitaa = (form: PerslineForm) => {
        if (confirm(`لینک فرم «${form.title}» در کانال ایتا منتشر شود؟`)) router.post(`/admin/persline/${form.share_token}/publish-eitaa`, {}, { preserveScroll: true });
    };
    const shareOnEitaa = (form: PerslineForm) => {
        const url = `https://eitaa.com/share/url?url=${encodeURIComponent(form.share_url)}&text=${encodeURIComponent(`فرم پرسلاین: ${form.title}`)}`;
        window.open(url, '_blank', 'noopener');
    };
    const sendSummaryToEitaa = (form: PerslineForm) => {
        if (confirm(`جمع‌بندی نتایج «${form.title}» در کانال ایتا منتشر شود؟`)) router.post(`/admin/persline/${form.share_token}/send-eitaa-summary`, {}, { preserveScroll: true });
    };

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-20 size-72 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-black text-brand-200"><ClipboardPen className="size-4" /> لیدگیری با فرم‌های آماده</div>
                    <h1 className="mt-3 text-2xl font-black md:text-3xl">فرم‌های پرسلاین</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">از یک قالب آماده شروع کنید، سؤال‌ها را ویرایش کنید و لینک را در تبلیغات یا کانال ایتا منتشر کنید. پاسخ‌ها به CRM می‌رسند.</p>
                </div>
                <Link href="/admin/persline/create" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-deep-green shadow-soft hover:bg-brand-100"><Plus className="size-4" /> فرم جدید</Link>
            </div>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
            {Object.entries(types).map(([key, type]) => {
                const Icon = typeIcons[key] ?? Sparkles;
                return <Link key={key} href={`/admin/persline/create?type=${key}`} className="group rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft backdrop-blur-xl transition-colors hover:border-brand-200 hover:bg-white">
                    <div className="flex items-center justify-between">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white"><Icon className="size-5" /></span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-soft-gray px-2.5 py-1 text-[0.68rem] font-black text-navy/45">قالب آماده</span>
                    </div>
                    <h2 className="mt-4 text-base font-black text-navy">{type.short_label}</h2>
                    <p className="mt-1.5 text-xs leading-6 text-navy/50">{type.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-brand-700">ساخت با این قالب <Plus className="size-3.5 transition-transform group-hover:rotate-90" /></span>
                </Link>;
            })}
        </section>
        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4"><div className="text-sm font-black text-navy">فهرست فرم‌ها</div><div className="text-xs font-bold text-navy/40">{forms.total} مورد</div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right"><thead className="border-b border-navy/5 bg-soft-gray/60 text-xs font-black text-navy/45"><tr><th className="px-5 py-4">عنوان</th><th className="px-5 py-4">قالب</th><th className="px-5 py-4">وضعیت</th><th className="px-5 py-4">سؤال‌ها</th><th className="px-5 py-4">پاسخ‌ها</th><th className="px-5 py-4">لینک خصوصی</th><th className="px-5 py-4">عملیات</th></tr></thead><tbody>
                {forms.data.map((form) => {
                    const Icon = typeIcons[form.persline_type] ?? Sparkles;
                    return <tr key={form.id} className="border-b border-navy/5 last:border-0 hover:bg-soft-gray/40">
                        <td className="px-5 py-4"><strong className="block max-w-[18rem] truncate text-sm font-black text-navy">{form.title}</strong><span className="text-xs text-navy/35">/{form.share_token}</span></td>
                        <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-[0.68rem] font-black text-brand-700"><Icon className="size-3" /> {types[form.persline_type]?.short_label ?? '—'}</span></td>
                        <td className="px-5 py-4"><span className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-black ${form.status === 'published' ? 'bg-emerald-50 text-emerald-700' : form.status === 'closed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{statusLabels[form.status]}</span>{form.eitaa_scheduled_at && !form.eitaa_published_at && <span className="mt-1 flex items-center gap-1 text-[0.62rem] font-bold text-amber-700"><Clock className="size-3" /> انتشار {form.eitaa_scheduled_at}</span>}{form.eitaa_published_at && <span className="mt-1 flex items-center gap-1 text-[0.62rem] font-bold text-emerald-600"><Send className="size-3" /> در ایتا منتشر شد</span>}{form.eitaa_summary_sent_at && <span className="mt-1 flex items-center gap-1 text-[0.62rem] font-bold text-indigo-600"><BarChart3 className="size-3" /> جمع‌بندی در ایتا</span>}</td>
                        <td className="px-5 py-4 text-sm font-bold text-navy/65">{form.questions_count}</td>
                        <td className="px-5 py-4"><span className="text-sm font-black text-navy">{form.responses_count}</span><span className="mr-1 text-xs text-navy/40">({form.completed_responses_count} کامل)</span></td>
                        <td className="px-5 py-4"><button type="button" onClick={() => copyLink(form)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs font-black text-brand-700 hover:bg-brand-100"><Link2 className="size-3.5" /> کپی لینک</button></td>
                        <td className="px-5 py-4"><div className="flex items-center gap-1.5">
                            <Link href={`/admin/persline/${form.share_token}/responses`} className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100" aria-label="نتایج پاسخ‌ها" title="مشاهده پاسخ هر کاربر"><Users className="size-3.5" /></Link>
                            <a href={form.share_url} target="_blank" rel="noreferrer" className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-100 hover:text-brand-700" aria-label="مشاهده"><Eye className="size-3.5" /></a>
                            <button type="button" onClick={() => publishToEitaa(form)} disabled={form.status !== 'published'} className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="انتشار در کانال ایتا" title="انتشار خودکار در کانال ایتا"><Send className="size-3.5" /></button>
                            <button type="button" onClick={() => shareOnEitaa(form)} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-100 hover:text-brand-700" aria-label="اشتراک‌گذاری در ایتا" title="بازکردن ایتا با پیام آماده"><Share2 className="size-3.5" /></button>
                            {form.status === 'closed' && !form.eitaa_summary_sent_at && <button type="button" onClick={() => sendSummaryToEitaa(form)} disabled={form.responses_count === 0} className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="ارسال جمع‌بندی به ایتا" title="ارسال جمع‌بندی نتایج به کانال ایتا"><BarChart3 className="size-3.5" /></button>}
                            <Link href={`/admin/persline/${form.share_token}/edit`} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-100 hover:text-brand-700" aria-label="ویرایش"><Edit3 className="size-3.5" /></Link>
                            <button type="button" onClick={() => remove(form)} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><Trash2 className="size-3.5" /></button>
                        </div></td>
                    </tr>;
                })}
                {forms.data.length === 0 && <tr><td colSpan={7} className="px-5 py-16 text-center text-sm font-bold text-navy/40"><FilePlus2 className="mx-auto mb-3 size-8 text-navy/20" />هنوز فرمی ساخته نشده است. از قالب‌های بالا شروع کنید.</td></tr>}
            </tbody></table></div>
            {forms.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">{forms.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
        <section className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-sm leading-7 text-brand-950">
            <Users className="mt-0.5 size-5 shrink-0 text-brand-600" />
            <p><strong>پاسخ‌ها کجا می‌روند؟</strong> روی آیکون کاربران بزنید تا ببینید هر نفر چه جوابی داده است. خروجی CSV هم همان‌جا در دسترس است. در قالب «لید گرم» نام و شماره تماس به سرنخ‌های CRM وصل می‌شوند. ثبت‌نام پاسخ‌دهنده مثل ورود سایت با کد پیامکی است.</p>
        </section>
    </div>;
}

PerslineIndex.layout = (page: ReactNode) => <AdminLayout title="فرم‌های پرسلاین">{page}</AdminLayout>;
