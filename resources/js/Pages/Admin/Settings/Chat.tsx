import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsForm from './SettingsForm';

export default function ChatSettings() {
    return (
        <SettingsForm
            view="chat"
            groupKeys={['chat']}
            hero={{
                kicker: 'پشتیبانی زنده و هوش مصنوعی',
                title: 'چت سایت را راه‌اندازی کنید.',
                description: 'ویجت پشتیبانی پایین-راست سایت را فعال کنید، کلید API هوش مصنوعی را وارد و تست کنید تا پاسخ‌دهی خودکار شروع شود. کارشناسان هم از پنل «پشتیبانی زنده» پاسخ می‌دهند.',
            }}
        />
    );
}

ChatSettings.layout = (page: ReactNode) => <AdminLayout title="پشتیبانی زنده و هوش مصنوعی">{page}</AdminLayout>;
