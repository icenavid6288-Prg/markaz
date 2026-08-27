import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
function pageUrl(path, page, filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value)
            params.set(key, value);
    });
    if (page > 1)
        params.set('page', String(page));
    const query = params.toString();
    return query ? `${path}?${query}` : path;
}
export function Pagination({ meta, path, filters = {} }) {
    if (meta.last_page <= 1)
        return null;
    const start = Math.max(1, Math.min(meta.current_page - 2, meta.last_page - 4));
    const end = Math.min(meta.last_page, start + 4);
    const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);
    return (_jsxs("nav", { className: "mt-10 flex flex-wrap items-center justify-center gap-2", "aria-label": "\u0635\u0641\u062D\u0647\u200C\u0628\u0646\u062F\u06CC", children: [_jsx(Link, { href: pageUrl(path, Math.max(1, meta.current_page - 1), filters), preserveScroll: true, preserveState: true, className: `flex size-10 items-center justify-center rounded-xl border text-navy transition-colors ${meta.current_page === 1
                    ? 'pointer-events-none border-navy/5 bg-navy/5 opacity-35'
                    : 'border-navy/10 bg-white hover:border-brand-300 hover:text-brand-700'}`, "aria-label": "\u0635\u0641\u062D\u0647 \u0642\u0628\u0644", children: _jsx(ChevronRight, { className: "size-4", "aria-hidden": true }) }), pages.map((page) => (_jsx(Link, { href: pageUrl(path, page, filters), preserveScroll: true, preserveState: true, className: `flex size-10 items-center justify-center rounded-xl text-sm font-black transition-colors ${page === meta.current_page
                    ? 'bg-deep-green text-white shadow-soft'
                    : 'border border-navy/10 bg-white text-navy/60 hover:border-brand-300 hover:text-brand-700'}`, "aria-current": page === meta.current_page ? 'page' : undefined, children: page.toLocaleString('fa-IR') }, page))), _jsx(Link, { href: pageUrl(path, Math.min(meta.last_page, meta.current_page + 1), filters), preserveScroll: true, preserveState: true, className: `flex size-10 items-center justify-center rounded-xl border text-navy transition-colors ${meta.current_page === meta.last_page
                    ? 'pointer-events-none border-navy/5 bg-navy/5 opacity-35'
                    : 'border-navy/10 bg-white hover:border-brand-300 hover:text-brand-700'}`, "aria-label": "\u0635\u0641\u062D\u0647 \u0628\u0639\u062F", children: _jsx(ChevronLeft, { className: "size-4", "aria-hidden": true }) })] }));
}
