import { usePage } from '@inertiajs/react';
import { Award, BookOpen, Boxes, Compass, FlaskConical, GraduationCap, HeartHandshake, Lightbulb, MessageCircle, Newspaper, Phone, Rocket, Route, ShoppingBag, Sparkles, Target, Users, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PageProps } from '@/types';

interface PageHeaderProps {
    eyebrow: string;
    title: string;
    subtitle?: string | null;
    actions?: ReactNode;
}

const icons: Record<string, LucideIcon> = {
    Award, BookOpen, Boxes, Compass, FlaskConical, GraduationCap, HeartHandshake, Lightbulb, MessageCircle, Newspaper, Phone, Rocket, Route, ShoppingBag, Sparkles, Target, Users,
};

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
    const { pageContent } = usePage<PageProps & { pageContent?: { fields?: Record<string, { value?: string }> } | null }>().props;
    const fields = pageContent?.fields ?? {};
    const value = (key: string, fallback: string) => fields[key]?.value?.trim() || fallback;
    const eyebrowValue = value('hero_eyebrow', eyebrow);
    const titleValue = value('hero_title', title);
    const subtitleValue = value('hero_subtitle', subtitle ?? '');
    const HeroIcon = icons[value('hero_icon', 'Sparkles')] ?? Sparkles;

    return (
        <section className="reference-hero relative overflow-hidden pb-16 pt-28 md:pb-20 md:pt-36">
            <div className="pointer-events-none absolute -left-24 top-8 size-80 rounded-full bg-brand-400/15 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -right-20 bottom-0 size-64 rounded-full bg-gold/10 blur-3xl" aria-hidden />
            <div className="container-site relative">
                <div className="hero-kicker">
                    <span className="hero-kicker-line" />
                    <HeroIcon className="size-3.5 text-brand-300" aria-hidden />
                    <span>{eyebrowValue}</span>
                </div>
                <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.3] text-white md:text-6xl md:leading-[1.25]">
                    {titleValue}
                </h1>
                {subtitleValue && <p className="mt-4 max-w-2xl text-sm leading-8 text-white/70 md:text-base md:leading-9">{subtitleValue}</p>}
                {actions && <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>}
            </div>
        </section>
    );
}
