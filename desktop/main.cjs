'use strict';

const { app, BrowserWindow, Tray, Menu, shell, ipcMain, nativeImage, session, Notification } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { URL } = require('node:url');

const APP_NAME = 'مرکز رشد و کارآفرینی دکتر بیدی';
const DEFAULT_SERVER_URL = 'http://localhost:8000';
const SMOKE_TEST = process.env.MARKAZ_SMOKE_TEST === '1';

let mainWindow = null;
let tray = null;
let settingsWindow = null;
let isQuitting = false;
let serverUrl = DEFAULT_SERVER_URL;
let trayHintShown = false;

// ---------------------------------------------------------------------------
// Config: where the desktop app connects to.
// Priority: saved config (in-app) > DESKTOP_SERVER_URL env > Laravel .env > default.
// ---------------------------------------------------------------------------

function configPath() {
    return path.join(app.getPath('userData'), 'config.json');
}

function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(configPath(), 'utf8'));
    } catch {
        return {};
    }
}

function writeConfig(patch) {
    const cfg = { ...readConfig(), ...patch };
    fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2));
}

function readLaravelAppUrl() {
    try {
        const envPath = path.join(__dirname, '..', '.env');
        if (!fs.existsSync(envPath)) return null;
        const match = fs.readFileSync(envPath, 'utf8').match(/^APP_URL=(.+)$/m);
        if (!match) return null;
        const value = match[1].trim();
        return /^https?:\/\//i.test(value) ? value : null;
    } catch {
        return null;
    }
}

function normalizeServerUrl(raw) {
    let value = String(raw || '').trim();
    if (!value) return null;
    if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
    try {
        const url = new URL(value);
        if (url.origin === 'null') return null;
        return url.origin + (url.pathname.replace(/\/+$/, '') || '');
    } catch {
        return null;
    }
}

function resolveDefaultServerUrl() {
    if (process.env.DESKTOP_SERVER_URL) {
        const normalized = normalizeServerUrl(process.env.DESKTOP_SERVER_URL);
        if (normalized) return normalized;
    }
    return readLaravelAppUrl() || DEFAULT_SERVER_URL;
}

function resolveServerUrl() {
    const saved = readConfig().serverUrl;
    if (saved) return saved;
    return resolveDefaultServerUrl();
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function iconPath(size) {
    return path.join(__dirname, 'icons', `icon-${size}.png`);
}

function trayIcon() {
    return nativeImage.createFromPath(iconPath(32));
}

// ---------------------------------------------------------------------------
// Window state persistence
// ---------------------------------------------------------------------------

function stateFilePath() {
    return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
    try {
        const state = JSON.parse(fs.readFileSync(stateFilePath(), 'utf8'));
        if (state && typeof state.width === 'number' && typeof state.height === 'number') return state;
    } catch {
        /* first run */
    }
    return { width: 1280, height: 820 };
}

let saveTimer = null;
function saveWindowState() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        try {
            const bounds = mainWindow.getNormalBounds();
            fs.writeFileSync(stateFilePath(), JSON.stringify({
                width: bounds.width,
                height: bounds.height,
                x: bounds.x,
                y: bounds.y,
                isMaximized: mainWindow.isMaximized(),
            }));
        } catch {
            /* ignore */
        }
    }, 400);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sendStatus(status, detail) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('markaz:status', { status, detail, serverUrl });
    }
}

function showMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
}

function navigateTo(pagePath) {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    showMainWindow();
    mainWindow.loadURL(new URL(pagePath, serverUrl).toString()).catch((err) => {
        console.error('navigate failed:', err);
    });
}

function reloadMain() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.reload();
    }
}

function isAllowedScheme(url) {
    return /^https?:/i.test(url);
}

// ---------------------------------------------------------------------------
// Main window
// ---------------------------------------------------------------------------

function createMainWindow() {
    const state = loadWindowState();

    mainWindow = new BrowserWindow({
        width: state.width,
        height: state.height,
        x: state.x,
        y: state.y,
        minWidth: 960,
        minHeight: 620,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: '#f5faf7',
        title: APP_NAME,
        icon: iconPath(256),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            spellcheck: false,
        },
    });

    if (state.isMaximized) mainWindow.maximize();

    // Popups (payment gateways, social links, ...) open in the system browser.
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (isAllowedScheme(url)) shell.openExternal(url);
        return { action: 'deny' };
    });

    // Same-origin navigations stay inside the app; anything else goes to the browser.
    mainWindow.webContents.on('will-navigate', (event, url) => {
        try {
            const target = new URL(url);
            const base = new URL(serverUrl);
            if (target.origin === base.origin) return;
        } catch {
            /* invalid url */
        }
        event.preventDefault();
        if (isAllowedScheme(url)) shell.openExternal(url);
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        if (errorCode === -3) return; // ERR_ABORTED — user navigated away
        sendStatus('offline', { code: errorCode, description: errorDescription });
    });

    mainWindow.webContents.on('did-finish-load', () => {
        sendStatus('online');
    });

    mainWindow.on('close', (event) => {
        if (!isQuitting && tray) {
            // Close-to-tray: keep the session alive in the background.
            event.preventDefault();
            mainWindow.hide();
            if (!trayHintShown) {
                trayHintShown = true;
                try {
                    new Notification({
                        title: APP_NAME,
                        body: 'برنامه در پس‌زمینه فعال است؛ برای بازگشایی روی آیکن نوار وظیفه کلیک کنید.',
                    }).show();
                } catch {
                    /* notification unavailable */
                }
            }
        } else {
            saveWindowState();
        }
    });

    mainWindow.on('resize', saveWindowState);
    mainWindow.on('move', saveWindowState);
    mainWindow.on('maximize', saveWindowState);
    mainWindow.on('unmaximize', saveWindowState);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.loadURL(serverUrl).catch((err) => {
        console.error('Failed to load server URL:', err);
    });

    if (SMOKE_TEST) {
        mainWindow.webContents.once('did-finish-load', () => {
            console.log('MARKAZ_SMOKE_OK ' + serverUrl);
            app.exit(0);
        });
        mainWindow.webContents.once('did-fail-load', (_event, code, desc) => {
            console.error('MARKAZ_SMOKE_FAIL code=' + code + ' desc=' + desc);
            app.exit(1);
        });
        setTimeout(() => {
            console.error('MARKAZ_SMOKE_TIMEOUT');
            app.exit(1);
        }, 45000);
    }
}

