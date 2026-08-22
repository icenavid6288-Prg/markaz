import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export function ReadingProgress({ targetRef }) {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        let frame = 0;
        const update = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const article = targetRef.current;
                if (!article)
                    return;
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
    return (_jsxs("div", { className: "reading-progress", role: "progressbar", "aria-label": "\u067E\u06CC\u0634\u0631\u0641\u062A \u0645\u0637\u0627\u0644\u0639\u0647 \u0645\u0642\u0627\u0644\u0647", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": percentage, children: [_jsx("span", { className: "reading-progress-fill", style: { width: `${percentage}%` } }), _jsxs("span", { className: "sr-only", children: [percentage, "% \u0627\u0632 \u0645\u0642\u0627\u0644\u0647 \u0645\u0637\u0627\u0644\u0639\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A"] })] }));
}
