import { jsx as _jsx } from "react/jsx-runtime";
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsForm from './SettingsForm';
export default function AutomationSettings() {
    return (_jsx(SettingsForm, { view: "automation", groupKeys: ['eitaa', 'winback', 'lead_reminder'], hero: {
            kicker: 'اتصالات و پیگیری خودکار',
            title: 'اتوماسیون‌ها و اتصالات را مدیریت کنید.',
            description: 'کانال ایتا، پیگیری بازدیدکنندگان و یادآوری لیدهای بی‌پاسخ — هر اتصال و فعالیت خودکاری که به تنظیمات عمومی سایت مربوط نیست اینجا جمع شده است.',
        } }));
}
AutomationSettings.layout = (page) => _jsx(AdminLayout, { title: "\u0627\u062A\u0635\u0627\u0644\u0627\u062A \u0648 \u067E\u06CC\u06AF\u06CC\u0631\u06CC \u062E\u0648\u062F\u06A9\u0627\u0631", children: page });
