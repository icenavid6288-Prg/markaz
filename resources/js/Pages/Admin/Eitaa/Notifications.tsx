import { router, usePage } from '@inertiajs/react';
import { ArrowRight, BellRing, CheckCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

type Notification = { id: number; bot?: { id: number; name: string } | null; type: string; title: string; body: string; level: string; read_at?: string | null; created_at: string };
type Paginator = { data: Notification[]; links: Array<{ url: string | null; label: string; active: boolean }>; total: number };

const levelTone: Record<string, string> = {
    info: 'bg-sky-50 text-sky-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-600',
    success: 'bg-emerald-50 text-emerald-700',
};

export default function EitaaNotifications() {
    const { notifications, unread } = usePage<PageProps & {
        notifications: Paginator; unread: number;
    }>().props;

    return <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
                <a href="/admin/eitaa" className="inline-flex items-center gap-2 text-xs font-bold text-navy/50 hover:text-brand-700"><ArrowRight className="size-4" /> بازگشت به داشبورد ایتا</a>
                <h1 className="mt-3 flex items-center gap-2 text-2xl font-black text-navy"><BellRing className="size-6 text-brand-600" /> اعلان‌ها</h1>
                <p className="mt-2 text-sm text-navy/50">هشدارهای ماژول ایتا: خطاهای ارسال، قطع اتصال و رویدادهای مهم.</p>
            </div>
            {unread > 0 && <button type="button" onClick={() => router.post('/admin/eitaa/notifications/read-all', {}, { preserveScroll: true })} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-black text-white hover:bg-brand-700">
                <CheckCheck className="size-4" /> علامت‌گذاری همه به‌عنوان خوانده‌شده ({unread})
            </button>}
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
            <div className="divide-y divide-navy/5">
                {notifications.data.map((notification) => <div key={notification.id} className={`flex flex-wrap items-start justify-between gap-3 px-5 py-4 ${!notification.read_at ? 'bg-brand-50/40' : ''}`}>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-md px-2 py-1 text-[0.62rem] font-black ${levelTone[notification.level] ?? 'bg-soft-gray text-navy/50'}`}>{notification.level}</span>
                            <strong className="text-sm font-black text-navy">{notification.title}</strong>
                            {!notification.read_at && <span className="size-2 rounded-full bg-brand-600" aria-label="خوانده‌نشده" />}
                        </div>
                        <p className="mt-1 text-xs leading-6 text-navy/60">{notification.body}</p>
                    </div>
                    <div className="shrink-0 text-left">
                        <p className="text-[0.65rem] font-bold text-navy/40">{notification.created_at}</p>
                        <p className="text-[0.65rem] text-navy/35">{notification.bot?.name ?? '—'}</p>
                    </div>
                </div>)}
                {notifications.data.length === 0 && <div className="p-10 text-center"><BellRing className="mx-auto size-8 text-navy/25" /><p className="mt-3 text-sm font-bold text-navy/45">اعلانی وجود ندارد.</p></div>}
            </div>
            {notifications.links.length > 3 && <div className="flex items-center justify-center gap-1.5 border-t border-navy/5 p-4">
                {notifications.links.map((link, index) => <a key={index} href={link.url || '#'} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-brand-600 text-white' : 'bg-soft-gray text-navy/60'}`} dangerouslySetInnerHTML={{ __html: link.label }} />)}
            </div>}
        </section>
    </div>;
}

EitaaNotifications.layout = (page: ReactNode) => <AdminLayout title="اعلان‌های ایتا">{page}</AdminLayout>;
