import { jsx as _jsx } from "react/jsx-runtime";
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsForm from './SettingsForm';
export default function ChatSettings() {
    return (_jsx(SettingsForm, { view: "chat", groupKeys: ['chat'], hero: {
            kicker: 'پشتیبانی زنده و هوش مصنوعی',
            title: 'چت سایت را راه‌اندازی کنید.',
            description: 'ویجت پشتیبانی پایین-راست سایت را فعال کنید، کلید API هوش مصنوعی را وارد و تست کنید تا پاسخ‌دهی خودکار شروع شود. کارشناسان هم از پنل «پشتیبانی زنده» پاسخ می‌دهند.',
        } }));
}
ChatSettings.layout = (page) => _jsx(AdminLayout, { title: "\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0632\u0646\u062F\u0647 \u0648 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC", children: page });
