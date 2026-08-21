import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock3, LifeBuoy, MessageSquareText, Plus, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDate, toFa } from '@/lib/format';
import type { PageProps } from '@/types';

interface TicketItem {
    id: number;
    subject: string;
    status: string;
    priority: string;
    messages_count: number;
    created_at?: string | null;
    updated_at?: string | null;
}

const statusMeta: Record<string, { label: string; cls: string }> = {
    open: { label: 'در انتظار پاسخ', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    answered: { label: 'پاسخ داده شده', cls: 'bg-brand-50 text-brand-700 border-brand-200' },
    closed: { label: 'بسته شده', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};

const priorityMeta: Record<string, { label: string; cls: string }> = {
    low: { label: 'کم', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
    medium: { label: 'متوسط', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    high: { label: 'زیاد', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function SupportIndex() {
    const { tickets, stats } = usePage<PageProps & { tickets: any; stats: { open: number; answered: number; closed: number } }>().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        body: '',
        priority: 'medium',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('dashboard.support.store'), {
            onSuccess: () => reset('subject', 'body'),
        });
    };

    return (
        <UserDashboardLayout>
            <Head title="پشتیبانی" />
            <div className="mx-auto flex max-w-7xl flex-col gap-7">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <span className="dashboard-eyebrow"><span /> پشتیبانی</span>
                        <h2 className="mt-2 text-2xl font-black text-navy">مرکز پشتیبانی</h2>
                        <p className="mt-2 text-sm leading-7 text-navy/50">سؤال درباره سفارش، دوره، پرداخت یا کوچینگ؟ تیکت ثبت کنید تا پیگیری کنیم.</p>
                    </div>
                    <div className="flex gap-2">
                        {[['باز', stats.open], ['پاسخ‌داده‌شده', stats.answered], ['بسته', stats.closed]].map(([label, count]) => (
                            <span key={label as string} className="rounded-xl border border-white/70 bg-white/75 px-3 py-2 text-xs font-black text-navy/60"><strong className="text-brand-700">{toFa(count as number)}</strong> {label}</span>
                        ))}
                    </div>
                </header>

                <section className="grid gap-6 lg:grid-cols-[1fr_24rem]">
                    <div className="flex flex-col gap-4">
                        {tickets.data.length === 0 ? (
                            <div className="flex flex-col items-center rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-16 text-center">
                                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><LifeBuoy className="size-7" /></span>
                                <h3 className="mt-4 text-base font-black text-navy">هنوز تیکتی ثبت نکرده‌اید</h3>
                                <p className="mt-2 max-w-sm text-sm leading-7 text-navy/45">هر سؤال یا مشکلی دارید، از همین‌جا ثبت کنید؛ پاسخ در همین صفحه و اعلان‌ها به شما می‌رسد.</p>
                            </div>
                        ) : (
                            tickets.data.map((ticket: TicketItem) => {
                                const s = statusMeta[ticket.status] ?? statusMeta.open;
                                const p = priorityMeta[ticket.priority] ?? priorityMeta.medium;
                                return (
                                    <Link key={ticket.id} href={route('dashboard.support.show', ticket.id)} className="group flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><MessageSquareText className="size-5" /></span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm font-black text-navy group-hover:text-brand-700">{ticket.subject}</h3>
                                                <span className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-black ${s.cls}`}>{s.label}</span>
                                                <span className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-black ${p.cls}`}>اولویت {p.label}</span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-bold text-navy/40">
                                                <span className="flex items-center gap-1"><Clock3 className="size-3.5" /> {formatDate(ticket.created_at)}</span>
                                                <span className="flex items-center gap-1">{toFa(ticket.messages_count)} پیام</span>
                                                {ticket.status === 'answered' && <span className="flex items-center gap-1 text-brand-700"><CheckCircle2 className="size-3.5" /> پاسخ جدید دارید</span>}
                                            </div>
                                        </div>
                                        <ArrowLeft className="size-4 shrink-0 text-navy/25 transition-transform group-hover:-translate-x-1 group-hover:text-brand-600" />
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    <form onSubmit={submit} className="h-fit rounded-2xl border border-white/80 bg-white/80 p-5 shadow-soft">
                        <div className="flex items-center gap-2 text-sm font-black text-navy"><Plus className="size-4 text-brand-600" /> تیکت جدید</div>
                        <div className="mt-4 flex flex-col gap-4">
                            <div>
                                <label htmlFor="subject" className="mb-1.5 block text-xs font-black text-navy/70">موضوع</label>
                                <input id="subject" type="text" value={data.subject} onChange={(e) => setData('subject', e.target.value)} placeholder="مثلاً: دسترسی به دوره خریداری‌شده" className="w-full rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40" />
                                {errors.subject && <p className="mt-1 text-xs font-bold text-red-600">{errors.subject}</p>}
                            </div>
                            <div>
                                <label htmlFor="priority" className="mb-1.5 block text-xs font-black text-navy/70">اولویت</label>
                                <select id="priority" value={data.priority} onChange={(e) => setData('priority', e.target.value)} className="w-full rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm text-navy outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40">
                                    <option value="low">کم — سؤال عمومی</option>
                                    <option value="medium">متوسط — نیاز به پیگیری</option>
                                    <option value="high">زیاد — مشکل پرداخت/دسترسی</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="body" className="mb-1.5 block text-xs font-black text-navy/70">شرح درخواست</label>
                                <textarea id="body" rows={5} value={data.body} onChange={(e) => setData('body', e.target.value)} placeholder="تا جایی که می‌توانید دقیق توضیح دهید؛ شماره سفارش یا نام دوره را حتماً بنویسید." className="w-full rounded-xl border border-navy/10 bg-white px-4 py-2.5 text-sm leading-7 text-navy outline-none transition-all placeholder:text-navy/30 focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40" />
                                {errors.body && <p className="mt-1 text-xs font-bold text-red-600">{errors.body}</p>}
                            </div>
                            <button type="submit" disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-black text-white shadow-glow transition-colors hover:bg-brand-600 disabled:opacity-60">
                                <Send className="size-4" /> {processing ? 'در حال ارسال...' : 'ثبت تیکت'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </UserDashboardLayout>
    );
}

SupportIndex.layout = (page: ReactNode) => page;
