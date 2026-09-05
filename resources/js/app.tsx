import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { vibrate } from '@/lib/haptics';

// بازخورد لمسی خفیف روی دکمه‌ها/لینک‌ها برای دستگاه‌های لمسی (موبایل).
if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    document.addEventListener(
        'touchstart',
        (event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('button, a')) vibrate(8);
        },
        { passive: true },
    );
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Apply the stored theme before Inertia mounts so dark pages do not flash white.
if (typeof window !== 'undefined') {
    const savedTheme = window.localStorage.getItem('markaz-theme');
    const shouldUseDark = savedTheme === 'dark' || (savedTheme !== 'light' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', shouldUseDark);
    document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light';

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => registration.update())
                .catch(() => undefined);
        });
    }
}

createInertiaApp({
    // Match the server-generated CSP nonce for dynamic Inertia head elements.
    nonce: typeof document !== 'undefined'
        ? document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content
        : undefined,
    // Public pages provide their complete, database-driven SEO title through <SeoHead>.
    title: (title) => title || appName,
});
