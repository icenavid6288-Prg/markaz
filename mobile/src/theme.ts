export const colors = {
    primary: '#087f52',
    primaryDark: '#065f3d',
    primarySoft: '#e3f2ea',
    accent: '#e3c56b',
    bg: '#f5faf7',
    surface: '#ffffff',
    text: '#12251d',
    muted: '#5b6f66',
    border: '#d7e8df',
    danger: '#b3261e',
    dangerSoft: '#fdeceb',
    gold: '#b8860b',
    white: '#ffffff',
    overlay: 'rgba(8, 37, 28, 0.72)',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const typography = {
    hero: { fontSize: 24, fontWeight: '800' as const },
    title: { fontSize: 20, fontWeight: '800' as const },
    heading: { fontSize: 16, fontWeight: '700' as const },
    body: { fontSize: 14, fontWeight: '400' as const },
    small: { fontSize: 12, fontWeight: '400' as const },
    tiny: { fontSize: 11, fontWeight: '400' as const },
};

/** Format a number with Persian digits (e.g. ۱۲٬۵۰۰). */
export function faNum(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString('fa-IR');
}

/** تومان formatting. */
export function price(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'رایگان';
    if (value === 0) return 'رایگان';
    return `${faNum(value)} تومان`;
}
