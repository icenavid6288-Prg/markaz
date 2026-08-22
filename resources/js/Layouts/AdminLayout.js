import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, router, usePage } from '@inertiajs/react';
import BrandLogo from '@/Components/BrandLogo';
import FlashToast from '@/Components/FlashToast';
import ThemeToggle from '@/Components/ThemeToggle';
import PanelHelpGuide from '@/Components/PanelHelpGuide';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import { Award, BarChart3, BellRing, BookOpen, Boxes, ClipboardList, ClipboardPen, CreditCard, FileText, FolderTree, GraduationCap, Headset, Image, LayoutDashboard, ListChecks, LogOut, Mail, Menu as MenuIcon, MessageSquare, MessageSquareQuote, NotebookPen, Package, PanelTop, Receipt, Settings, ShieldCheck, ShoppingBag, Target, Ticket, UserRound, Users, UsersRound, X, } from 'lucide-react';
import { useMemo, useState } from 'react';
const nav = [
    { section: 'مرکز فرماندهی', items: [
            { title: 'داشبورد تحلیلی', href: '/admin', icon: LayoutDashboard },
            { title: 'گزارش‌ها و خروجی', href: '/admin/reports', icon: BarChart3, permission: 'view reports' },
            { title: 'خروجی سفارش‌ها (CSV)', href: '/admin/reports/orders.csv', icon: Receipt, permission: 'view reports' },
            { title: 'گزارش فعالیت مدیران', href: '/admin/audit-logs', icon: ShieldCheck, permission: 'view reports' },
        ] },
    { section: 'محتوا و ویترین سایت', items: [
            { title: 'خدمات', href: '/admin/content/services', icon: Boxes, permission: 'view services' },
            { title: 'دوره‌ها', href: '/admin/courses', icon: GraduationCap, permission: 'view courses' },
            { title: 'درس‌ها و محتوای دوره', href: '/admin/content/lessons', icon: BookOpen, permission: 'view lessons' },
            { title: 'محصولات و فروشگاه', href: '/admin/content/products', icon: ShoppingBag, permission: 'view products' },
            { title: 'اپیزودهای پادکست', href: '/admin/content/podcasts', icon: BookOpen, permission: 'view podcasts' },
            { title: 'کدهای تخفیف', href: '/admin/content/coupons', icon: Package, permission: 'view coupons' },
            { title: 'کتابخانه رسانه', href: '/admin/content/media', icon: Image, permission: 'view media' },
            { title: 'مقالات بلاگ', href: '/admin/content/blog', icon: FileText, permission: 'view blog' },
            { title: 'دسته‌بندی‌ها', href: '/admin/content/categories', icon: FolderTree, permission: 'view categories' },
            { title: 'نظرات و تجربه‌ها', href: '/admin/content/testimonials', icon: MessageSquareQuote, permission: 'view testimonials' },
            { title: 'مدرس‌ها و تیم', href: '/admin/content/team', icon: UsersRound, permission: 'view team' },
            { title: 'بنرها و کمپین‌ها', href: '/admin/content/banners', icon: Image, permission: 'view banners' },
            { title: 'مدیریت صفحات سایت', href: '/admin/site-pages', icon: PanelTop, permission: 'view pages' },
            { title: 'نظرسنجی‌های خصوصی', href: '/admin/surveys', icon: ClipboardList, permission: 'view surveys' },
            { title: 'فرم‌های پرسلاین', href: '/admin/persline', icon: ClipboardPen, permission: 'view surveys' },
            { title: 'آزمون‌های دوره‌ها', href: '/admin/quizzes', icon: ListChecks, permission: 'view lessons' },
            { title: 'تکلیف‌ها', href: '/admin/assignments', icon: NotebookPen, permission: 'view lessons' },
            { title: 'صفحات و Page Builder پیشرفته', href: '/admin/content/pages', icon: PanelTop, permission: 'view pages' },
        ] },
    { section: 'رشد و اتومارکتینگ', items: [
            { title: 'اتومارکتینگ', href: '/admin/marketing', icon: Mail, permission: 'view marketing' },
            { title: 'ارسال پیامک انبوه', href: '/admin/marketing/bulk-sms', icon: Mail, permission: 'create marketing' },
            { title: 'گزارش ارسال پیامک', href: '/admin/marketing/bulk-sms/reports', icon: FileText, permission: 'view marketing' },
        ] },
    { section: 'عملیات و ارتباط با مشتری', items: [
            { title: 'کاربران و نقش‌ها', href: '/admin/users', icon: Users, permission: 'view users' },
            { title: 'داشبورد CRM', href: '/admin/crm', icon: BarChart3, permission: 'view leads' },
            { title: 'سرنخ‌ها و CRM', href: '/admin/leads', icon: Target, permission: 'view leads' },
            { title: 'جلسات کوچینگ', href: '/admin/content/coaching', icon: GraduationCap, permission: 'view coaching' },
            { title: 'فرزندان و ارتباط والدین', href: '/admin/content/students', icon: UsersRound, permission: 'view students' },
            { title: 'گواهینامه‌های صادرشده', href: '/admin/certificates', icon: Award, permission: 'view certificates' },
            { title: 'سفارش‌ها و پرداخت‌ها', href: '/admin/content/orders', icon: Receipt, permission: 'view orders' },
            { title: 'تیکت‌ها', href: '/admin/content/tickets', icon: Ticket, permission: 'view tickets' },
            { title: 'پشتیبانی زنده', href: '/admin/support-chat', icon: Headset, permission: 'view tickets' },
            { title: 'مدرسین و کوچ‌ها', href: '/admin/users?role=instructor', icon: UserRound, permission: 'view instructors' },
        ] },
    { section: 'سیستم', items: [
            { title: 'نقش‌ها و دسترسی‌ها', href: '/admin/access', icon: ShieldCheck, permission: 'view roles' },
            { title: 'تنظیمات سایت', href: '/admin/settings', icon: Settings, permission: 'view settings', exact: true },
            { title: 'پنل پیامک', href: '/admin/settings/sms', icon: MessageSquare, permission: 'view settings' },
            { title: 'درگاه پرداخت', href: '/admin/settings/payments', icon: CreditCard, permission: 'view settings' },
            { title: 'اتصالات و پیگیری خودکار', href: '/admin/settings/automations', icon: BellRing, permission: 'view settings' },
        ] },
];
export default function AdminLayout({ children, title }) {
    const { auth } = usePage().props;
    const currentUrl = usePage().url;
    const [open, setOpen] = useState(false);
    const permissions = auth.user?.permissions ?? [];
    const isSuper = auth.user?.roles?.includes('super-admin') ?? false;
    const visibleNav = useMemo(() => nav.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.permission || isSuper || permissions.includes('manage all') || permissions.includes(item.permission)),
    })).filter((group) => group.items.length > 0), [isSuper, permissions]);
    const logout = () => router.post('/logout');
    const renderNav = (mobile = false) => visibleNav.map((group) => (_jsxs("div", { className: "mb-5", children: [_jsx("div", { className: "px-3 pb-2 text-[11px] font-black text-navy/35", children: group.section }), _jsx("div", { className: "flex flex-col gap-0.5", children: group.items.map((item) => {
                    const active = item.exact
                        ? currentUrl === item.href
                        : item.href.includes('?')
                            ? currentUrl.startsWith(item.href.split('?')[0])
                            : (item.href === '/admin' ? currentUrl === '/admin' : currentUrl.startsWith(item.href));
                    return (_jsxs(Link, { href: item.href, onClick: mobile ? () => setOpen(false) : undefined, className: `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${active ? 'bg-brand-50 text-brand-700' : 'text-navy/60 hover:bg-soft-gray hover:text-navy'}`, children: [_jsx(item.icon, { className: "size-4.5", "aria-hidden": true }), item.title] }, item.href));
                }) })] }, group.section)));
    return (_jsxs("div", { className: "admin-panel-shell flex min-h-screen bg-soft-gray", dir: "rtl", children: [_jsxs("aside", { className: "fixed inset-y-0 right-0 z-40 hidden w-72 flex-col border-l border-navy/5 bg-white lg:flex", children: [_jsxs("div", { className: "flex h-16 items-center gap-2.5 border-b border-navy/5 px-5", children: [_jsx(BrandLogo, { className: "admin-brand-mark" }), _jsxs("div", { className: "leading-tight", children: [_jsx("div", { className: "text-xs font-black text-navy", children: "\u0645\u0631\u06A9\u0632 \u0631\u0634\u062F" }), _jsx("div", { className: "text-[10px] font-bold text-brand-600", children: "\u0645\u0631\u06A9\u0632 \u0641\u0631\u0645\u0627\u0646\u062F\u0647\u06CC" })] })] }), _jsx("nav", { className: "flex-1 overflow-y-auto px-3 py-4", children: renderNav() }), _jsx("div", { className: "border-t border-navy/5 p-3", children: _jsxs("button", { type: "button", onClick: logout, className: "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50", children: [_jsx(LogOut, { className: "size-4.5", "aria-hidden": true }), " \u062E\u0631\u0648\u062C"] }) })] }), open && (_jsxs("div", { className: "fixed inset-0 z-50 lg:hidden", children: [_jsx("div", { className: "absolute inset-0 bg-navy/40", onClick: () => setOpen(false), "aria-hidden": true }), _jsxs("aside", { className: "absolute inset-y-0 right-0 flex w-80 flex-col bg-white shadow-lift", children: [_jsxs("div", { className: "flex h-16 items-center justify-between border-b border-navy/5 px-5", children: [_jsx("span", { className: "text-sm font-black text-navy", children: "\u0645\u0631\u06A9\u0632 \u0641\u0631\u0645\u0627\u0646\u062F\u0647\u06CC" }), _jsx("button", { type: "button", onClick: () => setOpen(false), "aria-label": "\u0628\u0633\u062A\u0646", children: _jsx(X, { className: "size-5" }) })] }), _jsx("nav", { className: "flex-1 overflow-y-auto px-3 py-4", children: renderNav(true) })] })] })), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col lg:mr-72", children: [_jsxs("header", { className: "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy/5 bg-white/80 px-4 backdrop-blur md:px-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", className: "rounded-xl p-2 text-navy lg:hidden", onClick: () => setOpen(true), "aria-label": "\u0628\u0627\u0632 \u06A9\u0631\u062F\u0646 \u0645\u0646\u0648", children: _jsx(MenuIcon, { className: "size-5" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-black text-brand-600", children: "\u0645\u062F\u06CC\u0631\u06CC\u062A \u06CC\u06A9\u067E\u0627\u0631\u0686\u0647 \u0627\u06A9\u0648\u0633\u06CC\u0633\u062A\u0645" }), _jsx("h1", { className: "text-base font-black text-navy", children: title ?? 'پنل مدیریت' })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ThemeToggle, { compact: true }), _jsx(Link, { href: "/", className: "hidden text-xs font-bold text-navy/50 transition-colors hover:text-brand-700 sm:block", children: "\u0645\u0634\u0627\u0647\u062F\u0647 \u0633\u0627\u06CC\u062A" }), _jsxs("div", { className: "flex items-center gap-2.5 rounded-xl bg-soft-gray px-3 py-2", children: [_jsx("span", { className: "flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-deep-green text-xs font-black text-white", children: auth.user?.name?.slice(0, 1) ?? '؟' }), _jsxs("div", { className: "hidden leading-tight md:block", children: [_jsx("div", { className: "text-xs font-black text-navy", children: auth.user?.name }), _jsx("div", { className: "text-[10px] text-navy/45", children: auth.user?.roles?.join('، ') })] })] })] })] }), _jsxs("main", { className: "flex-1 p-4 md:p-6", children: [_jsx(PanelHelpGuide, { role: "admin" }), children] })] }), _jsx(PwaInstallPrompt, {}), _jsx(FlashToast, {})] }));
}
