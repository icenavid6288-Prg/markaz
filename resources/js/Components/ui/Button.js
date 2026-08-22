import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Loader2 } from 'lucide-react';
const variants = {
    primary: 'bg-gradient-to-l from-brand-600 to-brand-500 text-white shadow-glow hover:from-brand-700 hover:to-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
    secondary: 'bg-deep-green text-white hover:bg-brand-900 shadow-soft',
    ghost: 'text-brand-700 hover:bg-brand-50',
    gold: 'bg-gradient-to-l from-[#d9b94e] to-gold text-white hover:opacity-90 shadow-soft',
    outline: 'border border-brand-200 text-brand-700 bg-white hover:border-brand-400 hover:bg-brand-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
};
const sizes = {
    sm: 'px-3.5 py-2 text-sm rounded-xl gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-7 py-3.5 text-base rounded-2xl gap-2',
};
export function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props }) {
    return (_jsxs("button", { className: `inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`, disabled: disabled || loading, ...props, children: [loading && _jsx(Loader2, { className: "size-4 animate-spin", "aria-hidden": true }), children] }));
}
