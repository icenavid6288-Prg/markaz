'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// ---------------------------------------------------------------------------
// Offline / connection banner — injected into the site while disconnected.
// ---------------------------------------------------------------------------

const BANNER_ID = 'markaz-offline-banner';
const STYLE_ID = 'markaz-offline-style';

function ensureBanner() {
    if (document.getElementById(BANNER_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        #${BANNER_ID} {
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 10px 16px;
            background: #7f1d1d;
            color: #fff;
            font-family: Vazirmatn, Tahoma, 'Segoe UI', sans-serif;
            font-size: 14px;
            direction: rtl;
            box-shadow: 0 2px 10px rgba(0,0,0,.25);
        }
        #${BANNER_ID} .markaz-offline-label {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        #${BANNER_ID} .markaz-offline-dot {
            width: 10px; height: 10px;
            border-radius: 9999px;
            background: #fca5a5;
            animation: markaz-blink 1.2s infinite;
        }
        #markaz-retry-btn {
            border: 0;
            border-radius: 8px;
            padding: 6px 14px;
            background: #087f52;
            color: #fff;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
        }
        #markaz-retry-btn:hover { background: #0a9664; }
        @keyframes markaz-blink { 50% { opacity: .3; } }
    `;
    (document.head || document.documentElement).appendChild(style);

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.setAttribute('dir', 'rtl');
    banner.innerHTML = `
        <span class="markaz-offline-label">
            <span class="markaz-offline-dot"></span>
            <span>ارتباط با سرور برقرار نیست</span>
        </span>
        <button id="markaz-retry-btn" type="button">تلاش مجدد</button>
    `;
    banner.hidden = true;

    const retry = banner.querySelector('#markaz-retry-btn');
    retry.addEventListener('click', () => {
        window.location.reload();
    });

    document.documentElement.appendChild(banner);
}

function setOffline(offline) {
    ensureBanner();
    const banner = document.getElementById(BANNER_ID);
    if (!banner) return;
    if (offline && banner.hidden) banner.hidden = false;
    if (!offline && !banner.hidden) banner.hidden = true;
}

ipcRenderer.on('markaz:status', (_event, status) => {
    setOffline(status.status === 'offline');
});
window.addEventListener('online', () => setOffline(false));
window.addEventListener('offline', () => setOffline(true));

// ---------------------------------------------------------------------------
// Public bridge
// ---------------------------------------------------------------------------

contextBridge.exposeInMainWorld('markazDesktop', {
    appName: 'مرکز رشد و کارآفرینی دکتر بیدی',
    platform: process.platform,
    versions: process.versions,

    getConfig: () => ipcRenderer.invoke('markaz:get-config'),
    setConfig: (config) => ipcRenderer.invoke('markaz:set-config', config),
    resetConfig: () => ipcRenderer.invoke('markaz:reset-config'),

    navigate: (pagePath) => ipcRenderer.send('markaz:navigate', pagePath),
    reload: () => ipcRenderer.send('markaz:reload'),
    openSettings: () => ipcRenderer.send('markaz:open-settings'),
    openExternal: (url) => ipcRenderer.send('markaz:open-external', url),
    onStatus: (callback) => ipcRenderer.on('markaz:status', (_event, status) => callback(status)),
});
