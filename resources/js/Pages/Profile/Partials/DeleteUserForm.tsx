import { useForm } from '@inertiajs/react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useRef, useState, type FormEventHandler } from 'react';
import Modal from '@/Components/Modal';

export default function DeleteUserForm({ className = '' }: { className?: string }) {
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });

    const closeModal = () => {
        setConfirming(false);
        clearErrors();
        reset();
    };

    const deleteUser: FormEventHandler = (event) => {
        event.preventDefault();
        destroy('/profile', {
            preserveScroll: true,
            onSuccess: closeModal,
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <section className={`profile-delete ${className}`}>
            <div className="flex items-start gap-3"><span className="profile-icon profile-icon-danger"><AlertTriangle className="size-5" /></span><div><h2 className="text-lg font-black text-red-700 dark:text-red-300">حذف حساب کاربری</h2><p className="mt-1 text-xs leading-6 text-red-900/60 dark:text-red-100/60">این عملیات دائمی است و دوره‌ها، سفارش‌ها و اطلاعات حساب شما را حذف می‌کند.</p></div></div>
            <button type="button" onClick={() => setConfirming(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-black text-red-600 transition-colors hover:bg-red-50 dark:border-red-300/20 dark:bg-white/5 dark:text-red-300"><Trash2 className="size-4" /> حذف حساب</button>

            <Modal show={confirming} onClose={closeModal}>
                <form onSubmit={deleteUser} className="profile-delete-modal p-6" dir="rtl">
                    <h2 className="text-lg font-black text-navy">آیا از حذف حساب مطمئن هستید؟</h2>
                    <p className="mt-2 text-sm leading-7 text-navy/55">برای تأیید نهایی، رمز عبور فعلی خود را وارد کنید. این اقدام قابل بازگشت نیست.</p>
                    <label htmlFor="delete-password" className="mt-5 block text-xs font-black text-navy/70">رمز عبور</label>
                    <input id="delete-password" ref={passwordInput} type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className="mt-2 w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" autoComplete="current-password" autoFocus />
                    {errors.password && <p className="mt-2 text-xs font-bold text-red-600">{errors.password}</p>}
                    <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={closeModal} className="rounded-xl border border-navy/10 px-4 py-2.5 text-xs font-black text-navy/60">انصراف</button><button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><Trash2 className="size-4" /> {processing ? 'در حال حذف...' : 'حذف دائمی حساب'}</button></div>
                </form>
            </Modal>
        </section>
    );
}
