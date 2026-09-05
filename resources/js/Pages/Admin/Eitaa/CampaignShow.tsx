import { usePage } from '@inertiajs/react';
import { ArrowRight, Megaphone } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

type Recipient = { id: number; title?: string | null; chat_id?: string | null; status: string; attempts: number; error?: string | null; sent_at?: string | null };
type Paginator = { data: Recipient[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number };
type Campaign = {
    id: number; bot?: string | null; name: string; status: string; message_body: string;
    audience_type: string; scheduled_at?: string | null; total_targets: number;
    sent_count: number; failed_count: number; started_at?: string | null; completed_at?: string | null;
};

const statusLabels: Record<string, string> = {
    draft: 'پیش‌نویس', scheduled: 'زمان‌بندی‌شده', running: 'در حال ارسال', paused: 'متوقف',
    completed: 'تکمیل‌شده', cancelled: 'لغوشده', failed: 'ناموفق',
    pending: 'در انتظار', sent: 'ارسال‌شده', skipped: 'ردشده',
};

export default function EitaaCampaignShow() {
    const { campaign, recipients } = usePage<PageProps & { campaign: Campaign; recipients: Paginator }>().props;
    const progress = campaign.total_targets > 0 ? Math.round((campaign.sent_count / campaign.total_targets) * 100) : 0;

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa/campaigns" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به کمپین‌ها</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><Megaphone className="size-6 text-brand-600" /> {campaign.name}</h1>
            <p className="mt-2 text-sm text-navy/50">{campaign.bot || '—'} · {statusLabels[campaign.status] ?? campaign.status}{campaign.scheduled_at ? ` · ${campaign.scheduled_at}` : ''}</p>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><div className="text-2xl font-black text-navy">{campaign.sent_count}/{campaign.total_targets}</div><div className="mt-1 text-xs font-bold text-navy/45">ارسال‌شده</div></div>
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><div className="text-2xl font-black text-red-600">{campaign.failed_count}</div><div className="mt-1 text-xs font-bold text-navy/45">ناموفق</div></div>
            <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-navy/5"><div className="text-2xl font-black text-brand-700">{progress}٪</div><div className="mt-1 text-xs font-bold text-navy/45">پیشرفت</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft-gray"><div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} /></div></div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-soft ring-1 ring-navy/5">
            <h2 className="text-sm font-black text-navy">متن پیام</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-navy/70">{campaign.message_body}</p>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
            <div className="border-b border-navy/5 px-5 py-4"><h2 className="text-sm font-black text-navy">گیرندگان ({recipients.total})</h2></div>
            <div className="divide-y divide-navy/5">
                {recipients.data.map((recipient) => <div key={recipient.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div><strong className="text-sm font-black text-navy">{recipient.title || recipient.chat_id || '—'}</strong>
                        <p className="font-mono text-xs text-navy/40" dir="ltr">{recipient.chat_id}</p></div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-navy/50">
                        <span className="rounded-md bg-soft-gray px-2 py-1 text-[0.62rem] font-black text-navy/60">{statusLabels[recipient.status] ?? recipient.status}</span>
                        {recipient.attempts > 0 && <span>تلاش: {recipient.attempts}</span>}
                        {recipient.sent_at && <span className="text-emerald-600">{recipient.sent_at}</span>}
                        {recipient.error && <span className="text-red-600">{recipient.error}</span>}
                    </div>
                </div>)}
                {recipients.data.length === 0 && <div className="p-10 text-center text-sm font-bold text-navy/45">گیرنده‌ای ثبت نشده است؛ کمپین را اجرا کنید.</div>}
            </div>
            {recipients.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">
                {recipients.links.map((link, index) => <a key={index} href={link.url || '#'} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}
            </div>}
        </section>
    </div>;
}

EitaaCampaignShow.layout = (page: ReactNode) => <AdminLayout title="جزئیات کمپین">{page}</AdminLayout>;
