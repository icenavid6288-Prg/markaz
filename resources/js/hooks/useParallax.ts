import { useEffect, useRef } from 'react';

/**
 * پارالکس سبک: عنصر را با سرعت متفاوت از اسکرول جابه‌جا می‌کند.
 * فقط روی دسکتاپ و بدون reduced-motion فعال می‌شود.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(speed = 0.12) {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        if (window.innerWidth < 768) return;

        let raf = 0;
        const update = () => {
            raf = 0;
            const rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;
            const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
            el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            if (raf) cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            el.style.transform = '';
        };
    }, [speed]);

    return ref;
}
