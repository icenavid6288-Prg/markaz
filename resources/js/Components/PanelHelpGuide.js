import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@inertiajs/react';
import { BellRing, BookOpen, ChevronDown, CircleHelp, CreditCard, ExternalLink, LifeBuoy, MessageSquare } from 'lucide-react';
const content = {
    admin: {
        title: 'راهنمای پنل مدیریت',
        description: 'برای مدیریت کامل سایت، از این مسیرها شروع کنید.',
        steps: [
            'ابتدا داشبورد را برای دیدن وضعیت فروش، کاربران و محتوای سایت بررسی کنید.',
            'از بخش محتوا، دوره‌ها، خدمات، محصولات، بلاگ و صفحات عمومی را مدیریت کنید.',
            'در بخش کاربران و CRM، نقش‌ها، دسترسی‌ها و پیگیری سرنخ‌ها را انجام دهید.',
            'تنظیمات سایت برای برند، SEO و پاپ‌آپ در دسترس است؛ پیامک، درگاه پرداخت و اتصالات/پیگیری‌های خودکار هرکدام صفحه مخصوص خودشان را دارند.',
            'در اتومارکتینگ کمپین بسازید، مخاطب را انتخاب کنید، پیام را زمان‌بندی یا اجرا کنید و نتیجه را در تاریخچه ببینید.',
            'رویدادهای خودکار: «ثبت لید جدید» با هر فرم تماس یا ثبت‌نام در سایت اجرا می‌شود، «خرید دوره» پس از پرداخت موفق و «کاربر غیرفعال» هر روز ساعت ۹ صبح برای کاربرانی که ثبت‌نام کرده‌اند اما خریدی نداشته‌اند.',
            'هر ارسال در تاریخچه کمپین ثبت می‌شود؛ برای کمپین «کاربر غیرفعال» می‌توانید فاصله بین دو ارسال را بر حسب روز تعیین کنید تا کاربران هر چند وقت یک‌بار همان پیام را بگیرند.',
            'برای لیست اختصاصی، از CSV یا XLSX ستون‌های موبایل، نام و ایمیل را وارد کنید؛ ردیف‌های نامعتبر حذف و کمپین در صورت انتخاب شما وارد صف ارسال می‌شود.',
            'در تنظیمات پیامک می‌توانید دو پنل پیامک وصل کنید: پنل اصلی و پنل پشتیبان؛ اگر ارسال از پنل اصلی ناموفق باشد، به‌طور خودکار از پنل دوم ارسال می‌شود.',
            'در صفحه «اتصالات و پیگیری خودکار»، بخش «پیگیری بازدیدکنندگان» کاربرانی را که چند صفحه دیده‌اند اما خریدی نداشته‌اند هر شب به‌صورت خودکار پیامک و اعلان می‌گیرند.',
            'در صفحه «اتصالات و پیگیری خودکار»، بخش «پیگیری لیدهای بی‌پاسخ» سرنخ‌هایی را که پس از آخرین فعالیت به‌مدت تعیین‌شده (پیش‌فرض ۷ روز) اقدامی نکرده‌اند هر روز ساعت ۱۰ صبح پیامک یادآوری می‌گیرند؛ با دکمه «اجرای فوری» می‌توانید همین حالا تست کنید.',
            'در پخش دوره‌ها، درس‌های بعد از هر ویدیو یا پادکست تا زمانی که آن درس کامل دیده نشود قفل می‌مانند.',
        ],
        links: [
            { label: 'تنظیمات سایت', href: '/admin/settings', icon: LifeBuoy },
            { label: 'پنل پیامک', href: '/admin/settings/sms', icon: MessageSquare },
            { label: 'درگاه پرداخت', href: '/admin/settings/payments', icon: CreditCard },
            { label: 'اتصالات و پیگیری خودکار', href: '/admin/settings/automations', icon: BellRing },
            { label: 'نقش‌ها و دسترسی‌ها', href: '/admin/access', icon: CircleHelp },
            { label: 'اتومارکتینگ', href: '/admin/marketing', icon: BookOpen },
            { label: 'گزارش فعالیت مدیران', href: '/admin/audit-logs', icon: CircleHelp },
        ],
    },
    student: {
        title: 'راهنمای پنل کاربری',
        description: 'این پنل مرکز پیگیری مسیر یادگیری و رشد شخصی شماست.',
        steps: [
            'از دوره‌های من، آخرین درس و درصد پیشرفت هر دوره را دنبال کنید.',
            'در مسیر رشد، هدف‌ها و کارهای مهم خود را مرور کنید.',
            'جلسات کوچینگ، سفارش‌ها و پیشنهادهای آموزشی در همین داشبورد نمایش داده می‌شوند.',
            'برای تغییر نام، موبایل یا رمز عبور به تنظیمات پروفایل بروید.',
        ],
        links: [
            { label: 'مشاهده دوره‌ها', href: '/courses', icon: BookOpen },
            { label: 'تنظیمات پروفایل', href: '/profile', icon: CircleHelp },
        ],
    },
    instructor: {
        title: 'راهنمای استودیو مدرس',
        description: 'ابزارهای ساخت دوره و پیگیری یادگیرندگان اینجا قرار دارد.',
        steps: [
            'برای شروع، یک دوره جدید بسازید و عنوان، توضیحات، قیمت و تصویر آن را تکمیل کنید.',
            'ماژول‌ها، درس‌ها، ویدیوها و فایل‌های آموزشی را به‌ترتیب اضافه کنید.',
            'قبل از انتشار، سرفصل‌ها و وضعیت دوره را بررسی کنید.',
            'از بخش یادگیرندگان، ثبت‌نام‌ها و میزان پیشرفت دانش‌آموزان را پیگیری کنید.',
        ],
        links: [
            { label: 'مدیریت دوره‌ها', href: '/admin/courses', icon: BookOpen },
            { label: 'مشاهده سایت', href: '/', icon: ExternalLink },
        ],
    },
    coach: {
        title: 'راهنمای اتاق کوچینگ',
        description: 'برای پیگیری جلسه‌ها و هدف‌های دانش‌آموزان از این بخش استفاده کنید.',
        steps: [
            'جلسات پیش‌رو را بررسی کنید و وضعیت هر جلسه را به‌روز نگه دارید.',
            'هدف‌های هر دانش‌آموز را مرور کرده و قدم بعدی مسیر را مشخص کنید.',
            'پس از جلسه، گزارش و نکته‌های مهم را ثبت کنید تا مسیر قابل پیگیری باشد.',
            'اطلاعات تخصصی و وضعیت دسترسی خود را از پروفایل مدیریت کنید.',
        ],
        links: [
            { label: 'صفحه کوچینگ', href: '/coaching', icon: LifeBuoy },
            { label: 'پروفایل و تنظیمات', href: '/profile', icon: CircleHelp },
        ],
    },
    parent: {
        title: 'راهنمای فضای والدین',
        description: 'پیشرفت و گزارش‌های فرزندتان را از این بخش دنبال کنید.',
        steps: [
            'از داشبورد، فهرست فرزندان و خلاصه وضعیت هرکدام را ببینید.',
            'با کلیک روی «مشاهده گزارش کامل»، دوره‌ها، پیشرفت، تکالیف، آزمون‌ها و گواهینامه‌های فرزند نمایش داده می‌شود.',
            'جلسات کوچینگ و هدف‌های فعال نیز در گزارش فرزند قابل پیگیری است.',
            'اگر فرزندتان در فهرست نیست، از مرکز بخواهید حساب او را به شما متصل کند.',
        ],
        links: [
            { label: 'تماس با مرکز', href: '/contact', icon: LifeBuoy },
            { label: 'پروفایل و تنظیمات', href: '/profile', icon: CircleHelp },
        ],
    },
};
export default function PanelHelpGuide({ role }) {
    const guide = content[role];
    return (_jsxs("details", { className: "panel-help-guide group", children: [_jsxs("summary", { className: "panel-help-summary", children: [_jsx("span", { className: "panel-help-icon", children: _jsx(CircleHelp, { className: "size-5", "aria-hidden": true }) }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("strong", { children: guide.title }), _jsx("small", { children: guide.description })] }), _jsx("span", { className: "panel-help-toggle", children: _jsx(ChevronDown, { className: "size-4", "aria-hidden": true }) })] }), _jsxs("div", { className: "panel-help-content", children: [_jsxs("div", { children: [_jsxs("p", { className: "panel-help-label", children: [_jsx(BookOpen, { className: "size-4", "aria-hidden": true }), " \u0686\u0637\u0648\u0631 \u0634\u0631\u0648\u0639 \u06A9\u0646\u0645\u061F"] }), _jsx("ol", { className: "panel-help-steps", children: guide.steps.map((step, index) => (_jsxs("li", { children: [_jsx("span", { children: index + 1 }), _jsx("p", { children: step })] }, step))) })] }), _jsxs("div", { className: "panel-help-links", children: [_jsxs("p", { className: "panel-help-label", children: [_jsx(LifeBuoy, { className: "size-4", "aria-hidden": true }), " \u062F\u0633\u062A\u0631\u0633\u06CC \u0633\u0631\u06CC\u0639"] }), guide.links.map((item) => {
                                const Icon = item.icon;
                                return (_jsxs(Link, { href: item.href, className: "panel-help-link", children: [_jsx(Icon, { className: "size-4", "aria-hidden": true }), _jsx("span", { children: item.label }), _jsx(ExternalLink, { className: "mr-auto size-3.5 opacity-50", "aria-hidden": true })] }, item.href));
                            })] })] })] }));
}
