import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Save } from 'lucide-react';
import type { FormEventHandler } from 'react';
import type { PageProps } from '@/types';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage<PageProps>().props.auth.user;
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user?.name ?? '',
        phone: user?.phone ?? '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        patch('/profile', { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className={`profile-form ${className}`}>
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="profile-name">نام و نام خانوادگی</label>
                    <input id="profile-name" type="text" value={data.name} onChange={(event) => setData('name', event.target.value)} required autoComplete="name" />
                    {errors.name && <p className="profile-error">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="profile-phone">شماره موبایل</label>
                    <input id="profile-phone" type="tel" dir="ltr" value={data.phone} onChange={(event) => setData('phone', event.target.value)} required autoComplete="tel" />
                    <p className="profile-hint">برای ورود و دریافت کد پیامکی استفاده می‌شود.</p>
                    {errors.phone && <p className="profile-error">{errors.phone}</p>}
                </div>
                <div>
                    <label>ایمیل</label>
                    <div className="profile-readonly" dir="ltr">{user?.email || 'ثبت نشده'}</div>
                    <p className="profile-hint">ورود سایت فقط با شماره موبایل انجام می‌شود.</p>
                </div>
            </div>

            {mustVerifyEmail && status === 'verification-link-sent' && <p className="profile-success">لینک تأیید جدید ارسال شد.</p>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={processing} className="profile-submit"><Save className="size-4" /> {processing ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button>
                {recentlySuccessful && <span className="profile-success"><CheckCircle2 className="size-4" /> تغییرات ذخیره شد.</span>}
            </div>
        </form>
    );
}
