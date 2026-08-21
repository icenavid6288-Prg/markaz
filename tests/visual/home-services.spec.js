import { test } from '@playwright/test';
import { assertScreenshot } from './lib/snapshot.js';

const THEMES = ['light', 'dark'];
const PAGES = [
    { path: '/', name: 'home' },
    { path: '/services', name: 'services' },
    { path: '/courses', name: 'courses' },
    { path: '/courses/talent-discovery-course', name: 'course-detail' },
    { path: '/shop', name: 'shop' },
    { path: '/blog', name: 'blog' },
];

// Stable, deterministic page state before every navigation:
//  - force the requested theme (the app reads `markaz-theme` on boot)
//  - dismiss the site popup so it never covers the screenshots
//  - freeze CSS animations/transitions (Playwright's own mechanism can fight
//    the page, so we do it ourselves)
//  - force scroll-reveal sections visible (they start at opacity 0)
//  - blur any focused field so the caret blink can't shift pixels
for (const theme of THEMES) {
    for (const { path, name } of PAGES) {
        test(`${theme} ${name}`, async ({ page }, testInfo) => {
            await page.addInitScript((t) => {
                window.localStorage.setItem('markaz-theme', t);
                window.localStorage.setItem('markaz-site-popup-dismissed', new Date().toISOString().slice(0, 10));
                window.sessionStorage.setItem('markaz-site-popup-dismissed', '1');
            }, theme);

            await page.goto(path, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.fonts.ready);
            await page.addStyleTag({
                content:
                    '.reveal { opacity: 1 !important; transform: none !important; }' +
                    '*, *::before, *::after { animation: none !important; transition: none !important; }',
            });
            await page.evaluate(() => {
                if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            });

            // Let fixed elements and the layout settle before capturing.
            await page.waitForTimeout(400);

            await assertScreenshot(page, `${theme}-${name}`, {
                project: testInfo.project.name,
                updateSnapshots: testInfo.config.updateSnapshots,
            });
        });
    }
}
