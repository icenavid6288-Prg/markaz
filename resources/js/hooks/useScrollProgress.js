import { useEffect, useState } from 'react';
/** پیشرفت اسکرول کل صفحه به‌صورت عددی بین ۰ و ۱ (با requestAnimationFrame). */
export function useScrollProgress() {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        let raf = 0;
        const update = () => {
            raf = 0;
            const doc = document.documentElement;
            const max = doc.scrollHeight - window.innerHeight;
            setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
        };
        const onScroll = () => {
            if (!raf)
                raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            if (raf)
                cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);
    return progress;
}
