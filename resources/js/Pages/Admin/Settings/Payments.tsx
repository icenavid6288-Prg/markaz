import type { ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsForm from './SettingsForm';

export default function PaymentSettings() {
    return (
        <SettingsForm
            view="payment"
            groupKeys={['payment']}
            hero={{
                kicker: 'درگاه پرداخت',
                title: 'پرداخت آنلاین را یک‌بار تنظیم کنید.',
                description: 'درگاه فعال و کلیدهای زرین‌پال، آیدی‌پی و زیبال را اینجا مدیریت کنید؛ بررسی اتصال هر درگاه بدون ایجاد تراکنش انجام می‌شود.',
            }}
        />
    );
}

PaymentSettings.layout = (page: ReactNode) => <AdminLayout title="درگاه پرداخت">{page}</AdminLayout>;
