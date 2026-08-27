import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Boxes, GraduationCap, HeartHandshake, House, LogIn, MessageCircle, Newspaper, Phone, Route, ShoppingBag, Sparkles, Users, UsersRound, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';

interface SitePage { key: string; label: string; path: string; icon: string; field_count: number; }

const icons: Record<string, LucideIcon> = { House, BookOpen, Boxes, GraduationCap, HeartHandshake, LogIn, MessageCircle, Newspaper, Phone, Route, ShoppingBag, Sparkles, Users, UsersRound };

export default function SitePagesIndex() {
    const { pages } = usePage<PageProps & { pages: SitePage[] }>().props;

    return <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
            <div className="pointer-events-none absolute -left-16 -top-20 size-72 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
            <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div><div className="flex items-center gap-2 text-xs font-black text-brand-200"><PanelIcon className="size-4" /> استودیو صفحات سایت</div><h1 className="mt-3 text-2xl font-black md:text-3xl">تمام صفحات سایت، یک‌جا برای ویرایش</h1><p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">عنوان، توضیحات، متن دکمه‌ها و آیکون سربرگ هر صفحه را بدون تغییر کد مدیریت کنید. محتوای خدمات، دوره‌ها، مقاله‌ها و محصولات نیز از کارت‌های محتوایی پنل قابل ویرایش است.</p></div>
                <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-deep-green hover:bg-brand-100">مشاهده سایت <ArrowLeft className="size-4" /></Link>
            </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pages.map((page) => { const Icon = icons[page.icon] ?? Sparkles; return <Link key={page.key} href={`/admin/site-pages/${page.key}/edit`} className="group rounded-2xl border border-white/80 bg-white/85 p-5 shadow-soft transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                <div className="flex items-start gap-4"><span className="glass-tile glass-tile-lg text-brand-700"><Icon className="size-6" /></span><div className="min-w-0 flex-1"><h2 className="text-base font-black text-navy group-hover:text-brand-700">{page.label}</h2><p className="mt-1 text-xs font-bold text-navy/40" dir="ltr">{page.path}</p></div><ArrowLeft className="mt-1 size-4 text-navy/25 transition-transform group-hover:-translate-x-1 group-hover:text-brand-600" /></div>
                <div className="mt-5 flex items-center justify-between border-t border-navy/5 pt-4 text-xs font-bold"><span className="text-navy/45">{page.field_count} فیلد قابل ویرایش</span><span className="text-brand-700">ویرایش صفحه</span></div>
            </Link>; })}
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm leading-7 text-amber-900/75"><strong className="text-amber-900">نکته:</strong> تغییرات این بخش در تنظیمات سایت ذخیره می‌شود و روی هاست مشترک هم بدون migration کار می‌کند. برای متن‌های دیتابیسی مثل خدمات، دوره‌ها و مقاله‌ها از «استودیو محتوا» استفاده کنید.</section>
    </div>;
}

function PanelIcon({ className }: { className?: string }) { return <Route className={className} />; }

SitePagesIndex.layout = (page: ReactNode) => <AdminLayout title="مدیریت صفحات سایت">{page}</AdminLayout>;
