'use strict';

// Rasterizes the site's PWA icon (public/images/pwa-icon.svg) into PNG sizes
// used by the desktop app and electron-builder. Run with: npm run icon

const { app, BrowserWindow, nativeImage } = require('electron');

app.disableHardwareAcceleration();

const watchdog = setTimeout(() => {
    console.error('ICON_TIMEOUT');
    app.exit(2);
}, 60000);
const path = require('node:path');
const fs = require('node:fs');

const SVG_SRC = path.join(__dirname, '..', '..', 'public', 'images', 'pwa-icon.svg');
const OUT_DIR = path.join(__dirname, '..', 'icons');
const SIZES = [1024, 512, 256, 64, 32];

app.whenReady().then(async () => {
    if (!fs.existsSync(SVG_SRC)) {
        console.error('PWA icon not found:', SVG_SRC);
        app.exit(1);
        return;
    }

    console.log('step: create window');
    const win = new BrowserWindow({
        width: 1024,
        height: 1024,
        show: false,
        frame: false,
        webPreferences: { offscreen: true },
    });

    const svgUrl = 'file:///' + SVG_SRC.replace(/\\/g, '/');
    console.log('step: load url');
    await win.loadURL(
        'data:text/html,<html><body style="margin:0"><img id="src" src="' + svgUrl + '" width="1024" height="1024"></body></html>'
    );
    console.log('step: loaded');

    await win.webContents.executeJavaScript(
        `new Promise((resolve) => {
            const img = document.getElementById('src');
            if (img.complete) resolve();
            else img.onload = () => resolve();
        })`
    );

    console.log('step: capture');
    const image = await win.webContents.capturePage();
    const pngBuffer = image.toPNG();
    console.log('step: captured');

    fs.mkdirSync(OUT_DIR, { recursive: true });
    for (const size of SIZES) {
        const resized = nativeImage.createFromBuffer(pngBuffer).resize({ width: size, height: size });
        const file = path.join(OUT_DIR, `icon-${size}.png`);
        fs.writeFileSync(file, resized.toPNG());
        console.log('wrote', file);
    }
    // electron-builder expects buildResources/icon.* — keep a copy of the 1024 one.
    const mainIcon = path.join(OUT_DIR, 'icon.png');
    fs.writeFileSync(mainIcon, pngBuffer);
    console.log('wrote', mainIcon);

    clearTimeout(watchdog);
    app.exit(0);
});
