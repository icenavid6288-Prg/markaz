import { Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, EyeOff, MessageCircle, Send, Trash2, UserRound } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import InstagramGuide from '@/Components/Admin/InstagramGuide';
import type { PageProps } from '@/types';

export default function InstagramShow() {
    const { conversation, admins } = usePage<PageProps & { conversation: any; admins: Array<{ id: number; name: string }> }>().props;
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState(conversation.status);
    const [assignee, setAssignee] = useState(String(conversation.assignee?.id ?? ''));
    const submit = (event: FormEvent) => { event.preventDefault(); if (!message.trim()) return; router.post(`/admin/instagram/${conversation.id}/reply`, { message }, { preserveScroll: true, onSuccess: () => setMessage('') }); };

    return <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-black text-brand-600"><MessageCircle className="size-4" /> {conversation.channel === 'comment' ? 'کامنت اینستاگرام' : 'دایرکت اینستاگرام'}</div><h1 className="mt-2 text-2xl font-black text-navy">{conversation.participant_username ? `@${conversation.participant_username}` : conversation.participant_id}</h1></div><a href="/admin/instagram" className="inline-flex items-center gap-2 rounded-xl bg-soft-gray px-3 py-2 text-xs font-black text-navy"><ArrowRight className="size-4" /> بازگشت</a></div>
        <InstagramGuide
            title="راهنمای پاسخ به این گفتگو"
            steps={[
                { title: 'مسئول و وضعیت را مشخص کنید', text: 'از منوهای بالای گفتگو، گفتگو را به یکی از اعضای تیم بسپارید و وقتی کار تمام شد آن را «بسته» کنید تا از لیست کارهای جاری خارج شود.' },
                { title: 'از قالب‌های آماده استفاده کنید', text: 'دکمه «قالب‌های پاسخ» متن‌های از پیش نوشته‌شده را باز می‌کند؛ متن قالب را کپی و در کادر پیام چسبانده و شخصی‌سازی کنید.' },
                { title: 'پاسخ را بنویسید و ارسال کنید', text: 'متن را در کادر پایین بنویسید و دکمه ارسال را بزنید؛ پیام مستقیم از طریق API متا به اینستاگرام می‌رود.' },
                ...(conversation.channel === 'comment' ? [{ title: 'مدیریت کامنت‌ها', text: 'روی کامنت‌های ورودی می‌توانید «مخفی‌کردن» یا «حذف» بزنید؛ حذف غیرقابل بازگشت است.' }] : []),
            ]}
            hints={[
                'لید متصل در بالای صفحه به CRM وصل است؛ از دکمه «مشاهده در CRM» سابقه کامل مخاطب را ببینید.',
                'اگر اتصال متا ناقص باشد، ارسال پاسخ با خطا مواجه می‌شود؛ پیام‌های دریافتی همیشه ثبت می‌شوند.',
            ]}
        />
        {conversation.lead && <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4"><UserRound className="size-5 text-brand-700" /><div><div className="text-xs font-black text-brand-900">لید متصل: {conversation.lead.name}</div><div className="mt-1 text-[0.68rem] text-brand-900/60" dir="ltr">{conversation.lead.phone}</div></div><a href={`/admin/leads?search=${encodeURIComponent(conversation.lead.phone)}`} className="mr-auto text-xs font-black text-brand-700">مشاهده در CRM</a></div>}
        <section className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft"><div className="mb-5 flex flex-wrap items-center gap-2 border-b border-navy/5 pb-4"><select value={status} onChange={(event) => { setStatus(event.target.value); router.post(`/admin/instagram/${conversation.id}/status`, { status: event.target.value }, { preserveScroll: true }); }} className="rounded-lg border border-navy/10 px-3 py-2 text-xs font-bold"><option value="open">گفتگو باز</option><option value="closed">گفتگو بسته</option></select><select value={assignee} onChange={(event) => { setAssignee(event.target.value); router.post(`/admin/instagram/${conversation.id}/assign`, { assigned_to: event.target.value || null }, { preserveScroll: true }); }} className="rounded-lg border border-navy/10 px-3 py-2 text-xs font-bold"><option value="">بدون مسئول</option>{admins?.map((admin) => <option key={admin.id} value={admin.id}>{admin.name}</option>)}</select><Link href="/admin/instagram/templates" className="mr-auto rounded-lg bg-soft-gray px-3 py-2 text-xs font-black text-navy/60">قالب‌های پاسخ</Link></div><div className="space-y-4">{conversation.messages.map((item: any) => <div key={item.id} className={`flex ${item.direction === 'outbound' ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${item.direction === 'outbound' ? 'bg-brand-100 text-brand-900' : 'bg-soft-gray text-navy'}`}><p>{item.body}</p><div className="mt-1 text-[0.6rem] font-bold opacity-50">{item.direction === 'outbound' ? 'ارسال‌شده' : 'دریافت‌شده'} · {item.created_at}</div>{conversation.channel === 'comment' && item.message_type === 'comment' && item.direction === 'inbound' && <div className="mt-2 flex gap-1.5"><button type="button" onClick={() => router.post(`/admin/instagram/messages/${item.id}/moderate`, { action: 'hide' }, { preserveScroll: true })} className="inline-flex items-center gap-1 rounded-md bg-white/60 px-2 py-1 text-[0.6rem] font-black text-navy/60"><EyeOff className="size-3" /> مخفی‌کردن</button><button type="button" onClick={() => confirm('این کامنت حذف شود؟') && router.post(`/admin/instagram/messages/${item.id}/moderate`, { action: 'delete' }, { preserveScroll: true })} className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[0.6rem] font-black text-red-600"><Trash2 className="size-3" /> حذف</button></div>}</div></div>)}</div><form onSubmit={submit} className="mt-6 flex items-end gap-2 border-t border-navy/5 pt-4"><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={2} placeholder="پاسخ شما به اینستاگرام..." className="min-w-0 flex-1 rounded-xl border border-navy/10 px-4 py-3 text-sm outline-none focus:border-brand-500" /><button type="submit" disabled={!message.trim()} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-deep-green text-white disabled:opacity-40" aria-label="ارسال پاسخ" title="ارسال پاسخ"><Send className="size-4" /></button></form></section>
    </div>;
}

InstagramShow.layout = (page: ReactNode) => <AdminLayout title="گفتگوی اینستاگرام">{page}</AdminLayout>;
