/**
 * بازخورد لرزشی خفیف برای موبایل (فقط روی دستگاه‌های لمسی و بدون reduced-motion).
 */
export function vibrate(pattern: number | number[] = 10): void {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    try {
        navigator.vibrate(pattern);
    } catch {
        /* بدون خطا */
    }
}
