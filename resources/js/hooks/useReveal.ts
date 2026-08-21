import { useEffect, useRef } from 'react';

/**
 * Scroll-reveal سبک و Performance-Friendly با IntersectionObserver.
 * استفاده: const ref = useReveal();  →  <div ref={ref} className="reveal">
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [options]);

    return ref;
}
