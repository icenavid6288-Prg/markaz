import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import DeleteUserForm from './Partials/DeleteUserForm';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import type { PageProps } from '@/types';

export default function Edit({ mustVerifyEmail, status }: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const user = usePage<PageProps>().props.auth.user;

    return (
        <UserDashboardLayout>
            <Head title="تنظیمات پروفایل" />
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <section className="profile-hero relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
                    <div className="pointer-events-none absolute -left-16 -top-20 size-72 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
                    <div className="relative flex flex-wrap items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <span className="flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-black text-white backdrop-blur-md">{user?.name?.slice(0, 1) ?? '؟'}</span>
                            <div>
                                <span className="text-xs font-bold text-brand-200">حساب شخصی شما</span>
                                <h2 className="mt-1 text-2xl font-black">تنظیمات پروفایل</h2>
                                <p className="mt-1 text-sm text-white/60">اطلاعات حساب و امنیت مسیر رشدتان را مدیریت کنید.</p>
                            </div>
                        </div>
                        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-white/20"><ArrowLeft className="size-4" /> بازگشت به داشبورد</Link>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="profile-surface rounded-3xl p-6 md:p-8">
                        <div className="mb-6 flex items-start gap-3"><span className="profile-icon"><UserRound className="size-5" /></span><div><h2 className="text-lg font-black text-navy">اطلاعات حساب</h2><p className="mt-1 text-xs leading-6 text-navy/50">نام و شماره موبایل حساب خود را به‌روز نگه دارید.</p></div></div>
                        <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
                    </div>

                    <aside className="profile-surface rounded-3xl p-6 md:p-8">
                        <div className="mb-6 flex items-start gap-3"><span className="profile-icon profile-icon-gold"><ShieldCheck className="size-5" /></span><div><h2 className="text-lg font-black text-navy">وضعیت حساب</h2><p className="mt-1 text-xs leading-6 text-navy/50">اطلاعات مهم حساب شما</p></div></div>
                        <div className="flex flex-col gap-3">
                            <div className="profile-status-row"><Smartphone className="size-4 text-brand-600" /><span>ورود با شماره موبایل</span><CheckCircle2 className="mr-auto size-4 text-brand-500" /></div>
                            <div className="profile-status-row"><LockKeyhole className="size-4 text-brand-600" /><span>کد یک‌بارمصرف فعال</span><CheckCircle2 className="mr-auto size-4 text-brand-500" /></div>
                            <div className="profile-status-row"><UserRound className="size-4 text-brand-600" /><span>نقش حساب: {user?.roles?.[0] ?? 'کاربر'}</span></div>
                        </div>
                        <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-xs leading-6 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100">برای امنیت بیشتر، شماره موبایل خود را در اختیار دیگران قرار ندهید. تغییر شماره نیازمند تأیید اعتبار در مراحل بعدی است.</div>
                    </aside>
                </section>

                <section className="profile-danger rounded-3xl p-6 md:p-8">
                    <DeleteUserForm />
                </section>
            </div>
        </UserDashboardLayout>
    );
}

Edit.layout = (page: ReactNode) => page;
