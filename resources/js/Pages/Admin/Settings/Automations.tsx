import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsForm from './SettingsForm';

export default function AutomationSettings() {
    return (
        <SettingsForm
            view="automation"
            groupKeys={['eitaa', 'winback', 'lead_reminder']}
            hero={{
                kicker: 'اتصالات و پیگیری خودکار',
                title: 'اتوماسیون‌ها و اتصالات را مدیریت کنید.',
                description: 'کانال ایتا، پیگیری بازدیدکنندگان و یادآوری لیدهای بی‌پاسخ — هر اتصال و فعالیت خودکاری که به تنظیمات عمومی سایت مربوط نیست اینجا جمع شده است.',
            }}
        />
    );
}

AutomationSettings.layout = (page: ReactNode) => <AdminLayout title="اتصالات و پیگیری خودکار">{page}</AdminLayout>;
