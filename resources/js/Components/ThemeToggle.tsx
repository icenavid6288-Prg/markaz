import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'markaz-theme';
const THEME_EVENT = 'markaz-theme-change';

type Theme = 'light' | 'dark';

function preferredTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
    // Keep the first client render deterministic. Reading localStorage or
    // matchMedia during render can disagree with SSR and trigger hydration
    // mismatches; the effect applies the real preference immediately after mount.
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const initialTheme = preferredTheme();
        setMounted(true);
        setTheme(initialTheme);
        applyTheme(initialTheme);
        window.localStorage.setItem(STORAGE_KEY, initialTheme);

        const onThemeChange = (event: Event) => {
            const next = (event as CustomEvent<Theme>).detail;
            if (next === 'dark' || next === 'light') setTheme(next);
        };
        window.addEventListener(THEME_EVENT, onThemeChange);
        return () => window.removeEventListener(THEME_EVENT, onThemeChange);
    }, []);

    useEffect(() => {
        if (mounted) applyTheme(theme);
    }, [mounted, theme]);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        window.localStorage.setItem(STORAGE_KEY, next);
        setTheme(next);
        window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: next }));
    };

    const isDark = mounted && theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggle}
            className={compact ? 'theme-toggle theme-toggle-compact' : 'theme-toggle'}
            aria-label={isDark ? 'فعال‌کردن حالت روشن' : 'فعال‌کردن حالت شب'}
            title={isDark ? 'حالت روشن' : 'حالت شب'}
        >
            <span className="theme-toggle-icon" aria-hidden>
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </span>
            {!compact && <span>{isDark ? 'حالت روشن' : 'حالت شب'}</span>}
        </button>
    );
}
