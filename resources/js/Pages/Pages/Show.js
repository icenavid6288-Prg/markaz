import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { PageHeader } from '@/Components/ui/PageHeader';
export default function CmsPageShow({ page }) {
    return (_jsxs("div", { children: [_jsx(Head, { title: page.title }), _jsx(PageHeader, { eyebrow: "\u0635\u0641\u062D\u0647", title: page.title }), _jsx("section", { className: "relative overflow-hidden bg-white py-12 md:py-16", children: _jsxs("div", { className: "container-site mx-auto flex max-w-3xl flex-col gap-8", children: [page.sections.length === 0 && _jsx("p", { className: "text-sm font-bold text-navy/50", children: "\u0645\u062D\u062A\u0648\u0627\u06CC\u06CC \u0628\u0631\u0627\u06CC \u0627\u06CC\u0646 \u0635\u0641\u062D\u0647 \u062B\u0628\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A." }), page.sections.map((section, index) => (_jsxs("article", { className: "liquid-card p-6", children: [section.image && _jsx("img", { src: section.image, alt: section.title || page.title, className: "mb-5 aspect-video w-full rounded-2xl object-cover" }), section.title && _jsx("h2", { className: "text-xl font-black text-navy", children: section.title }), section.body && _jsx("p", { className: "mt-3 whitespace-pre-line text-sm leading-8 text-navy/70", children: section.body })] }, `${section.title}-${index}`)))] }) })] }));
}
CmsPageShow.layout = (page) => _jsx(PublicLayout, { children: page });
