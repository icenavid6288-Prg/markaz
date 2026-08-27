import { useEffect, useState } from 'react';
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
/**
 * Typewriter سبک: متن را کلمه‌به‌کلمه تایپ می‌کند (برای فارسی خواناتر از حرف‌به‌حرف است).
 * اگر کاربر reduced-motion داشته باشد، کل متن یکجا نمایش داده می‌شود.
 */
export function useTypewriter(text, { speed = 220, startDelay = 400 } = {}) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const [count, setCount] = useState(prefersReducedMotion() ? words.length : 0);
    const [done, setDone] = useState(prefersReducedMotion() ? words.length > 0 : false);
    const [caret, setCaret] = useState(!prefersReducedMotion() && words.length > 0);
    useEffect(() => {
        if (words.length === 0) {
            setDone(true);
            setCaret(false);
            return;
        }
        if (prefersReducedMotion()) {
            setCount(words.length);
            setDone(true);
            setCaret(false);
            return;
        }
        setCount(0);
        setDone(false);
        setCaret(true);
        let interval;
        const start = window.setTimeout(() => {
            interval = window.setInterval(() => {
                setCount((prev) => {
                    const next = prev + 1;
                    if (next >= words.length) {
                        if (interval)
                            clearInterval(interval);
                        setDone(true);
                        window.setTimeout(() => setCaret(false), 900);
                    }
                    return next;
                });
            }, speed);
        }, startDelay);
        return () => {
            window.clearTimeout(start);
            if (interval)
                window.clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);
    return {
        typed: words.slice(0, count).join(' '),
        done,
        caret,
    };
}
