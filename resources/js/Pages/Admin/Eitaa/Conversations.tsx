import { usePage } from '@inertiajs/react';
import { ArrowRight, MessagesSquare } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

type Conversation = {
    id: number; bot?: { id: number; name: string } | null; target?: { id: number; title: string } | null;
    external_chat_id: string; title: string; mode: string; unread_count: number;
    last_message_at?: string | null;
};
type Paginator = { data: Conversation[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number };

export default function EitaaConversations() {
    const { conversations, inboundSupported } = usePage<PageProps & {
        conversations: Paginator; inboundSupported: boolean;
    }>().props;

    return <div className="flex flex-col gap-6">
        <div>
            <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><MessagesSquare className="size-6 text-brand-600" /> گفتگوها</h1>
            <p className="mt-2 text-sm text-navy/50">مکالمات ثبت‌شده‌ی ربات با چنل‌ها و گروه‌ها.</p>
        </div>

        {!inboundSupported && <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-900">
            <strong className="text-sm font-black">دریافت پیام ورودی هنوز فعال نیست.</strong>
            <p className="mt-1 text-xs leading-6 text-sky-900/70">
                ایتا فعلاً API رسمی برای دریافت پیام ارائه نکرده است؛ این صفحه آماده است و به‌محض فعال شدن وب‌هوک ورودی، مکالمات اینجا نمایش داده می‌شوند.
            </p>
        </section>}

        <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
            <div className="border-b border-navy/5 px-5 py-4"><h2 className="text-sm font-black text-navy">گفتگوهای اخیر ({conversations.total})</h2></div>
            <div className="divide-y divide-navy/5">
                {conversations.data.map((conversation) => <div key={conversation.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm font-black text-navy">{conversation.title || conversation.external_chat_id}</strong>
                            {conversation.unread_count > 0 && <span className="rounded-md bg-brand-600 px-2 py-1 text-[0.62rem] font-black text-white">{conversation.unread_count} جدید</span>}
                        </div>
                        <p className="mt-1 text-xs text-navy/45" dir="ltr">{conversation.external_chat_id}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-navy/50">
                        <span>{conversation.bot?.name ?? '—'}</span>
                        <span className="rounded-md bg-soft-gray px-2 py-1 text-[0.62rem] font-black text-navy/60">
                            {conversation.mode === 'group' ? 'گروه' : conversation.mode === 'channel' ? 'کانال' : 'خصوصی'}
                        </span>
                        <span>{conversation.last_message_at || '—'}</span>
                    </div>
                </div>)}
                {conversations.data.length === 0 && <div className="p-10 text-center"><MessagesSquare className="mx-auto size-8 text-navy/25" /><p className="mt-3 text-sm font-bold text-navy/45">هنوز گفتگویی ثبت نشده است.</p></div>}
            </div>
            {conversations.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">
                {conversations.links.map((link, index) => <a key={index} href={link.url || '#'} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}
            </div>}
        </section>
    </div>;
}

EitaaConversations.layout = (page: ReactNode) => <AdminLayout title="گفتگوهای ایتا">{page}</AdminLayout>;
