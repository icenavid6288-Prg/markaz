import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useReveal } from '@/hooks/useReveal';
import { formatNumber } from '@/lib/format';
export function StatCard({ icon: Icon, value, suffix = '', label, dark = false }) {
    const ref = useReveal();
    const [display, setDisplay] = useState(0);
    const started = useRef(false);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const duration = 1200;
                    const start = performance.now();
                    const tick = (now) => {
                        const p = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - p, 3);
                        setDisplay(Math.round(value * eased));
                        if (p < 1)
                            requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            });
        }, { threshold: 0.4 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, value]);
    return (_jsxs("div", { ref: ref, className: `reveal stat-card flex flex-col items-center gap-2 p-5 text-center ${dark ? 'stat-card-dark text-white' : 'text-navy'}`, children: [_jsx("div", { className: `stat-card-icon flex size-10 items-center justify-center ${dark ? 'bg-white/10 text-brand-300' : 'bg-brand-100 text-brand-600'}`, children: _jsx(Icon, { className: "size-6", "aria-hidden": true }) }), _jsxs("div", { className: `text-3xl font-black md:text-4xl ${dark ? 'text-white' : 'text-navy'}`, children: [formatNumber(display), suffix && _jsx("span", { className: "text-lg text-brand-500", children: suffix })] }), _jsx("div", { className: `text-sm font-medium ${dark ? 'text-white/70' : 'text-navy/60'}`, children: label })] }));
}
