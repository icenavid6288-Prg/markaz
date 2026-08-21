import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_DIR = path.join(__dirname, '..', 'baselines');

/**
 * Captures a full-page screenshot and compares it pixel-by-pixel with the
 * committed baseline. On the first run (or with `updateSnapshots`), the
 * baseline is written instead of compared.
 *
 * We intentionally do NOT use Playwright's `toHaveScreenshot`: its internal
 * stability retry loop never settles on these long RTL pages even though the
 * page is pixel-identical between manual captures.
 */
export async function assertScreenshot(page, name, { project, updateSnapshots = false, maxDiffRatio = 0.0005 } = {}) {
    const shot = await page.screenshot({ fullPage: true });
    const file = path.join(BASELINE_DIR, `${name}-${project}.png`);
    mkdirSync(BASELINE_DIR, { recursive: true });

    // Playwright's config.updateSnapshots is `'missing'` by default: create
    // missing baselines but keep comparing existing ones. An explicit
    // `--update-snapshots` arrives as `'changed'` (or `'all'`/true) and
    // overwrites the baselines.
    const overwrite = updateSnapshots === true || updateSnapshots === 'all' || updateSnapshots === 'changed';

    if (!existsSync(file) || overwrite) {
        writeFileSync(file, shot);
        console.log(`[visual] ${overwrite ? 'updated' : 'wrote'} baseline ${path.basename(file)}`);
        return;
    }

    const expected = PNG.sync.read(readFileSync(file));
    const actual = PNG.sync.read(shot);

    if (expected.width !== actual.width || expected.height !== actual.height) {
        throw new Error(`[visual] size changed for ${name}: baseline ${expected.width}x${expected.height}, now ${actual.width}x${actual.height}. Run "npm run visual:update" if this is intentional.`);
    }

    const { width, height, data: ed } = expected;
    const { data: ad } = actual;
    let diffPixels = 0;

    for (let i = 0; i < ed.length; i += 4) {
        if (Math.abs(ed[i] - ad[i]) + Math.abs(ed[i + 1] - ad[i + 1]) + Math.abs(ed[i + 2] - ad[i + 2]) > 24) {
            diffPixels++;
        }
    }

    const ratio = diffPixels / (width * height);

    if (ratio > maxDiffRatio) {
        const outDir = path.join('test-results', 'visual');
        mkdirSync(outDir, { recursive: true });

        const diff = new PNG({ width, height });
        for (let i = 0; i < ed.length; i += 4) {
            const changed = Math.abs(ed[i] - ad[i]) + Math.abs(ed[i + 1] - ad[i + 1]) + Math.abs(ed[i + 2] - ad[i + 2]) > 24;
            diff.data[i] = changed ? 255 : ed[i];
            diff.data[i + 1] = changed ? 0 : ed[i + 1];
            diff.data[i + 2] = changed ? 0 : ed[i + 2];
            diff.data[i + 3] = 255;
        }

        writeFileSync(path.join(outDir, `${name}-${project}-diff.png`), PNG.sync.write(diff));
        writeFileSync(path.join(outDir, `${name}-${project}-actual.png`), shot);

        throw new Error(
            `[visual] regression on ${name}: ${(ratio * 100).toFixed(2)}% pixels differ (> ${(maxDiffRatio * 100).toFixed(2)}%). ` +
            `See test-results/visual/${name}-${project}-diff.png`
        );
    }
}
