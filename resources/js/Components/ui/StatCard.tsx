import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { formatNumber } from '@/lib/format';

interface StatCardProps {
    icon: LucideIcon;
    value: number;
    suffix?: string;
    label: string;
    dark?: boolean;
}

export function StatCard({ icon: Icon, value, suffix = '', label, dark = false }: StatCardProps) {
    const ref = useReveal<HTMLDivElement>();
    const [display, setDisplay] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const duration = 1200;
                    const start = performance.now();
                    const tick = (now: number) => {
                        const p = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - p, 3);
                        setDisplay(Math.round(value * eased));
                        if (p < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            });
        }, { threshold: 0.4 });

        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, value]);

    return (
        <div
            ref={ref}
            className={`reveal stat-card flex flex-col items-center gap-2 p-5 text-center ${
                dark ? 'stat-card-dark text-white' : 'text-navy'
            }`}
        >
            <div
                className={`stat-card-icon flex size-10 items-center justify-center ${
                    dark ? 'bg-white/10 text-brand-300' : 'bg-brand-100 text-brand-600'
                }`}
            >
                <Icon className="size-6" aria-hidden />
            </div>
            <div className={`text-3xl font-black md:text-4xl ${dark ? 'text-white' : 'text-navy'}`}>
                {formatNumber(display)}
                {suffix && <span className="text-lg text-brand-500">{suffix}</span>}
            </div>
            <div className={`text-sm font-medium ${dark ? 'text-white/70' : 'text-navy/60'}`}>{label}</div>
        </div>
    );
}
