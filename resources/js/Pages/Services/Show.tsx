import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ChevronDown, HeartHandshake, MessageCircleQuestion, Quote, Star, Target, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { getServiceVisualIcon, getServiceVisualVariant } from '@/Components/ServiceVisual';
import { PageHeader } from '@/Components/ui/PageHeader';
import { formatNumber, formatPrice } from '@/lib/format';
import PublicLayout from '@/Layouts/PublicLayout';
import type { PageProps } from '@/types';

interface ServiceData {
    id: number;
    title: string;
    slug: string;
    summary?: string | null;
    description?: string | null;
    icon?: string | null;
    price?: number | null;
    features?: string[] | null;
    process?: string[] | null;
    target_audience?: string[] | null;
    outcomes?: string[] | null;
    faqs?: Array<{ q: string; a: string }> | null;
    cta_text?: string | null;
    cta_url?: string | null;
}

interface TestimonialData {
    id: number;
    name: string;
    role: string;
    content: string;
    rating?: number | null;
}

const roleLabels: Record<string, string> = { parent: 'والد', student: 'نوجوان', instructor: 'مدرس', coach: 'کوچ' };

export default function ServiceShow() {
    const { service, testimonials, others } = usePage<
        PageProps & { service: ServiceData; testimonials: TestimonialData[]; others: ServiceData[] }
    >().props;

    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const variant = getServiceVisualVariant(service.slug, service.icon);
    const Icon = getServiceVisualIcon(variant);
    const ctaUrl = service.cta_url ?? '/contact';

    return (
        <div>
            <PageHeader
                eyebrow="خدمات ما"
                title={service.title}
                subtitle={service.summary ?? service.description}
                actions={
                    <Link
                        href={ctaUrl}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-brand-400 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-brand-300 hover:to-brand-500 active:scale-[0.97]"
                    >
                        <HeartHandshake className="size-4" aria-hidden />
                        {service.cta_text ?? 'رزرو جلسه مشاوره'}
                    </Link>
                }
            />

            {/* ── Overview + features ── */}
            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="container-site relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="flex flex-col gap-5">
                        <div data-variant={variant} className="liquid-card p-7">
                            <span className="liquid-blob blob-a" aria-hidden />
                            <span className="liquid-blob blob-b" aria-hidden />
                            <span className="glass-tile glass-tile-lg">
                                <Icon strokeWidth={1.7} aria-hidden />
                            </span>
                            <h2 className="mt-5 text-xl font-black text-navy">این خدمت شامل چه چیزهایی است؟</h2>
                            {service.description && (
                                <p className="mt-3 text-sm leading-8 text-navy/60">{service.description}</p>
                            )}
                            {service.price ? (
                                <div className="mt-5 flex items-center gap-2 text-sm font-black text-brand-700">
                                    <span>هزینه شروع:</span>
                                    <span className="text-xl">{formatPrice(service.price)}</span>
                                </div>
                            ) : null}
                        </div>

                        {service.target_audience && service.target_audience.length > 0 && (
                            <div className="liquid-card p-7">
                                <span className="liquid-blob blob-b" aria-hidden />
                                <div className="flex items-center gap-2 text-sm font-black text-navy">
                                    <Users className="size-4 text-brand-600" aria-hidden /> مناسب برای
                                </div>
                                <ul className="mt-4 flex flex-col gap-2.5">
                                    {service.target_audience.map((item) => (
                                        <li key={item} className="flex items-center gap-2 text-sm text-navy/65">
                                            <CheckCircle2 className="size-4 shrink-0 text-brand-500" aria-hidden /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" />
                            <span>ویژگی‌ها</span>
                        </div>
                        <h2 className="mt-3 text-2xl font-black text-navy">مزایای این مسیر</h2>
                        <div className="mt-7 grid gap-4 sm:grid-cols-2">
                            {(service.features ?? []).map((feature) => (
                                <div key={feature} className="liquid-card flex items-center gap-3 p-4">
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <span className="glass-tile">
                                        <CheckCircle2 className="size-5" aria-hidden />
                                    </span>
                                    <span className="text-sm font-bold text-navy/80">{feature}</span>
                                </div>
                            ))}
                            {(service.outcomes ?? []).map((outcome) => (
                                <div key={outcome} className="liquid-card flex items-center gap-3 p-4">
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <span className="glass-tile tile-gold">
                                        <Target className="size-5" aria-hidden />
                                    </span>
                                    <span className="text-sm font-bold text-navy/80">{outcome}</span>
                                </div>
                            ))}
                        </div>

                        {service.process && service.process.length > 0 && (
                            <>
                                <div className="hero-kicker mt-10">
                                    <span className="hero-kicker-line" />
                                    <span>روند کار</span>
                                </div>
                                <h2 className="mt-3 text-2xl font-black text-navy">مراحل انجام کار</h2>
                                <div className="mt-6 flex flex-col gap-3">
                                    {service.process.map((step, i) => (
                                        <div key={step} className="liquid-card flex items-center gap-4 p-4">
                                            <span className="liquid-blob blob-a" aria-hidden />
                                            <span className="glass-tile">{formatNumber(i + 1)}</span>
                                            <span className="text-sm font-bold text-navy/80">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            {service.faqs && service.faqs.length > 0 && (
                <section className="relative overflow-hidden bg-soft-gray py-12 md:py-16">
                    <div className="ambient ambient-gold ambient-a" aria-hidden />
                    <div className="container-site relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <div className="hero-kicker">
                                <span className="hero-kicker-line" />
                                <span>سوالات متداول</span>
                            </div>
                            <h2 className="mt-3 text-2xl font-black text-navy md:text-3xl">پاسخ سوال‌های شما</h2>
                            <p className="mt-3 text-sm leading-7 text-navy/55">
                                اگر سوال دیگری دارید، کارشناسان ما آماده پاسخ‌گویی هستند.
                            </p>
                            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800">
                                <MessageCircleQuestion className="size-4" aria-hidden /> پرسیدن سوال
                            </Link>
                        </div>
                        <div className="flex flex-col gap-3">
                            {service.faqs.map((faq, i) => {
                                const open = openFaq === i;
                                return (
                                    <div key={faq.q} className="liquid-card overflow-hidden">
                                        <span className="liquid-blob blob-b" aria-hidden />
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaq(open ? null : i)}
                                            className="flex w-full items-center gap-4 p-5 text-right"
                                            aria-expanded={open}
                                        >
                                            <span className="flex-1 text-sm font-black text-navy">{faq.q}</span>
                                            <ChevronDown className={`size-5 shrink-0 text-navy/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} aria-hidden />
                                        </button>
                                        {open && (
                                            <p className="border-t border-navy/5 px-5 pb-5 pt-3 text-sm leading-7 text-navy/60">
                                                {faq.a}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Testimonials ── */}
            {testimonials.length > 0 && (
                <section className="relative overflow-hidden bg-white py-12 md:py-16">
                    <div className="ambient ambient-green ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <div className="hero-kicker">
                            <span className="hero-kicker-line" />
                            <span>نتایج واقعی</span>
                        </div>
                        <h2 className="mt-3 text-2xl font-black text-navy">خانواده‌ها چه می‌گویند؟</h2>
                        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                            {testimonials.map((t) => (
                                <figure key={t.id} className="liquid-card flex flex-col gap-4 p-6">
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <Quote className="size-6 text-brand-300" aria-hidden />
                                    <blockquote className="flex-1 text-sm leading-7 text-navy/70">«{t.content}»</blockquote>
                                    <figcaption className="flex items-center gap-3 border-t border-navy/5 pt-4">
                                        <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-deep-green text-sm font-black text-white">
                                            {t.name.slice(0, 1)}
                                        </span>
                                        <div>
                                            <div className="text-sm font-black text-navy">{t.name}</div>
                                            <div className="flex items-center gap-1.5 text-xs text-navy/45">
                                                {roleLabels[t.role] ?? t.role}
                                                {t.rating ? (
                                                    <span className="flex items-center gap-0.5 text-gold">
                                                        <Star className="size-3 fill-gold" /> {formatNumber(t.rating)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Other services ── */}
            {others.length > 0 && (
                <section className="relative overflow-hidden bg-soft-gray py-12 md:py-16">
                    <div className="ambient ambient-teal ambient-a" aria-hidden />
                    <div className="container-site relative">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <div className="hero-kicker">
                                    <span className="hero-kicker-line" />
                                    <span>سایر خدمات</span>
                                </div>
                                <h2 className="mt-3 text-2xl font-black text-navy">مسیرهای دیگر رشد</h2>
                            </div>
                            <Link href="/services" className="text-sm font-bold text-brand-700 hover:text-brand-800">
                                همه خدمات ←
                            </Link>
                        </div>
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {others.map((other) => {
                                const otherVariant = getServiceVisualVariant(other.slug, other.icon);
                                const OtherIcon = getServiceVisualIcon(otherVariant);
                                return (
                                    <Link
                                        key={other.id}
                                        href={`/services/${other.slug}`}
                                        data-variant={otherVariant}
                                        className="liquid-card group flex flex-col gap-3.5 p-6"
                                    >
                                        <span className="liquid-blob blob-a" aria-hidden />
                                        <span className="liquid-blob blob-b" aria-hidden />
                                        <span className="glass-tile glass-tile-lg">
                                            <OtherIcon strokeWidth={1.7} aria-hidden />
                                        </span>
                                        <h3 className="text-base font-black text-navy">{other.title}</h3>
                                        <p className="line-clamp-2 text-xs leading-6 text-navy/55">{other.summary}</p>
                                        <span className="service-more mt-auto text-xs font-bold text-brand-700">
                                            مشاهده بیشتر <ArrowLeft className="inline size-3.5" aria-hidden />
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CTA ── */}
            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="container-site">
                    <div className="relative overflow-hidden rounded-[2rem] bg-deep-gradient p-8 text-center md:p-14">
                        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand-400/15 blur-3xl" aria-hidden />
                        <div className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-gold/10 blur-3xl" aria-hidden />
                        <div className="relative mx-auto max-w-2xl">
                            <span className="glass-tile glass-tile-lg mx-auto">
                                <Icon strokeWidth={1.7} aria-hidden />
                            </span>
                            <h2 className="mt-5 text-2xl font-black text-white md:text-3xl">آماده‌اید این مسیر را شروع کنید؟</h2>
                            <p className="mt-3 text-sm leading-7 text-white/65">
                                اولین جلسه ارزیابی رایگان است؛ بدون هیچ تعهدی، مسیر مناسب فرزندتان را بشناسید.
                            </p>
                            <Link
                                href={ctaUrl}
                                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-black text-deep-green shadow-soft transition-all hover:bg-brand-50 active:scale-[0.97]"
                            >
                                {service.cta_text ?? 'رزرو جلسه مشاوره'}
                                <ArrowLeft className="size-5" aria-hidden />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

ServiceShow.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
