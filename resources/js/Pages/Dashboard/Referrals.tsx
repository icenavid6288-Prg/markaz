import { Head, usePage } from '@inertiajs/react';
import { Copy, Gift, Share2, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import UserDashboardLayout from '@/Layouts/UserDashboardLayout';
import { formatDate, toFa } from '@/lib/format';
import type { PageProps } from '@/types';

interface ReferralItem {
    id: number;
    name?: string | null;
    created_at?: string | null;
    coupon_code?: string | null;
    rewarded: boolean;
}

export default function Referrals() {
    const { code, invite_url, count, reward_percent, referrals } = usePage<PageProps & { code: string; invite_url: string; count: number; reward_percent: number; referrals: ReferralItem[] }>().props;
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(invite_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* ignore */
        }
    };

    return (
        <UserDashboardLayout>
            <Head title="دعوت دوستان" />
            <div className="mx-auto flex max-w-5xl flex-col gap-7">
                <header>
                    <span className="dashboard-eyebrow"><span /> رشد با هم</span>
                    <h2 className="mt-2 text-2xl font-black text-navy">دعوت دوستان</h2>
                    <p className="mt-2 text-sm leading-7 text-navy/50">برای هر کسی که با لینک شما ثبت‌نام کند، هم شما و هم او کد تخفیف دریافت می‌کنید.</p>
                </header>

                <section className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-6 text-white shadow-lift md:p-8">
                    <div className="pointer-events-none absolute -left-16 -top-24 size-72 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
                    <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-200"><Gift className="size-4" /> کد اختصاصی شما</span>
                            <div className="mt-3 flex flex-wrap items-center gap-3" dir="ltr">
                                <code className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-2xl font-black tracking-[0.2em]">{code}</code>
                                <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-deep-green transition-colors hover:bg-brand-100">
                                    {copied ? <Sparkles className="size-4" /> : <Copy className="size-4" />} {copied ? 'کپی شد!' : 'کپی لینک دعوت'}
                                </button>
                            </div>
                            <p className="mt-4 text-xs font-bold leading-6 text-white/55" dir="ltr">{invite_url}</p>
                        </div>
                        <div className="flex gap-3">
                            {[
                                { label: 'پاداش شما', value: `${toFa(reward_percent)}٪` },
                                { label: 'دعوت موفق', value: toFa(count) },
                            ].map((s) => (
                                <div key={s.label} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-center">
                                    <strong className="block text-2xl font-black">{s.value}</strong>
                                    <span className="mt-1 block text-[0.65rem] font-bold text-white/55">{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex items-center gap-2 text-sm font-black text-navy"><Users className="size-4 text-brand-600" /> دعوت‌های شما</div>
                    {referrals.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-brand-200 bg-white/55 px-5 py-14 text-center">
                            <Share2 className="size-7 text-brand-500" />
                            <p className="mt-3 text-sm font-bold text-navy/50">هنوز کسی با لینک شما ثبت‌نام نکرده است. لینک را با والدین، معلمان و دوستان به اشتراک بگذارید.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {referrals.map((r) => (
                                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-soft">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">{r.name?.slice(0, 1) ?? '؟'}</span>
                                        <div><strong className="block text-sm font-black text-navy">{r.name ?? 'کاربر مهمان'}</strong><span className="text-xs font-bold text-navy/40">{formatDate(r.created_at)}</span></div>
                                    </div>
                                    {r.rewarded ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-black text-brand-700"><Gift className="size-3.5" /> کد {r.coupon_code} ثبت شد</span>
                                    ) : (
                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">در انتظار</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </UserDashboardLayout>
    );
}

Referrals.layout = (page: React.ReactNode) => page;
