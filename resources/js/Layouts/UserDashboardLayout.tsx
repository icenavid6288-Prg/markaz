import { Link, router, usePage } from '@inertiajs/react';
import {
    Award,
    Bell,
    BookOpen,
    CalendarDays,
    ChevronLeft,
    ClipboardList,
    Gift,
    Globe,
    Headphones,
    Heart,
    LayoutDashboard,
    LifeBuoy,
    LogOut,
    Menu,
    Route,
    Settings,
    ShoppingBag,
    Target,
    UserRound,
    X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import BrandLogo from '@/Components/BrandLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import MobileAppNav from '@/Components/MobileAppNav';
import PanelHelpGuide from '@/Components/PanelHelpGuide';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import type { PageProps } from '@/types';

const groups = [
    {
        label: 'یادگیری',
        items: [
            { label: 'نمای کلی', href: '/dashboard', icon: LayoutDashboard },
            { label: 'دوره‌های من', href: '/dashboard/courses', icon: BookOpen },
            { label: 'تکلیف‌ها', href: '/dashboard/assignments', icon: ClipboardList },
            { label: 'گواهینامه‌ها', href: '/dashboard/certificates', icon: Award },
            { label: 'کتابخانه من', href: '/dashboard/library', icon: Headphones },
            { label: 'علاقه‌مندی‌ها', href: '/dashboard/wishlist', icon: Heart },
            { label: 'مسیر رشد', href: '/dashboard/goals', icon: Route },
            { label: 'جلسات کوچینگ', href: '/dashboard/sessions', icon: CalendarDays },
        ],
    },
    {
        label: 'حساب من',
        items: [
            { label: 'سفارش‌ها', href: '/dashboard/orders', icon: ShoppingBag },
            { label: 'دعوت دوستان', href: '/dashboard/referrals', icon: Gift },
            { label: 'اعلان‌ها', href: '/dashboard/notifications', icon: Bell },
            { label: 'پشتیبانی', href: '/dashboard/support', icon: LifeBuoy },
        ],
    },
];

export default function UserDashboardLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<PageProps>().props;
    const currentUrl = usePage<PageProps>().url.split('?')[0];
    const [open, setOpen] = useState(false);
    const user = auth.user;
    const unread = user?.unread_notifications ?? 0;

    const logout = () => router.post('/logout');

    const isActive = (href: string) =>
        href === '/dashboard' ? currentUrl === '/dashboard' : currentUrl === href || currentUrl.startsWith(`${href}/`);

    const renderLinks = (group: (typeof groups)[number]) => (
        <div key={group.label} className="flex flex-col gap-1.5">
            <span className="px-3 pt-2 text-[0.65rem] font-black uppercase tracking-wider text-navy/35 dark:text-white/30">
                {group.label}
            </span>
            {group.items.map((item) => (
                <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
                        isActive(item.href)
                            ? 'bg-brand-500 text-white shadow-glow'
                            : 'text-navy/60 hover:bg-brand-50 hover:text-brand-700 dark:text-white/70 dark:hover:bg-white/10'
                    }`}
                >
                    <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isActive(item.href)
                                ? 'bg-white/20 text-white'
                                : 'bg-brand-50 text-brand-600 group-hover:bg-brand-100 dark:bg-white/10 dark:text-brand-300 dark:group-hover:bg-white/20'
                        }`}
                    >
                        <item.icon className="size-4" aria-hidden />
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.href === '/dashboard/notifications' && unread > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[0.6rem] font-black text-white">
                            {unread}
                        </span>
                    )}
                    {!isActive(item.href) && (
                        <ChevronLeft className="size-3.5 text-navy/25 transition-transform group-hover:-translate-x-0.5 group-hover:text-brand-500 dark:text-white/25" aria-hidden />
                    )}
                </Link>
            ))}
        </div>
    );

    const renderFooter = (mobile: boolean) => (
        <div className="flex flex-col gap-1 border-t border-navy/8 pt-3 dark:border-white/10">
            <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-navy/60 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-white/70 dark:hover:bg-white/10"
            >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-brand-300">
                    <Settings className="size-4" aria-hidden />
                </span>
                تنظیمات پروفایل
            </Link>
            <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-navy/60 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-white/70 dark:hover:bg-white/10"
            >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-brand-300">
                    <Globe className="size-4" aria-hidden />
                </span>
                مشاهده سایت
            </Link>
            <button
                type="button"
                onClick={logout}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
            >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-500/15">
                    <LogOut className="size-4" aria-hidden />
                </span>
                خروج از حساب
            </button>
        </div>
    );

    const renderProfileCard = () => (
        <div className="relative overflow-hidden rounded-2xl bg-deep-gradient p-4 text-white shadow-soft">
            <div className="pointer-events-none absolute -left-8 -top-10 size-28 rounded-full bg-brand-400/20 blur-2xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-12 -right-6 size-24 rounded-full bg-gold/15 blur-2xl" aria-hidden />
            <div className="relative flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-base font-black ring-1 ring-white/20">
                    {user?.name?.slice(0, 1) ?? '؟'}
                </span>
                <div className="min-w-0">
                    <strong className="block truncate text-sm font-black">{user?.name}</strong>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[0.68rem] font-bold text-brand-200">
                        <Target className="size-3" aria-hidden />
                        مسیر رشد شما
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="mobile-app-shell user-dashboard-shell dashboard-panel-shell min-h-screen bg-[#f4f8f5]" dir="rtl">
            <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 flex-col border-l border-white/70 bg-white/75 px-4 py-5 shadow-soft backdrop-blur-2xl lg:flex dark:border-white/10 dark:bg-[#0d1a14]/85">
                <Link href="/" className="flex items-center gap-3 px-3 pb-6" aria-label="بازگشت به سایت">
                    <BrandLogo className="user-brand-mark" />
                    <span className="leading-tight"><strong className="block text-sm font-black text-navy dark:text-white">مرکز رشد</strong><small className="block text-xs font-bold text-brand-600 dark:text-brand-300">Personal Growth Hub</small></span>
                </Link>
                {renderProfileCard()}
                <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-behavior-contain pb-2">
                    {groups.map(renderLinks)}
                </div>
                <div className="mt-auto pt-3">{renderFooter(false)}</div>
            </aside>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-navy/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-hidden />
                    <aside className="user-drawer absolute inset-y-0 right-0 flex w-[19.5rem] max-w-[90vw] flex-col bg-white p-4 pb-[calc(6.2rem+env(safe-area-inset-bottom))] shadow-lift dark:bg-[#0d1a14]">
                        <div className="mb-4 flex items-center justify-between px-1">
                            <div className="flex items-center gap-2.5">
                                <BrandLogo className="user-brand-mark" />
                                <span className="text-base font-black text-navy dark:text-white">مرکز رشد</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="بستن منو"
                                className="flex size-9 items-center justify-center rounded-xl border border-navy/10 text-navy/50 transition-colors hover:bg-navy/5 hover:text-navy dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10"
                            >
                                <X className="size-4.5" />
                            </button>
                        </div>
                        {renderProfileCard()}
                        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-behavior-contain pb-2">
                            {groups.map(renderLinks)}
                        </div>
                        <div className="mt-auto pt-2">{renderFooter(true)}</div>
                    </aside>
                </div>
            )}

            <div className="lg:mr-72">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/70 bg-[#f4f8f5]/80 px-4 backdrop-blur-xl md:px-8">
                    <div className="flex items-center gap-3"><button type="button" onClick={() => setOpen(true)} className="rounded-xl bg-white p-2 text-navy shadow-sm lg:hidden dark:bg-white/10 dark:text-white" aria-label="باز کردن منو"><Menu className="size-5" /></button><div><span className="block text-xs font-bold text-brand-700">داشبورد رشد شخصی</span><h1 className="text-base font-black text-navy dark:text-white">سلام، {user?.name?.split(' ')[0] ?? 'همراه مسیر'} 👋</h1></div></div>
                    <div className="flex items-center gap-2"><ThemeToggle compact /><Link href="/profile" className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-navy/55 shadow-sm transition-colors hover:text-brand-700 sm:flex dark:bg-white/10 dark:text-white/70"><UserRound className="size-3.5" /> پروفایل</Link><Link href="/courses" className="hidden rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-glow transition-colors hover:bg-brand-600 sm:block">کشف دوره جدید</Link></div>
                </header>
                <main className="p-4 md:p-8">
                    <PanelHelpGuide role="student" />
                    {children}
                </main>
            </div>

            <PwaInstallPrompt />
            <MobileAppNav
                ariaLabel="ناوبری پنل کاربر موبایل"
                items={[
                    { label: 'نمای کلی', href: '/dashboard', icon: LayoutDashboard },
                    { label: 'دوره‌ها', href: '/dashboard/courses', icon: BookOpen },
                    { label: 'مسیر رشد', href: '/dashboard/goals', icon: Route },
                    { label: 'جلسات', href: '/dashboard/sessions', icon: CalendarDays },
                    { label: 'پروفایل', href: '/profile', icon: UserRound },
                ]}
            />
        </div>
    );
}
