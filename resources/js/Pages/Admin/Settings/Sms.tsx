import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsForm from './SettingsForm';

export default function SmsSettings() {
    return (
        <SettingsForm
            view="sms"
            groupKeys={['sms']}
            hero={{
                kicker: 'پنل پیامک',
                title: 'ارسال پیامک را یک‌بار تنظیم کنید.',
                description: 'پنل اصلی و پشتیبان، متن پیام OTP و شماره تست را اینجا مدیریت کنید؛ وضعیت اتصال هر سرویس بدون کلیک و به‌صورت خودکار نمایش داده می‌شود.',
            }}
        />
    );
}

SmsSettings.layout = (page: ReactNode) => <AdminLayout title="پنل پیامک">{page}</AdminLayout>;
