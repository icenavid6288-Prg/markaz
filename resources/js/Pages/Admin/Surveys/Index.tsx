import { Link, router, usePage } from '@inertiajs/react';
import { BarChart3, Clipboard, ClipboardList, Clock, Edit3, Eye, FilePlus2, Link2, Plus, Send, Share2, Trash2, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface Survey {
    id: number;
    title: string;
    share_token: string;
    share_url: string;
    status: 'draft' | 'published' | 'closed';
    questions_count: number;
    responses_count: number;
    completed_responses_count: number;
    eitaa_scheduled_at: string | null;
    eitaa_published_at: string | null;
    eitaa_summary_sent_at: string | null;
}
interface Paginator { data: Survey[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number; }

const statusLabels: Record<string, string> = { draft: 'پیش‌نویس', published: 'فعال و خصوصی', closed: 'بسته‌شده' };

export default function SurveyIndex() {
    const { surveys } = usePage<PageProps & { surveys: Paginator }>().props;

    const copyLink = async (survey: Survey) => {
        await navigator.clipboard?.writeText(survey.share_url);
        alert('لینک نظرسنجی کپی شد. حالا می‌توانید آن را در کانال منتشر کنید.');
    };
    const remove = (survey: Survey) => {
        if (confirm(`نظرسنجی «${survey.title}» و پاسخ‌های آن حذف شود؟`)) router.delete(`/admin/surveys/${survey.share_token}`);
    };
    const publishToEitaa = (survey: Survey) => {
        if (confirm(`لینک نظرسنجی «${survey.title}» در کانال ایتا منتشر شود؟`)) router.post(`/admin/surveys/${survey.share_token}/publish-eitaa`, {}, { preserveScroll: true });
    };
    const shareOnEitaa = (survey: Survey) => {
        const url = `https://eitaa.com/share/url?url=${encodeURIComponent(survey.share_url)}&text=${encodeURIComponent(`نظرسنجی: ${survey.title}`)}`;
        window.open(url, '_blank', 'noopener');
    };
    const sendSummaryToEitaa = (survey: Survey) => {
        if (confirm(`جمع‌بندی نتایج «${survey.title}» در کانال ایتا منتشر شود؟`)) router.post(`/admin/surveys/${survey.share_token}/send-eitaa-summary`, {}, { preserveScroll: true });
    };

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-20 size-72 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div><div className="flex items-center gap-2 text-xs font-black text-brand-200"><ClipboardList className="size-4" /> ارتباط مستقیم با مخاطب</div><h1 className="mt-3 text-2xl font-black md:text-3xl">نظرسنجی‌های خصوصی</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">نظرسنجی در منو و صفحات سایت نمایش داده نمی‌شود؛ فقط کسانی که لینک کانال را دارند آن را می‌بینند.</p></div>
                <Link href="/admin/surveys/create" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-deep-green shadow-soft hover:bg-brand-100"><Plus className="size-4" /> نظرسنجی جدید</Link>
            </div>
        </section>
        <section className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5 text-sm leading-8 text-brand-950"><strong>جریان پیشنهادی شما:</strong> چند سؤال اول را مشخص کنید، سپس نظرسنجی فرد را به ثبت‌نام هدایت می‌کند و بعد از ورود، ادامه سؤال‌ها را نشان می‌دهد. پاسخ‌های نیمه‌کاره هم ذخیره می‌شوند.</section>
        <section className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-soft">
            <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4"><div className="text-sm font-black text-navy">فهرست نظرسنجی‌ها</div><div className="text-xs font-bold text-navy/40">{surveys.total} مورد</div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-right"><thead className="border-b border-navy/5 bg-soft-gray/60 text-xs font-black text-navy/45"><tr><th className="px-5 py-4">عنوان</th><th className="px-5 py-4">وضعیت</th><th className="px-5 py-4">سؤال‌ها</th><th className="px-5 py-4">پاسخ‌ها</th><th className="px-5 py-4">لینک خصوصی</th><th className="px-5 py-4">عملیات</th></tr></thead><tbody>
                {surveys.data.map((survey) => <tr key={survey.id} className="border-b border-navy/5 last:border-0 hover:bg-soft-gray/40"><td className="px-5 py-4"><strong className="block text-sm font-black text-navy">{survey.title}</strong><span className="text-xs text-navy/35">/{survey.share_token}</span></td><td className="px-5 py-4"><span className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-black ${survey.status === 'published' ? 'bg-emerald-50 text-emerald-700' : survey.status === 'closed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{statusLabels[survey.status]}</span>{survey.eitaa_scheduled_at && !survey.eitaa_published_at && <span className="mt-1 flex items-center gap-1 text-[0.62rem] font-bold text-amber-700"><Clock className="size-3" /> انتشار {survey.eitaa_scheduled_at}</span>}{survey.eitaa_published_at && <span className="mt-1 flex items-center gap-1 text-[0.62rem] font-bold text-emerald-600"><Clock className="size-3" /> در ایتا منتشر شد</span>}{survey.eitaa_summary_sent_at && <span className="mt-1 flex items-center gap-1 text-[0.62rem] font-bold text-indigo-600"><BarChart3 className="size-3" /> جمع‌بندی در ایتا منتشر شد</span>}</td><td className="px-5 py-4 text-sm font-bold text-navy/65">{survey.questions_count}</td><td className="px-5 py-4"><span className="text-sm font-black text-navy">{survey.responses_count}</span><span className="mr-1 text-xs text-navy/40">({survey.completed_responses_count} کامل)</span></td><td className="px-5 py-4"><button type="button" onClick={() => copyLink(survey)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-xs font-black text-brand-700 hover:bg-brand-100"><Link2 className="size-3.5" /> کپی لینک</button></td><td className="px-5 py-4"><div className="flex items-center gap-1.5"><a href={survey.share_url} target="_blank" rel="noreferrer" className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-100 hover:text-brand-700" aria-label="مشاهده"><Eye className="size-3.5" /></a><button type="button" onClick={() => publishToEitaa(survey)} disabled={survey.status !== 'published'} className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="انتشار در کانال ایتا" title="انتشار خودکار در کانال ایتا"><Send className="size-3.5" /></button><button type="button" onClick={() => shareOnEitaa(survey)} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-100 hover:text-brand-700" aria-label="اشتراک‌گذاری در ایتا" title="بازکردن ایتا با پیام آماده"><Share2 className="size-3.5" /></button>{survey.status === 'closed' && !survey.eitaa_summary_sent_at && <button type="button" onClick={() => sendSummaryToEitaa(survey)} disabled={survey.responses_count === 0} className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="ارسال جمع‌بندی به ایتا" title="ارسال جمع‌بندی نتایج به کانال ایتا"><BarChart3 className="size-3.5" /></button>}<Link href={`/admin/surveys/${survey.share_token}/edit`} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-brand-100 hover:text-brand-700" aria-label="ویرایش"><Edit3 className="size-3.5" /></Link><button type="button" onClick={() => remove(survey)} className="flex size-8 items-center justify-center rounded-lg bg-soft-gray text-navy/60 hover:bg-red-50 hover:text-red-600" aria-label="حذف"><Trash2 className="size-3.5" /></button></div></td></tr>)}
                {surveys.data.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center text-sm font-bold text-navy/40"><FilePlus2 className="mx-auto mb-3 size-8 text-navy/20" />هنوز نظرسنجی‌ای ساخته نشده است.</td></tr>}
            </tbody></table></div>
            {surveys.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">{surveys.links.map((link, index) => <button key={index} type="button" disabled={!link.url} onClick={() => link.url && router.get(link.url)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60 hover:bg-brand-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}</div>}
        </section>
    </div>;
}

SurveyIndex.layout = (page: ReactNode) => <AdminLayout title="نظرسنجی‌های خصوصی">{page}</AdminLayout>;
