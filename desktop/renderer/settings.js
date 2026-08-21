'use strict';

(async () => {
    const api = window.markazDesktop;
    if (!api) return;

    const urlInput = document.getElementById('server-url');
    const msgEl = document.getElementById('msg');
    const saveBtn = document.getElementById('save');
    const resetBtn = document.getElementById('reset');

    let current = { serverUrl: '', defaultServerUrl: '' };

    function showMsg(text, kind) {
        msgEl.textContent = text;
        msgEl.className = 'msg ' + (kind || '');
    }

    try {
        current = await api.getConfig();
        urlInput.value = current.serverUrl || '';
        document.getElementById('version').textContent = current.version || '—';
    } catch {
        showMsg('خطا در خواندن تنظیمات', 'err');
    }

    saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        try {
            const result = await api.setConfig({ serverUrl: urlInput.value.trim() });
            if (result && result.ok) {
                showMsg('ذخیره شد. در حال اتصال به «' + result.serverUrl + '»…', 'ok');
                setTimeout(() => window.close(), 1200);
            } else {
                showMsg((result && result.error) || 'خطا در ذخیره‌سازی', 'err');
            }
        } catch {
            showMsg('خطا در ذخیره‌سازی', 'err');
        } finally {
            saveBtn.disabled = false;
        }
    });

    resetBtn.addEventListener('click', async () => {
        resetBtn.disabled = true;
        try {
            const result = await api.resetConfig();
            if (result && result.ok) {
                urlInput.value = result.serverUrl || '';
                showMsg('بازنشانی شد. در حال اتصال به «' + result.serverUrl + '»…', 'ok');
                setTimeout(() => window.close(), 1200);
            }
        } catch {
            showMsg('خطا در بازنشانی', 'err');
        } finally {
            resetBtn.disabled = false;
        }
    });

    urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') saveBtn.click();
    });
})();
