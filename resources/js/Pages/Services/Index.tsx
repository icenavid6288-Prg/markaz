import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Compass } from 'lucide-react';
import type { ReactNode } from 'react';
import { getServiceVisualIcon, getServiceVisualVariant } from '@/Components/ServiceVisual';
import { PageHeader } from '@/Components/ui/PageHeader';
import { formatPrice } from '@/lib/format';
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
    cta_text?: string | null;
    cta_url?: string | null;
}

export default function ServicesIndex() {
    const { services } = usePage<PageProps & { services: ServiceData[] }>().props;

    return (
        <div>
            <PageHeader
                eyebrow="خدمات ما"
                title="راهکارهای جامع برای هر مرحله از مسیر رشد"
                subtitle="از ارزیابی علمی استعداد تا کوچینگ تخصصی و تربیت مدرس؛ هر خدمت با یک برنامه مشخص و پشتیبانی مستمر."
                actions={
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-brand-400 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-glow transition-all hover:from-brand-300 hover:to-brand-500"
                    >
                        <Compass className="size-4" aria-hidden />
                        دریافت مشاوره رایگان
                    </Link>
                }
            />

            <section className="relative overflow-hidden bg-white py-12 md:py-16">
                <div className="ambient ambient-green ambient-a" aria-hidden />
                <div className="ambient ambient-gold ambient-b" aria-hidden />
                <div className="container-site relative">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {services.map((service) => {
                            const variant = getServiceVisualVariant(service.slug, service.icon);
                            const Icon = getServiceVisualIcon(variant);
                            return (
                                <Link
                                    key={service.id}
                                    href={`/services/${service.slug}`}
                                    data-variant={variant}
                                    className="liquid-card group flex flex-col gap-4 p-6 md:p-7"
                                >
                                    <span className="liquid-blob blob-a" aria-hidden />
                                    <span className="liquid-blob blob-b" aria-hidden />
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="glass-tile glass-tile-lg">
                                            <Icon strokeWidth={1.7} aria-hidden />
                                        </span>
                                        {service.price ? (
                                            <span className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-black text-brand-700">
                                                {formatPrice(service.price)}
                                            </span>
                                        ) : null}
                                    </div>
                                    <h2 className="text-lg font-black text-navy">{service.title}</h2>
                                    <p className="line-clamp-2 text-sm leading-7 text-navy/55">
                                        {service.summary ?? service.description}
                                    </p>
                                    {service.features && service.features.length > 0 && (
                                        <ul className="flex flex-col gap-2">
                                            {service.features.slice(0, 3).map((feature) => (
                                                <li key={feature} className="flex items-center gap-2 text-xs font-bold text-navy/60">
                                                    <CheckCircle2 className="size-3.5 shrink-0 text-brand-500" aria-hidden />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <span className="service-more mt-auto pt-2 text-sm font-bold text-brand-700">
                                        {service.cta_text ?? 'مشاهده جزئیات'} <ArrowLeft className="inline size-4" aria-hidden />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}

ServicesIndex.layout = (page: ReactNode) => <PublicLayout>{page}</PublicLayout>;
