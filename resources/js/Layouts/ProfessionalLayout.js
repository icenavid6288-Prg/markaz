import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, FileText, Home, LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { useState } from 'react';
import MobileAppNav from '@/Components/MobileAppNav';
import PanelHelpGuide from '@/Components/PanelHelpGuide';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
export default function ProfessionalLayout({ role, children }) {
    const { auth } = usePage().props;
    const [open, setOpen] = useState(false);
    const isInstructor = role === 'instructor';
    const isParent = role === 'parent';
    const title = isInstructor ? 'استودیو مدرس' : isParent ? 'فضای والدین' : 'اتاق کوچینگ';
    const subtitle = isInstructor ? 'مدیریت آموزش و یادگیرندگان' : isParent ? 'همراهی مسیر رشد فرزند' : 'مدیریت جلسات و مسیرهای رشد';
    const nav = isInstructor ? [
        { label: 'داشبورد', href: '/panel/instructor', icon: LayoutDashboard },
        { label: 'دوره‌های من', href: '/admin/courses', icon: FileText },
        { label: 'یادگیرندگان', href: '/panel/instructor#learners', icon: Users },
        { label: 'تصحیح تکلیف', href: '/panel/instructor#submissions', icon: CalendarDays },
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
    const links = _jsx("nav", { className: "flex flex-col gap-1", children: nav.map((item, index) => _jsxs(Link, { href: item.href, onClick: () => setOpen(false), className: `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${index === 0 ? 'bg-deep-green text-white shadow-soft' : 'text-navy/55 hover:bg-brand-50 hover:text-brand-700'}`, children: [_jsx(item.icon, { className: "size-4.5" }), item.label, index > 0 && _jsx(ChevronLeft, { className: "mr-auto size-3.5 opacity-40" })] }, item.label)) });
    return _jsxs("div", { className: "mobile-app-shell professional-shell professional-panel-shell min-h-screen bg-[#f4f8f5]", dir: "rtl", children: [_jsxs("aside", { className: "fixed inset-y-0 right-0 z-40 hidden w-72 flex-col border-l border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-2xl lg:flex", children: [_jsxs(Link, { href: "/", className: "mb-8 flex items-center gap-3", children: [_jsx("span", { className: "flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-deep-green text-lg font-black text-white", children: isInstructor ? 'م' : isParent ? 'و' : 'ک' }), _jsxs("span", { children: [_jsx("strong", { className: "block text-sm font-black text-navy", children: title }), _jsx("small", { className: "text-xs font-bold text-brand-600", children: subtitle })] })] }), _jsxs("div", { className: "mb-5 flex items-center gap-3 rounded-2xl bg-soft-gray p-3", children: [_jsx("span", { className: "flex size-10 items-center justify-center rounded-xl bg-brand-100 text-sm font-black text-brand-700", children: auth.user?.name?.slice(0, 1) ?? '؟' }), _jsxs("div", { className: "min-w-0", children: [_jsx("strong", { className: "block truncate text-sm font-black text-navy", children: auth.user?.name }), _jsx("span", { className: "text-[0.68rem] text-navy/40", children: isInstructor ? 'مدرس' : isParent ? 'والد' : 'کوچ' })] })] }), links, _jsxs("div", { className: "mt-auto border-t border-navy/5 pt-4", children: [_jsxs(Link, { href: "/profile", className: "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-navy/55 hover:bg-soft-gray", children: [_jsx(Settings, { className: "size-4.5" }), " \u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0648 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A"] }), _jsxs("button", { type: "button", onClick: logout, className: "mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50", children: [_jsx(LogOut, { className: "size-4.5" }), " \u062E\u0631\u0648\u062C"] })] })] }), open && _jsxs("div", { className: "fixed inset-0 z-50 lg:hidden", children: [_jsx("div", { className: "absolute inset-0 bg-navy/35", onClick: () => setOpen(false) }), _jsxs("aside", { className: "absolute inset-y-0 right-0 w-80 max-w-[88vw] bg-white p-5 shadow-lift", children: [_jsxs("div", { className: "mb-8 flex items-center justify-between", children: [_jsx("strong", { className: "text-navy", children: title }), _jsx("button", { type: "button", onClick: () => setOpen(false), children: _jsx(X, { className: "size-5" }) })] }), links] })] }), _jsxs("div", { className: "lg:mr-72", children: [_jsxs("header", { className: "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/70 bg-[#f4f8f5]/85 px-4 backdrop-blur-xl md:px-8", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => setOpen(true), className: "rounded-xl bg-white p-2 lg:hidden", "aria-label": "\u0628\u0627\u0632 \u06A9\u0631\u062F\u0646 \u0645\u0646\u0648", children: _jsx(Menu, { className: "size-5" }) }), _jsxs("div", { children: [_jsx("span", { className: "block text-xs font-bold text-brand-700", children: subtitle }), _jsx("h1", { className: "text-base font-black text-navy", children: title })] })] }), _jsx(Link, { href: "/", className: "rounded-xl bg-white px-4 py-2 text-xs font-bold text-navy/55 shadow-sm", children: "\u0645\u0634\u0627\u0647\u062F\u0647 \u0633\u0627\u06CC\u062A" })] }), _jsxs("main", { className: "p-4 md:p-8", children: [_jsx(PanelHelpGuide, { role: role }), children] })] }), _jsx(PwaInstallPrompt, {}), _jsx(MobileAppNav, { ariaLabel: `ناوبری موبایل ${title}`, items: isParent
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
                    ] })] });
}
