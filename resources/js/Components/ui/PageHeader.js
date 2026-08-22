import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePage } from '@inertiajs/react';
import { Award, BookOpen, Boxes, Compass, FlaskConical, GraduationCap, HeartHandshake, Lightbulb, MessageCircle, Newspaper, Phone, Rocket, Route, ShoppingBag, Sparkles, Target, Users } from 'lucide-react';
const icons = {
    Award, BookOpen, Boxes, Compass, FlaskConical, GraduationCap, HeartHandshake, Lightbulb, MessageCircle, Newspaper, Phone, Rocket, Route, ShoppingBag, Sparkles, Target, Users,
};
export function PageHeader({ eyebrow, title, subtitle, actions }) {
    const { pageContent } = usePage().props;
    const fields = pageContent?.fields ?? {};
    const value = (key, fallback) => fields[key]?.value?.trim() || fallback;
    const eyebrowValue = value('hero_eyebrow', eyebrow);
    const titleValue = value('hero_title', title);
    const subtitleValue = value('hero_subtitle', subtitle ?? '');
    const HeroIcon = icons[value('hero_icon', 'Sparkles')] ?? Sparkles;
    return (_jsxs("section", { className: "reference-hero relative overflow-hidden pb-16 pt-28 md:pb-20 md:pt-36", children: [_jsx("div", { className: "pointer-events-none absolute -left-24 top-8 size-80 rounded-full bg-brand-400/15 blur-3xl", "aria-hidden": true }), _jsx("div", { className: "pointer-events-none absolute -right-20 bottom-0 size-64 rounded-full bg-gold/10 blur-3xl", "aria-hidden": true }), _jsxs("div", { className: "container-site relative", children: [_jsxs("div", { className: "hero-kicker", children: [_jsx("span", { className: "hero-kicker-line" }), _jsx(HeroIcon, { className: "size-3.5 text-brand-300", "aria-hidden": true }), _jsx("span", { children: eyebrowValue })] }), _jsx("h1", { className: "mt-4 max-w-3xl text-4xl font-black leading-[1.3] text-white md:text-6xl md:leading-[1.25]", children: titleValue }), subtitleValue && _jsx("p", { className: "mt-4 max-w-2xl text-sm leading-8 text-white/70 md:text-base md:leading-9", children: subtitleValue }), actions && _jsx("div", { className: "mt-7 flex flex-wrap items-center gap-3", children: actions })] })] }));
}
