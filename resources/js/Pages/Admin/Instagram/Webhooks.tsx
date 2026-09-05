import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Webhook } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import InstagramGuide from '@/Components/Admin/InstagramGuide';
import type { PageProps } from '@/types';
type Event = { id: number; external_id: string; object?: string | null; processed_at?: string | null; error?: string | null; created_at?: string | null };
type Paginator = { data: Event[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number };
export default function InstagramWebhooks() { const { events } = usePage<PageProps & { events: Paginator }>().props; return <div className="flex flex-col gap-6"><div><Link href="/admin/instagram" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به Inbox</Link><h1 className="mt-3 text-2xl font-black text-navy">لاگ Webhook اینستاگرام</h1><p className="mt-2 text-sm text-navy/50">برای عیب‌یابی دریافت رویدادها، وضعیت پردازش و خطاهای Meta را بررسی کنید.</p></div>
        <InstagramGuide
            title="این لاگ را چطور بخوانم؟"
            steps={[
                { title: 'هر ردیف یک رویداد متاست', text: 'وقتی کاربری دایرکت یا کامنت می‌گذارد، سرورهای اینستاگرام رویداد را به آدرس Webhook سایت شما می‌فرستند و همین‌جا ثبت می‌شود.' },
                { title: 'رنگ نشانگر وضعیت است', text: 'سبز = پردازش‌شده و به گفتگو اضافه‌شده؛ نارنجی = دریافت‌شده اما هنوز در انتظار پردازش؛ قرمز = خطا در پردازش.' },
                { title: 'خطاها را جدی بگیرید', text: 'متن خطای قرمز معمولاً دلیل مشکل را می‌گوید (مثل توکن منقضی‌شده). بعد از رفع مشکل، رویداد دوباره ارسال نمی‌شود؛ از صندوق گفتگوها وضعیت واقعی را چک کنید.' },
                { title: 'وقتی رویدادی نمی‌آید', text: 'اگر لیست خالی است، ثبت Webhook در پنل متا یا Verify Token را در «تنظیم اتصال» بررسی کنید.' },
            ]}
            hints={[
                'این صفحه فقط برای عیب‌یابی است؛ کار روزمره از صندوق گفتگوها انجام می‌شود.',
                'رویدادهای قدیمی نیازی به نگهداری ندارند و صرفاً برای ردیابی مشکل نگه داشته می‌شوند.',
            ]}
        /><section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5"><div className="border-b border-navy/5 px-5 py-4"><div className="flex items-center gap-2 text-sm font-black text-navy"><Webhook className="size-5 text-brand-600" /> رویدادهای اخیر</div></div><div className="divide-y divide-navy/5">{events.data.map((event) => <article key={event.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"><div className="flex items-start gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${event.error ? 'bg-red-50 text-red-600' : event.processed_at ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{event.error ? <AlertTriangle className="size-4" /> : event.processed_at ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}</span><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm font-black text-navy">{event.object ?? 'instagram'}</strong><code dir="ltr" className="text-[0.65rem] text-navy/40">{event.external_id}</code></div><p className="mt-1 text-xs text-navy/45">دریافت: {event.created_at ?? '—'} · پردازش: {event.processed_at ?? 'در انتظار'}</p>{event.error && <p className="mt-2 text-xs font-bold text-red-600">{event.error}</p>}</div></div><span className={`rounded-lg px-2.5 py-1.5 text-[0.65rem] font-black ${event.error ? 'bg-red-50 text-red-600' : event.processed_at ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{event.error ? 'خطا' : event.processed_at ? 'پردازش‌شده' : 'در انتظار'}</span></article>)}{events.data.length === 0 && <p className="p-16 text-center text-xs font-bold text-navy/45">هنوز رویداد Webhook دریافت نشده است.</p>}</div></section></div>; }
InstagramWebhooks.layout = (page: ReactNode) => <AdminLayout title="لاگ Webhook اینستاگرام">{page}</AdminLayout>;
