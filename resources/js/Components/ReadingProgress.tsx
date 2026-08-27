import { useEffect, useState, type RefObject } from 'react';

interface ReadingProgressProps {
    targetRef: RefObject<HTMLElement | null>;
}

export function ReadingProgress({ targetRef }: ReadingProgressProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let frame = 0;

        const update = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const article = targetRef.current;
                if (!article) return;

                const articleTop = article.getBoundingClientRect().top + window.scrollY;
                const articleHeight = article.offsetHeight;
                const viewportProgressPoint = window.scrollY + window.innerHeight * 0.72;
                const readableHeight = Math.max(1, articleHeight - window.innerHeight * 0.72);
                const nextProgress = Math.min(1, Math.max(0, (viewportProgressPoint - articleTop) / readableHeight));
                setProgress(nextProgress);
            });
        };

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [targetRef]);

    const percentage = Math.round(progress * 100);

    return (
        <div className="reading-progress" role="progressbar" aria-label="پیشرفت مطالعه مقاله" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
            <span className="reading-progress-fill" style={{ width: `${percentage}%` }} />
            <span className="sr-only">{percentage}% از مقاله مطالعه شده است</span>
        </div>
    );
}
