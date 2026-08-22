import { jsx as _jsx } from "react/jsx-runtime";
const tones = {
    brand: 'bg-brand-100 text-brand-800 ring-brand-200',
    gold: 'bg-[#f7eed2] text-[#7a5f12] ring-[#e6d491]',
    navy: 'bg-navy/5 text-navy ring-navy/10',
    gray: 'bg-soft-gray text-navy/70 ring-navy/10',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
};
export function Badge({ tone = 'brand', children, className = '' }) {
    return (_jsx("span", { className: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tones[tone]} ${className}`, children: children }));
}
