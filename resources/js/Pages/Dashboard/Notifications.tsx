import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, MailOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDate } from '@/lib/format';
import type { PageProps } from '@/types';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    url?: string | null;
    read_at?: string | null;
    created_at?: string | null;
}

export default function Notifications() {
    const { notifications } = usePage<PageProps & { notifications: { data: NotificationItem[]; links: unknown[] } }>().props;
    const unread = notifications.data.filter((n) => !n.read_at);

    return (
        <UserDashboardLayout>
            <Head title="اعلان‌ها" />
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <span className="dashboard-eyebrow"><span /> اعلان‌ها</span>
                        <h2 className="mt-2 text-2xl font-black text-navy">مرکز اعلان‌ها</h2>
                        <p className="mt-2 text-sm leading-7 text-navy/50">وضعیت سفارش‌ها، پاسخ پشتیبانی، جلسات و پیشرفت‌ها اینجا به شما اطلاع داده می‌شود.</p>
                    </div>
                    {unread.length > 0 && (
                        <button type="button" onClick={() => router.post(route('dashboard.notifications.read-all'))} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white/80 px-4 py-2.5 text-xs font-black text-brand-700 transition-colors hover:bg-brand-50">
                            <CheckCheck className="size-4" /> خواندن همه ({unread.length})
                        </button>
                    )}
                </header>

                <section className="flex flex-col gap-3">
                    {notifications.data.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-16 text-center">
                            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Bell className="size-7" /></span>
                            <h3 className="mt-4 text-base font-black text-navy">اعلانی ندارید</h3>
                            <p className="mt-2 max-w-sm text-sm leading-7 text-navy/45">هر رویداد مهمی در حساب شما رخ دهد، اینجا نمایش داده می‌شود.</p>
                        </div>
                    ) : (
                        notifications.data.map((notification) => (
                            <div key={notification.id} className={`flex items-start gap-4 rounded-2xl border p-5 shadow-soft transition-colors ${notification.read_at ? 'border-white/60 bg-white/50' : 'border-brand-200 bg-white/85'}`}>
                                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${notification.read_at ? 'bg-navy/5 text-navy/35' : 'bg-brand-500 text-white shadow-glow'}`}>{notification.read_at ? <MailOpen className="size-4.5" /> : <Bell className="size-4.5" />}</span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2"><strong className={`text-sm font-black ${notification.read_at ? 'text-navy/50' : 'text-navy'}`}>{notification.title}</strong>{!notification.read_at && <span className="size-2 rounded-full bg-brand-500" aria-label="خوانده‌نشده" />}</div>
                                    <p className={`mt-1 text-sm font-bold leading-7 ${notification.read_at ? 'text-navy/35' : 'text-navy/60'}`}>{notification.message}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-navy/35">
                                        <span>{formatDate(notification.created_at)}</span>
                                        {notification.url && <Link href={notification.url} className="text-brand-700 hover:text-brand-800">مشاهده ←</Link>}
                                        {!notification.read_at && (
                                            <button type="button" onClick={() => router.post(route('dashboard.notifications.read', notification.id))} className="text-navy/45 underline-offset-2 hover:text-navy/70 hover:underline">علامت‌گذاری به عنوان خوانده‌شده</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </div>
        </UserDashboardLayout>
    );
}

Notifications.layout = (page: ReactNode) => page;
