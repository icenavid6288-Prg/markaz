import { test, expect } from '@playwright/test';

// Same credentials as database/seeders/AdminUserSeeder.php — must exist in the preview DB.
const ADMIN_PHONE = '09330961312';

/**
 * Log in through the administrator SMS code flow (dev code is shown in local/testing).
 */
async function loginAsAdmin(page) {
    await page.goto('/admin/login');
    await page.fill('#phone', ADMIN_PHONE);
    await page.getByRole('button', { name: 'دریافت کد ورود' }).click();
    await page.waitForURL(/step=code/);
    const banner = page.locator('text=کد تستی');
    await expect(banner).toBeVisible();
    const match = (await banner.innerText()).match(/(\d{6})/);
    if (!match) {
        throw new Error('کد تستی ورود مدیران در صفحه پیدا نشد.');
    }
    await page.fill('#code', match[1]);
    await page.getByRole('button', { name: 'ورود به پنل مدیریت' }).click();
    await page.waitForURL(/\/admin$/);
}

// Login once for the whole file and reuse the session across tests so the
// per-phone rate limiter is hit a single time per run.
let storageState;

test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAsAdmin(page);
    storageState = await context.storageState();
    await context.close();
});

async function adminPage(browser) {
    const context = await browser.newContext({ storageState });
    return { context, page: await context.newPage() };
}

// The AdminLayout renders its `title` as the banner h1, so these identify the
// page without depending on Persian zero-width non-joiner (نیمفاصله) spelling.
const PAGE_HEADINGS = {
    site: { level: 1, name: 'تنظیمات سایت' },
    sms: { level: 1, name: 'پنل پیامک' },
    payments: { level: 1, name: 'درگاه پرداخت' },
    automations: { level: 1, name: 'اتصالات و پیگیری خودکار' },
};

test.describe('admin settings', () => {
    test('لنگر قدیمی #sms به صفحه پنل پیامک منتقل میشود', async ({ browser }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop', 'این تست تابعی فقط روی پروژه دسکتاپ اجرا میشود');
        const { context, page } = await adminPage(browser);
        try {
            await page.goto('/admin/settings#sms');
            await page.waitForURL('**/admin/settings/sms');
            await expect(page.getByRole('heading', PAGE_HEADINGS.sms)).toBeVisible();
            await expect(page.getByText(/وضعیت اتصال سرویس/)).toBeVisible();
        } finally {
            await context.close();
        }
    });

    test('لنگر قدیمی #payment به صفحه درگاه پرداخت منتقل میشود', async ({ browser }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop', 'این تست تابعی فقط روی پروژه دسکتاپ اجرا میشود');
        const { context, page } = await adminPage(browser);
        try {
            await page.goto('/admin/settings#payment');
            await page.waitForURL('**/admin/settings/payments');
            await expect(page.getByRole('heading', PAGE_HEADINGS.payments)).toBeVisible();
            await expect(page.getByText(/وضعیت اتصال درگاه/)).toBeVisible();
        } finally {
            await context.close();
        }
    });

    test('لنگر قدیمی #winback به صفحه اتصالات و پیگیری خودکار منتقل میشود', async ({ browser }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop', 'این تست تابعی فقط روی پروژه دسکتاپ اجرا میشود');
        const { context, page } = await adminPage(browser);
        try {
            await page.goto('/admin/settings#winback');
            await page.waitForURL('**/admin/settings/automations');
            await expect(page.getByRole('heading', PAGE_HEADINGS.automations)).toBeVisible();
            await expect(page.getByRole('heading', { name: 'اتصال به کانال ایتا' })).toBeVisible();
        } finally {
            await context.close();
        }
    });

    test('لنگرهای درونصفحهای مثل #brand در صفحه تنظیمات سایت میمانند', async ({ browser }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop', 'این تست تابعی فقط روی پروژه دسکتاپ اجرا میشود');
        const { context, page } = await adminPage(browser);
        try {
            await page.goto('/admin/settings#brand');
            await expect(page.getByRole('heading', PAGE_HEADINGS.site)).toBeVisible();
            await page.waitForTimeout(600); // فرصت اجرای اثر ریدایرکت
            expect(new URL(page.url()).pathname).toBe('/admin/settings');
            await expect(page.getByRole('heading', { name: 'برند' })).toBeVisible();
        } finally {
            await context.close();
        }
    });

    test('فیلد کلید API ملی‌پیامک در پنل پیامک نمایش داده می‌شود', async ({ browser }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop', 'این تست تابعی فقط روی پروژه دسکتاپ اجرا میشود');
        const { context, page } = await adminPage(browser);
        try {
            await page.goto('/admin/settings/sms');
            await expect(page.getByRole('heading', PAGE_HEADINGS.sms)).toBeVisible();
            await expect(page.getByLabel('کلید API ملی‌پیامک (اختیاری)')).toBeVisible();
            await expect(page.getByLabel('کلید API ملی‌پیامک (پشتیبان، اختیاری)')).toBeVisible();
        } finally {
            await context.close();
        }
    });

    test('هر چهار صفحه جدید تنظیمات رندر میشوند', async ({ browser }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop', 'این تست تابعی فقط روی پروژه دسکتاپ اجرا میشود');
        const { context, page } = await adminPage(browser);
        try {
            await page.goto('/admin/settings');
            await expect(page.getByRole('heading', PAGE_HEADINGS.site)).toBeVisible();
            await expect(page.getByRole('heading', { name: 'برند' })).toBeVisible();
            await expect(page.getByRole('heading', { name: 'نماد اعتماد الکترونیکی' })).toBeVisible();

            await page.goto('/admin/settings/sms');
            await expect(page.getByRole('heading', PAGE_HEADINGS.sms)).toBeVisible();
            await expect(page.getByText(/وضعیت اتصال سرویس/)).toBeVisible();

            await page.goto('/admin/settings/payments');
            await expect(page.getByRole('heading', PAGE_HEADINGS.payments)).toBeVisible();
            await expect(page.getByText(/وضعیت اتصال درگاه/)).toBeVisible();

            await page.goto('/admin/settings/automations');
            await expect(page.getByRole('heading', PAGE_HEADINGS.automations)).toBeVisible();
            await expect(page.getByRole('heading', { name: 'اتصال به کانال ایتا' })).toBeVisible();
        } finally {
            await context.close();
        }
    });
});
