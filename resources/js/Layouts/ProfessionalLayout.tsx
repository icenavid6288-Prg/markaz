import { Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, FileText, Home, LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import MobileAppNav from '@/Components/MobileAppNav';
import PanelHelpGuide from '@/Components/PanelHelpGuide';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import type { PageProps } from '@/types';

export default function ProfessionalLayout({ role, children }: { role: 'instructor' | 'coach' | 'parent'; children: ReactNode }) {
    const { auth } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const isInstructor = role === 'instructor';
    const isParent = role === 'parent';
    const title = isInstructor ? 'استودیو مدرس' : isParent ? 'فضای والدین' : 'اتاق کوچینگ';
    const subtitle = isInstructor ? 'مدیریت آموزش و یادگیرندگان' : isParent ? 'همراهی مسیر رشد فرزند' : 'مدیریت جلسات و مسیرهای رشد';
    const nav = isInstructor ? [
        { label: 'داشبورد', href: '/panel/instructor', icon: LayoutDashboard },
        { label: 'دوره‌های من', href: '/admin/courses', icon: FileText },
        { label: 'یادگیرندگان', href: '/panel/instructor#learners', icon: Users },
        { label: 'گزارش عملکرد', href: '/panel/instructor#analytics', icon: CalendarDays },
    ] : isParent ? [
        { label: 'داشبورد', href: '/panel/parent', icon: LayoutDashboard },
        { label: 'فرزندان من', href: '/panel/parent#children', icon: Users },
        { label: 'گزارش‌ها', href: '/panel/parent#reports', icon: CalendarDays },
    ] : [
        { label: 'داشبورد', href: '/panel/coach', icon: LayoutDashboard },
        { label: 'جلسات', href: '/panel/coach#sessions', icon: CalendarDays },
        { label: 'دانش‌آموزان', href: '/panel/coach#students', icon: Users },
        { label: 'هدف‌ها', href: '/panel/coach#goals', icon: FileText },
    ];
    const logout = () => router.post('/logout');
    const links = <nav className="flex flex-col gap-1">{nav.map((item, index) => <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${index === 0 ? 'bg-deep-green text-white shadow-soft' : 'text-navy/55 hover:bg-brand-50 hover:text-brand-700'}`}><item.icon className="size-4.5" />{item.label}{index > 0 && <ChevronLeft className="mr-auto size-3.5 opacity-40" />}</Link>)}</nav>;

    return <div className="mobile-app-shell professional-shell professional-panel-shell min-h-screen bg-[#f4f8f5]" dir="rtl">
        <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 flex-col border-l border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-2xl lg:flex"><Link href="/" className="mb-8 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-deep-green text-lg font-black text-white">{isInstructor ? 'م' : isParent ? 'و' : 'ک'}</span><span><strong className="block text-sm font-black text-navy">{title}</strong><small className="text-xs font-bold text-brand-600">{subtitle}</small></span></Link><div className="mb-5 flex items-center gap-3 rounded-2xl bg-soft-gray p-3"><span className="flex size-10 items-center justify-center rounded-xl bg-brand-100 text-sm font-black text-brand-700">{auth.user?.name?.slice(0, 1) ?? '؟'}</span><div className="min-w-0"><strong className="block truncate text-sm font-black text-navy">{auth.user?.name}</strong><span className="text-[0.68rem] text-navy/40">{isInstructor ? 'مدرس' : isParent ? 'والد' : 'کوچ'}</span></div></div>{links}<div className="mt-auto border-t border-navy/5 pt-4"><Link href="/profile" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-navy/55 hover:bg-soft-gray"><Settings className="size-4.5" /> پروفایل و تنظیمات</Link><button type="button" onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50"><LogOut className="size-4.5" /> خروج</button></div></aside>
        {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-navy/35" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 right-0 w-80 max-w-[88vw] bg-white p-5 shadow-lift"><div className="mb-8 flex items-center justify-between"><strong className="text-navy">{title}</strong><button type="button" onClick={() => setOpen(false)}><X className="size-5" /></button></div>{links}</aside></div>}
        <div className="lg:mr-72"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/70 bg-[#f4f8f5]/85 px-4 backdrop-blur-xl md:px-8"><div className="flex items-center gap-3"><button type="button" onClick={() => setOpen(true)} className="rounded-xl bg-white p-2 lg:hidden" aria-label="باز کردن منو"><Menu className="size-5" /></button><div><span className="block text-xs font-bold text-brand-700">{subtitle}</span><h1 className="text-base font-black text-navy">{title}</h1></div></div><Link href="/" className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-navy/55 shadow-sm">مشاهده سایت</Link></header><main className="p-4 md:p-8"><PanelHelpGuide role={role} />{children}</main></div>

        <PwaInstallPrompt />
        <MobileAppNav
            ariaLabel={`ناوبری موبایل ${title}`}
            items={
                isParent
                    ? [
                        { label: 'داشبورد', href: '/panel/parent', icon: LayoutDashboard },
                        { label: 'فرزندان', href: '/panel/parent#children', icon: Users },
                        { label: 'گزارش‌ها', href: '/panel/parent#reports', icon: CalendarDays },
                        { label: 'پروفایل', href: '/profile', icon: Settings },
                        { label: 'سایت', href: '/', icon: Home },
                    ]
                    : [
                        { label: 'داشبورد', href: isInstructor ? '/panel/instructor' : '/panel/coach', icon: LayoutDashboard },
                        { label: isInstructor ? 'یادگیرندگان' : 'جلسات', href: isInstructor ? '#learners' : '#sessions', icon: isInstructor ? Users : CalendarDays },
                        { label: isInstructor ? 'گزارش' : 'هدف‌ها', href: isInstructor ? '#analytics' : '#goals', icon: isInstructor ? CalendarDays : FileText },
                        { label: 'پروفایل', href: '/profile', icon: Settings },
                        { label: 'سایت', href: '/', icon: Home },
                    ]
            }
        />
    </div>;
}
