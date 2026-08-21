import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsForm from './SettingsForm';
// لنگرهای صفحه تک‌صفحه‌ای قدیمی تنظیمات که حالا به صفحات جدا منتقل شده‌اند.
const OLD_SECTION_REDIRECTS = {
    sms: '/admin/settings/sms',
    'sms-settings': '/admin/settings/sms',
    otp: '/admin/settings/sms',
    payment: '/admin/settings/payments',
    payments: '/admin/settings/payments',
    'payment-gateway': '/admin/settings/payments',
    gateway: '/admin/settings/payments',
    automation: '/admin/settings/automations',
    automations: '/admin/settings/automations',
    winback: '/admin/settings/automations',
    'lead-reminder': '/admin/settings/automations',
    'lead-reminders': '/admin/settings/automations',
    eitaa: '/admin/settings/automations',
    'follow-up': '/admin/settings/automations',
};
// بخش‌هایی که هنوز در همین صفحه تنظیمات سایت هستند و لنگرشان معتبر است.
const ON_PAGE_SECTIONS = ['brand', 'contact', 'social', 'trust', 'seo', 'general', 'popup'];
export default function SettingsIndex() {
    useEffect(() => {
        const raw = window.location.hash.slice(1);
        if (!raw)
            return;
        const hash = decodeURIComponent(raw).toLowerCase();
        const target = OLD_SECTION_REDIRECTS[hash];
        if (target) {
            // replace تا در تاریخچه مرورگر ورودی اضافه نشود.
            window.location.replace(target);
            return;
        }
        if (!ON_PAGE_SECTIONS.includes(hash)) {
            // لنگر ناشناخته/نامعتبر: آدرس را پاک می‌کنیم تا پرش اشتباهی رخ ندهد.
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }, []);
    return (_jsx(SettingsForm, { view: "site", groupKeys: ['brand', 'contact', 'social', 'trust', 'seo', 'general', 'popup'], hero: {
            kicker: 'تنظیمات عمومی سایت',
            title: 'ظاهر، محتوا و هویت سایت را مدیریت کنید.',
            description: 'برند، اطلاعات تماس، سئو، متن‌های صفحه اصلی و پاپ‌آپ معرفی را همین‌جا ویرایش کنید. کلیدهای حساس (پیامک، پرداخت و اتصالات) در صفحات مخصوص خودشان قرار دارند.',
        } }));
}
SettingsIndex.layout = (page) => _jsx(AdminLayout, { title: "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0633\u0627\u06CC\u062A", children: page });
