import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, LifeBuoy, Send, UserRound } from 'lucide-react';
import { type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDate } from '@/lib/format';
import type { PageProps } from '@/types';

interface TicketMessage {
    id: number;
    body: string;
    is_staff: boolean;
    author?: string | null;
    created_at?: string | null;
}

interface TicketInfo {
    id: number;
    subject: string;
    status: string;
    priority: string;
    user?: string | null;
    created_at?: string | null;
}

const statusLabels: Record<string, string> = { open: 'در انتظار پاسخ', answered: 'پاسخ داده شده', closed: 'بسته شده' };
const priorityLabels: Record<string, string> = { low: 'کم', medium: 'متوسط', high: 'زیاد' };

export default function TicketShow() {
    const { ticket, messages } = usePage<PageProps & { ticket: TicketInfo; messages: TicketMessage[] }>().props;
    const { data, setData, post, processing, errors } = useForm({ body: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.content.tickets.reply', ticket.id), {
            onSuccess: () => setData('body', ''),
        });
    };

    return (
        <AdminLayout title="پاسخ به تیکت">
            <Head title={ticket.subject} />
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
                <Link href="/admin/content/tickets" className="inline-flex w-fit items-center gap-2 text-xs font-black text-brand-700 hover:text-brand-800">
                    <ArrowRight className="size-4" /> بازگشت به تیکت‌ها
                </Link>

                <header className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-black text-navy">{ticket.subject}</h2>
                            <p className="mt-1.5 text-xs font-bold text-navy/45">
                                کاربر: {ticket.user ?? '—'} · اولویت: {priorityLabels[ticket.priority] ?? ticket.priority}
                            </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${ticket.status === 'answered' ? 'border-brand-200 bg-brand-50 text-brand-700' : ticket.status === 'closed' ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                            {statusLabels[ticket.status] ?? ticket.status}
                        </span>
                    </div>
                    <p className="mt-3 text-xs font-bold text-navy/40">شماره تیکت: #{ticket.id} · ثبت شده در {formatDate(ticket.created_at)}</p>
                </header>

                <section className="flex flex-col gap-4">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex gap-3 ${message.is_staff ? 'flex-row-reverse' : ''}`}>
                            <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${message.is_staff ? 'bg-deep-green text-white' : 'bg-brand-50 text-brand-600'}`}>
                                {message.is_staff ? <LifeBuoy className="size-4.5" /> : <UserRound className="size-4.5" />}
                            </span>
                            <div className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-soft ${message.is_staff ? 'border-brand-100 bg-brand-50/70' : 'border-white/80 bg-white/80'}`}>
                                <div className="flex items-center gap-2 text-[0.65rem] font-black text-navy/40">
                                    <span>{message.is_staff ? `تیم پشتیبانی${message.author ? ` — ${message.author}` : ''}` : (message.author ?? 'کاربر')}</span>
                                    <span>·</span>
                                    <span>{formatDate(message.created_at)}</span>
                                </div>
                                <p className="mt-2 whitespace-pre-line text-sm font-bold leading-7 text-navy/75">{message.body}</p>
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-navy/10 bg-white/50 p-10 text-center text-sm font-bold text-navy/40">پیامی در این تیکت ثبت نشده است.</div>
                    )}
                </section>

                <form onSubmit={submit} className="rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft">
                    <label htmlFor="reply" className="mb-2 block text-xs font-black text-navy/70">پاسخ پشتیبانی</label>
                    <textarea
                        id="reply"
                        rows={4}
                        value={data.body}
                        onChange={(e) => setData('body', e.target.value)}
                        placeholder="پاسخ خود را اینجا بنویسید؛ پس از ارسال، وضعیت تیکت به «پاسخ داده شده» تغییر می‌کند و کاربر مطلع می‌شود..."
                        className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm leading-7 text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40"
                    />
                    {errors.body && <p className="mt-1 text-xs font-bold text-red-600">{errors.body}</p>}
                    <button type="submit" disabled={processing} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-black text-white shadow-glow transition-colors hover:bg-brand-600 disabled:opacity-60">
                        <Send className="size-4" /> {processing ? 'در حال ارسال...' : 'ارسال پاسخ'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}

TicketShow.layout = (page: ReactNode) => page;
