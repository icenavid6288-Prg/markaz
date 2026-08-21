import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock3, Globe, HeartHandshake, Send } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { PageHeader } from '@/Components/ui/PageHeader';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface ServiceData {
    id: number;
    title: string;
    slug: string;
}

export default function ContactIndex() {
    const { site, services } = usePage<PageProps & { services: ServiceData[] }>().props;

    const lead = useForm({
        name: '',
        phone: '',
        need: '',
        consent: false,
    });

    const submitLead = (e: FormEvent) => {
        e.preventDefault();
        lead.post('/leads', { preserveScroll: true });
    };

    const contactItems = [
        { icon: Send, title: 'ایتا', value: site.contact.eitaa, ltr: true },
        { icon: Globe, title: 'وب‌سایت', value: site.contact.website, ltr: true },
        { icon: Clock3, title: 'ساعات کاری', value: site.contact.working_hours, ltr: false },
    ];

    return (
        <div>
            <PageHeader
                eyebrow="تماس با ما"
                title="بیایید درباره مسیر فرزندتان گفتگو کنیم"
                subtitle="فرم زیر را پر کنید؛ کارشناسان ما در اولین فرصت با شما تماس می‌گیرند و ارزیابی اولیه رایگان انجام می‌شود."
            />

            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* form */}
                    <form onSubmit={submitLead} className="liquid-card p-6 md:p-8" dir="rtl">
                        <span className="liquid-blob blob-a" aria-hidden />
                        <span className="liquid-blob blob-b" aria-hidden />
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" />
                            <span>درخواست مشاوره رایگان</span>
                        </div>
                        <h2 className="mt-3 text-2xl font-black text-navy">فرم تماس</h2>
                        <div className="mt-7 flex flex-col gap-4">
                            <div>
                                <label htmlFor="lead-name" className="mb-1.5 block text-xs font-bold text-navy/70">
                                    نام و نام خانوادگی *
                                </label>
                                <input
                                    id="lead-name"
                                    type="text"
                                    required
                                    value={lead.data.name}
                                    onChange={(e) => lead.setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3.5 text-sm text-navy outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-100"
                                    placeholder="مثلاً: مریم احمدی"
                                />
                                {lead.errors.name && <p className="mt-1 text-xs text-red-600">{lead.errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="lead-phone" className="mb-1.5 block text-xs font-bold text-navy/70">
                                    شماره تماس *
                                </label>
                                <input
                                    id="lead-phone"
                                    type="tel"
                                    required
                                    dir="ltr"
                                    value={lead.data.phone}
                                    onChange={(e) => lead.setData('phone', e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3.5 text-right text-sm text-navy outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-100"
                                    placeholder="0933xxxxxxx"
                                />
                                {lead.errors.phone && <p className="mt-1 text-xs text-red-600">{lead.errors.phone}</p>}
                            </div>
                            <div>
                                <label htmlFor="lead-need" className="mb-1.5 block text-xs font-bold text-navy/70">
                                    موضوع (اختیاری)
                                </label>
                                <select
                                    id="lead-need"
                                    value={lead.data.need}
                                    onChange={(e) => lead.setData('need', e.target.value)}
                                    className="w-full rounded-xl border border-navy/10 bg-white px-4 py-3.5 text-sm text-navy outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-100"
                                >
                                    <option value="">انتخاب کنید</option>
                                    {services.map((service) => (
                                        <option key={service.id}>{service.title}</option>
                                    ))}
                                    <option>مهارت‌های آینده</option>
                                    <option>سایر</option>
                                </select>
                            </div>
                            <label className="flex items-start gap-2.5 text-xs leading-6 text-navy/55">
                                <input type="checkbox" checked={Boolean(lead.data.consent)} onChange={(e) => lead.setData('consent', e.target.checked)} className="mt-1 size-4 shrink-0 rounded border-navy/20 text-accent focus:ring-accent" required />
                                <span>با قوانین و حریم خصوصی مرکز موافقم و اجازه می‌دهم با من تماس گرفته شود.</span>
                            </label>
                            {lead.errors.consent && <p className="text-xs text-red-600">{lead.errors.consent}</p>}
                            <button
                                type="submit"
                                disabled={lead.processing}
                                className="inline-flex min-h-[3.125rem] w-full items-center justify-center gap-2 rounded-2xl bg-accent px-7 py-4 text-base font-bold text-white shadow-glow transition-all hover:bg-accent-strong active:scale-[0.98] disabled:opacity-60"
                            >
                                <HeartHandshake className="size-5" aria-hidden />
                                {lead.processing ? 'در حال ارسال...' : 'دریافت مشاوره رایگان'}
                            </button>
                            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                                {['ارزیابی اولیه رایگان', 'بدون هیچ تعهدی', 'پاسخ در کمتر از ۲۴ ساعت'].map((item) => (
                                    <li key={item} className="flex items-center gap-1.5 text-xs font-bold text-navy/45">
                                        <CheckCircle2 className="size-3.5 text-brand-500" aria-hidden /> {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </form>

                    {/* contact info */}
                    <div className="flex flex-col gap-5">
                        {contactItems.map((item) => (
                            <div key={item.title} className="liquid-card flex items-center gap-4 p-5">
                                <span className="liquid-blob blob-b" aria-hidden />
                                <span className="glass-tile glass-tile-lg">
                                    <item.icon strokeWidth={1.7} aria-hidden />
                                </span>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-navy/45">{item.title}</div>
                                    <div className={`mt-0.5 text-sm font-black text-navy ${item.ltr ? 'text-left' : ''}`} dir={item.ltr ? 'ltr' : 'rtl'}>
                                        {item.value}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

ContactIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
