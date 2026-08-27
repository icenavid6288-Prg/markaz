import { defineConfig, devices } from '@playwright/test';

// The visual suite renders the real app against the preview SQLite database so
// the pages contain the same seeded content every run. Point VISUAL_DB at any
// other SQLite dump if you want to compare against different content.
const dbPath = process.env.VISUAL_DB ?? 'C:/xampp/htdocs/markaz/.freebuff/preview.sqlite';

const port = Number(process.env.VISUAL_PORT ?? 8010);
const phpBin = process.env.VISUAL_PHP ?? 'C:/xampp/php/php.exe';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
    testDir: './tests/visual',
    timeout: 90_000,
    fullyParallel: false,
    workers: 1,
    reporter: [['list']],
    use: {
        baseURL,
        locale: 'fa-IR',
    },
    // Snapshot comparison is handled by tests/visual/lib/snapshot.js — a
    // deterministic pixel diff against committed baselines — because Playwright's
    // built-in toHaveScreenshot stability loop never settles on these pages.
    projects: [
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
        },
        {
            name: 'mobile',
            use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
        },
        {
            name: 'tablet',
            use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 },
        },
    ],
    webServer: {
        // The default .env points at MySQL; the app must boot against SQLite here.
        // Playwright launches this via cmd.exe on Windows, so use the full PHP path.
        command: `"${phpBin}" artisan serve --host=127.0.0.1 --port=${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 60_000,
        env: {
            DB_CONNECTION: 'sqlite',
            DB_DATABASE: dbPath,
            APP_URL: baseURL,
            SESSION_DRIVER: 'file',
            CACHE_STORE: 'file',
            QUEUE_CONNECTION: 'sync',
        },
    },
});
