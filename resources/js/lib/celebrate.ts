import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#f97316', '#2c9a6c', '#c9a227', '#ea580c', '#1d7b56', '#e3c56b'];

/** انفجار کانفتی جشن با رنگ‌های برند (نارنجی، سبز، طلایی). */
export function celebrate(): void {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const burst = { particleCount: 90, spread: 80, startVelocity: 42, scalar: 0.95, ticks: 220, colors: BRAND_COLORS, zIndex: 200 };

    confetti({ ...burst, origin: { x: 0.5, y: 0.55 } });
    window.setTimeout(() => {
        confetti({ ...burst, particleCount: 55, spread: 120, origin: { x: 0.2, y: 0.5 }, angle: 60 });
        confetti({ ...burst, particleCount: 55, spread: 120, origin: { x: 0.8, y: 0.5 }, angle: 120 });
    }, 220);
}
