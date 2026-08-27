import { useScrollProgress } from '@/hooks/useScrollProgress';

/**
 * «سفر قهرمانی»: نوار پیشرفت باریکی که با اسکرول صفحه پر می‌شود
 * تا کاربر حس کند در مسیر «درخشش» جلو می‌رود.
 */
export default function JourneyProgress() {
    const progress = useScrollProgress();

    return (
        <div
            className="journey-progress"
            role="progressbar"
            aria-label="پیشرفت مسیر"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
        >
            <span className="journey-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
    );
}
