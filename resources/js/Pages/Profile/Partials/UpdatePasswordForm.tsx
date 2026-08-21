import { useForm } from '@inertiajs/react';
import { CheckCircle2, KeyRound, Save } from 'lucide-react';
import type { FormEventHandler } from 'react';

export default function UpdatePasswordForm({ className = '' }: { className?: string }) {
    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (event) => {
        event.preventDefault();
        put('/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <form onSubmit={updatePassword} className={`profile-form ${className}`}>
            <div className="grid gap-5 md:grid-cols-3">
                <div>
                    <label htmlFor="current_password">رمز عبور فعلی</label>
                    <input id="current_password" type="password" value={data.current_password} onChange={(event) => setData('current_password', event.target.value)} autoComplete="current-password" />
                    {errors.current_password && <p className="profile-error">{errors.current_password}</p>}
                </div>
                <div>
                    <label htmlFor="password">رمز عبور جدید</label>
                    <input id="password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} autoComplete="new-password" />
                    {errors.password && <p className="profile-error">{errors.password}</p>}
                </div>
                <div>
                    <label htmlFor="password_confirmation">تکرار رمز عبور جدید</label>
                    <input id="password_confirmation" type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} autoComplete="new-password" />
                    {errors.password_confirmation && <p className="profile-error">{errors.password_confirmation}</p>}
                </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={processing} className="profile-submit"><KeyRound className="size-4" /> {processing ? 'در حال ذخیره...' : 'تغییر رمز عبور'}</button>
                {recentlySuccessful && <span className="profile-success"><CheckCircle2 className="size-4" /> رمز عبور تغییر کرد.</span>}
            </div>
        </form>
    );
}
