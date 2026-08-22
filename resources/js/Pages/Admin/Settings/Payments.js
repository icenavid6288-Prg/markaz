import { jsx as _jsx } from "react/jsx-runtime";
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsForm from './SettingsForm';
export default function PaymentSettings() {
    return (_jsx(SettingsForm, { view: "payment", groupKeys: ['payment'], hero: {
            kicker: 'درگاه پرداخت',
            title: 'پرداخت آنلاین را یک‌بار تنظیم کنید.',
            description: 'درگاه فعال و کلیدهای زرین‌پال، آیدی‌پی و زیبال را اینجا مدیریت کنید؛ بررسی اتصال هر درگاه بدون ایجاد تراکنش انجام می‌شود.',
        } }));
}
PaymentSettings.layout = (page) => _jsx(AdminLayout, { title: "\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A", children: page });
