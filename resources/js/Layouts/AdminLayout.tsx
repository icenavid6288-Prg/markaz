import { Link, router, usePage } from '@inertiajs/react';
import BrandLogo from '@/Components/BrandLogo';
import FlashToast from '@/Components/FlashToast';
import ThemeToggle from '@/Components/ThemeToggle';
import PanelHelpGuide from '@/Components/PanelHelpGuide';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import {
    Award,
    BarChart3,
    BellRing,
    BookOpen,
    Boxes,
    ClipboardList,
    ClipboardPen,
    CreditCard,
    FileText,
    FolderTree,
    GraduationCap,
    Headset,
    Image,
    LayoutDashboard,
    ListChecks,
    LogOut,
    Mail,
    Menu as MenuIcon,
    MessageSquare,
    MessageSquareQuote,
    NotebookPen,
    Package,
    PanelTop,
    Receipt,
    Settings,
    ShieldCheck,
    ShoppingBag,
    Target,
    Ticket,
    UserRound,
    Users,
    UsersRound,
    X,
} from 'lucide-react';
import { useMemo, useState, type ComponentType, type ReactNode } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
    title?: string;
}

type NavItem = {
    title: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    permission?: string;
    exact?: boolean;
};

type NavGroup = { section: string; items: NavItem[] };

const nav: NavGroup[] = [
    { section: 'مرکز فرماندهی', items: [
        { title: 'داشبورد تحلیلی', href: '/admin', icon: LayoutDashboard },
        { title: 'گزارش‌ها', href: '/admin', icon: BarChart3, permission: 'view reports' },
        { title: 'خروجی سفارش‌ها (CSV)', href: '/admin/reports/orders.csv', icon: Receipt, permission: 'view reports' },
        { title: 'گزارش فعالیت مدیران', href: '/admin/audit-logs', icon: ShieldCheck, permission: 'view reports' },
    ]},
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
    ]},
    { section: 'رشد و اتومارکتینگ', items: [
        { title: 'اتومارکتینگ', href: '/admin/marketing', icon: Mail, permission: 'view marketing' },
        { title: 'ارسال پیامک انبوه', href: '/admin/marketing/bulk-sms', icon: Mail, permission: 'create marketing' },
        { title: 'گزارش ارسال پیامک', href: '/admin/marketing/bulk-sms/reports', icon: FileText, permission: 'view marketing' },
    ]},
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
    ]},
    { section: 'سیستم', items: [
        { title: 'نقش‌ها و دسترسی‌ها', href: '/admin/access', icon: ShieldCheck, permission: 'view roles' },
        { title: 'تنظیمات سایت', href: '/admin/settings', icon: Settings, permission: 'view settings', exact: true },
        { title: 'پنل پیامک', href: '/admin/settings/sms', icon: MessageSquare, permission: 'view settings' },
        { title: 'درگاه پرداخت', href: '/admin/settings/payments', icon: CreditCard, permission: 'view settings' },
        { title: 'اتصالات و پیگیری خودکار', href: '/admin/settings/automations', icon: BellRing, permission: 'view settings' },
    ]},
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const { auth } = usePage().props as { auth: { user: { name: string; roles: string[]; permissions?: string[] } | null } };
    const currentUrl = usePage().url;
    const [open, setOpen] = useState(false);
    const permissions = auth.user?.permissions ?? [];
    const isSuper = auth.user?.roles?.includes('super-admin') ?? false;

    const visibleNav = useMemo(() => nav.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.permission || isSuper || permissions.includes('manage all') || permissions.includes(item.permission)),
    })).filter((group) => group.items.length > 0), [isSuper, permissions]);

    const logout = () => router.post('/logout');

    const renderNav = (mobile = false) => visibleNav.map((group) => (
        <div key={group.section} className="mb-5">
            <div className="px-3 pb-2 text-[11px] font-black text-navy/35">{group.section}</div>
            <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                    const active = item.exact
                        ? currentUrl === item.href
                        : item.href.includes('?')
                            ? currentUrl.startsWith(item.href.split('?')[0])
                            : (item.href === '/admin' ? currentUrl === '/admin' : currentUrl.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={mobile ? () => setOpen(false) : undefined}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                                active ? 'bg-brand-50 text-brand-700' : 'text-navy/60 hover:bg-soft-gray hover:text-navy'
                            }`}
                        >
                            <item.icon className="size-4.5" aria-hidden />
                            {item.title}
                        </Link>
                    );
                })}
            </div>
        </div>
    ));

    return (
        <div className="admin-panel-shell flex min-h-screen bg-soft-gray" dir="rtl">
            <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 flex-col border-l border-navy/5 bg-white lg:flex">
                <div className="flex h-16 items-center gap-2.5 border-b border-navy/5 px-5">
                    <BrandLogo className="admin-brand-mark" />
                    <div className="leading-tight">
                        <div className="text-xs font-black text-navy">مرکز رشد</div>
                        <div className="text-[10px] font-bold text-brand-600">مرکز فرماندهی</div>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-4">{renderNav()}</nav>
                <div className="border-t border-navy/5 p-3">
                    <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50">
                        <LogOut className="size-4.5" aria-hidden /> خروج
                    </button>
                </div>
            </aside>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} aria-hidden />
                    <aside className="absolute inset-y-0 right-0 flex w-80 flex-col bg-white shadow-lift">
                        <div className="flex h-16 items-center justify-between border-b border-navy/5 px-5">
                            <span className="text-sm font-black text-navy">مرکز فرماندهی</span>
                            <button type="button" onClick={() => setOpen(false)} aria-label="بستن"><X className="size-5" /></button>
                        </div>
                        <nav className="flex-1 overflow-y-auto px-3 py-4">{renderNav(true)}</nav>
                    </aside>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col lg:mr-72">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-navy/5 bg-white/80 px-4 backdrop-blur md:px-6">
                    <div className="flex items-center gap-3">
                        <button type="button" className="rounded-xl p-2 text-navy lg:hidden" onClick={() => setOpen(true)} aria-label="باز کردن منو"><MenuIcon className="size-5" /></button>
                        <div><div className="text-[10px] font-black text-brand-600">مدیریت یکپارچه اکوسیستم</div><h1 className="text-base font-black text-navy">{title ?? 'پنل مدیریت'}</h1></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle compact />
                        <Link href="/" className="hidden text-xs font-bold text-navy/50 transition-colors hover:text-brand-700 sm:block">مشاهده سایت</Link>
                        <div className="flex items-center gap-2.5 rounded-xl bg-soft-gray px-3 py-2">
                            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-deep-green text-xs font-black text-white">{auth.user?.name?.slice(0, 1) ?? '؟'}</span>
                            <div className="hidden leading-tight md:block"><div className="text-xs font-black text-navy">{auth.user?.name}</div><div className="text-[10px] text-navy/45">{auth.user?.roles?.join('، ')}</div></div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6">
                    <PanelHelpGuide role="admin" />
                    {children}
                </main>
            </div>
            <PwaInstallPrompt />
            <FlashToast />
        </div>
    );
}
