import { jsx as _jsx } from "react/jsx-runtime";
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsForm from './SettingsForm';
export default function SmsSettings() {
    return (_jsx(SettingsForm, { view: "sms", groupKeys: ['sms'], hero: {
            kicker: 'پنل پیامک',
            title: 'ارسال پیامک را یک‌بار تنظیم کنید.',
            description: 'پنل اصلی و پشتیبان، متن پیام OTP و شماره تست را اینجا مدیریت کنید؛ وضعیت اتصال هر سرویس بدون کلیک و به‌صورت خودکار نمایش داده می‌شود.',
        } }));
}
SmsSettings.layout = (page) => _jsx(AdminLayout, { title: "\u067E\u0646\u0644 \u067E\u06CC\u0627\u0645\u06A9", children: page });
