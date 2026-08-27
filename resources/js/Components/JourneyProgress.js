import { jsx as _jsx } from "react/jsx-runtime";
import { useScrollProgress } from '@/hooks/useScrollProgress';
/**
 * «سفر قهرمانی»: نوار پیشرفت باریکی که با اسکرول صفحه پر می‌شود
 * تا کاربر حس کند در مسیر «درخشش» جلو می‌رود.
 */
export default function JourneyProgress() {
    const progress = useScrollProgress();
    return (_jsx("div", { className: "journey-progress", role: "progressbar", "aria-label": "\u067E\u06CC\u0634\u0631\u0641\u062A \u0645\u0633\u06CC\u0631", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(progress * 100), children: _jsx("span", { className: "journey-progress-fill", style: { width: `${progress * 100}%` } }) }));
}
