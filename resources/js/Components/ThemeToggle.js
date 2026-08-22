import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
const STORAGE_KEY = 'markaz-theme';
const THEME_EVENT = 'markaz-theme-change';
function preferredTheme() {
    if (typeof window === 'undefined')
        return 'light';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light')
        return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
}
export default function ThemeToggle({ compact = false }) {
    const [theme, setTheme] = useState(preferredTheme);
    useEffect(() => {
        applyTheme(theme);
        window.localStorage.setItem(STORAGE_KEY, theme);
        const onThemeChange = (event) => {
            const next = event.detail;
            if (next === 'dark' || next === 'light')
                setTheme(next);
        };
        window.addEventListener(THEME_EVENT, onThemeChange);
        return () => window.removeEventListener(THEME_EVENT, onThemeChange);
    }, [theme]);
    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        window.localStorage.setItem(STORAGE_KEY, next);
        setTheme(next);
        window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
    };
    const isDark = theme === 'dark';
    return (_jsxs("button", { type: "button", onClick: toggle, className: compact ? 'theme-toggle theme-toggle-compact' : 'theme-toggle', "aria-label": isDark ? 'فعال‌کردن حالت روشن' : 'فعال‌کردن حالت شب', title: isDark ? 'حالت روشن' : 'حالت شب', children: [_jsx("span", { className: "theme-toggle-icon", "aria-hidden": true, children: isDark ? _jsx(Sun, { className: "size-4" }) : _jsx(Moon, { className: "size-4" }) }), !compact && _jsx("span", { children: isDark ? 'حالت روشن' : 'حالت شب' })] }));
}