// ---------------------------------------------------------------------------
// Tray
// ---------------------------------------------------------------------------

function createTray() {
    tray = new Tray(trayIcon());
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(
        Menu.buildFromTemplate([
            { label: 'باز کردن اپلیکیشن', click: showMainWindow },
            { type: 'separator' },
            { label: 'دوره‌ها', click: () => navigateTo('/courses') },
            { label: 'فروشگاه', click: () => navigateTo('/shop') },
            { label: 'پنل کاربری', click: () => navigateTo('/dashboard') },
            { type: 'separator' },
            { label: 'بارگذاری مجدد', click: reloadMain },
            { label: 'ابزار توسعه‌دهنده', click: () => mainWindow && mainWindow.webContents.toggleDevTools() },
            { type: 'separator' },
            { label: 'تنظیمات سرور…', click: openSettingsWindow },
            { type: 'separator' },
            {
                label: 'خروج',
                click: () => {
                    isQuitting = true;
                    saveWindowState();
                    app.quit();
                },
            },
        ])
    );
    tray.on('double-click', showMainWindow);
}

// ---------------------------------------------------------------------------
// Settings window (change the server the app connects to)
// ---------------------------------------------------------------------------

function openSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.show();
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 500,
        height: 480,
        resizable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        title: 'تنظیمات اپلیکیشن',
        backgroundColor: '#f5faf7',
        icon: iconPath(256),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            spellcheck: false,
        },
    });

    settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
    settingsWindow.once('ready-to-show', () => settingsWindow.show());
    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------

function setupIpc() {
    ipcMain.handle('markaz:get-config', () => ({
        serverUrl,
        defaultServerUrl: resolveDefaultServerUrl(),
        appName: APP_NAME,
        version: app.getVersion(),
        platform: process.platform,
    }));

    ipcMain.handle('markaz:set-config', (_event, payload) => {
        const normalized = normalizeServerUrl(payload && payload.serverUrl);
        if (!normalized) {
            return { ok: false, error: 'آدرس واردشده معتبر نیست. مثال: https://example.com' };
        }
        writeConfig({ serverUrl: normalized });
        serverUrl = normalized;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.loadURL(serverUrl).catch(() => undefined);
        }
        return { ok: true, serverUrl };
    });

    ipcMain.handle('markaz:reset-config', () => {
        const cfg = readConfig();
        delete cfg.serverUrl;
        fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2));
        serverUrl = resolveDefaultServerUrl();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.loadURL(serverUrl).catch(() => undefined);
        }
        return { ok: true, serverUrl };
    });

    ipcMain.on('markaz:navigate', (_event, pagePath) => {
        if (typeof pagePath === 'string') navigateTo(pagePath);
    });

    ipcMain.on('markaz:reload', reloadMain);
    ipcMain.on('markaz:open-settings', openSettingsWindow);

    ipcMain.on('markaz:open-external', (_event, url) => {
        if (typeof url === 'string' && isAllowedScheme(url)) shell.openExternal(url);
    });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        showMainWindow();
    });

    app.whenReady().then(() => {
        app.setAppUserModelId('ir.markaz.desktop');

        serverUrl = resolveServerUrl();
        console.log('Markaz Desktop -> ' + serverUrl);

        // Let the site use notifications, media (course player), fullscreen.
        const allowedPermissions = new Set([
            'notifications',
            'media',
            'fullscreen',
            'pointerLock',
            'clipboard-sanitized-write',
        ]);
        session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowedPermissions.has(permission));
        session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
            callback(allowedPermissions.has(permission));
        });

        setupIpc();
        createMainWindow();
        createTray();

        if (process.platform !== 'darwin') {
            Menu.setApplicationMenu(null);
        }
    });

    // React to network changes: reload when connectivity comes back.
    app.on('online', () => {
        sendStatus('online', { reason: 'network' });
        reloadMain();
    });
    app.on('offline', () => {
        sendStatus('offline', { reason: 'network' });
    });

    app.on('before-quit', () => {
        isQuitting = true;
        saveWindowState();
    });

    // With the tray active the app keeps running after the window closes.
    app.on('window-all-closed', () => {
        if (isQuitting) app.quit();
    });
}
