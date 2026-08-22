import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import axios from 'axios';
import { Bell, Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import BrandLogo from '@/Components/BrandLogo';
const DISMISS_KEY = 'markaz-pwa-prompt-dismissed-until';
function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || Boolean(navigator.standalone);
}
function base64ToUint8Array(value) {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}
export default function PwaInstallPrompt() {
    const { auth } = usePage().props;
    const [installEvent, setInstallEvent] = useState(null);
    const [isIos, setIsIos] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [pushAvailable, setPushAvailable] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    useEffect(() => {
        if (isStandalone())
            return;
        const dismissedUntil = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
        const onBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setInstallEvent(event);
            if (dismissedUntil < Date.now())
                setIsVisible(true);
        };
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window);
        setIsIos(ios);
        if (ios && dismissedUntil < Date.now())
            setIsVisible(true);
        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    }, []);
    useEffect(() => {
        if (!auth?.user || !vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
            return;
        let cancelled = false;
        setPushAvailable(true);
        navigator.serviceWorker.ready.then(async (registration) => {
            const subscription = await registration.pushManager.getSubscription();
            if (!cancelled && subscription)
                setPushEnabled(true);
        }).catch(() => undefined);
        return () => { cancelled = true; };
    }, [auth?.user, vapidKey]);
    const dismiss = () => {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setIsVisible(false);
    };
    const install = async () => {
        if (!installEvent) {
            setMessage('در آیفون، از منوی Share گزینه Add to Home Screen را انتخاب کنید.');
            return;
        }
        setBusy(true);
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        if (choice.outcome === 'accepted')
            setIsVisible(false);
        setInstallEvent(null);
        setBusy(false);
    };
    const enablePush = async () => {
        if (!vapidKey) {
            setMessage('کلید VAPID هنوز در تنظیمات محیطی سایت وارد نشده است.');
            return;
        }
        setBusy(true);
        setMessage('');
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setMessage('اجازه اعلان‌ها داده نشد. می‌توانید بعداً از تنظیمات مرورگر فعالش کنید.');
                return;
            }
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64ToUint8Array(vapidKey),
            });
            const payload = subscription.toJSON();
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            await axios.post('/notifications/subscriptions', {
                endpoint: payload.endpoint,
                keys: payload.keys,
                content_encoding: 'aes128gcm',
            }, { headers: { 'X-CSRF-TOKEN': csrf } });
            setPushEnabled(true);
            setMessage('اعلان‌های مسیر رشد فعال شد.');
        }
        catch {
            setMessage('فعال‌سازی اعلان‌ها انجام نشد. اتصال امن HTTPS و تنظیم VAPID را بررسی کنید.');
        }
        finally {
            setBusy(false);
        }
    };
    const showInstall = isVisible && !isStandalone() && (Boolean(installEvent) || isIos);
    const showPush = Boolean(auth?.user) && pushAvailable && !pushEnabled;
    if (!showInstall && !showPush && !message)
        return null;
    return (_jsxs("aside", { className: "pwa-prompt", dir: "rtl", "aria-live": "polite", children: [_jsx("div", { className: "pwa-prompt-icon", "aria-hidden": true, children: _jsx(BrandLogo, { src: "/app-icon", alt: "", className: "size-full rounded-[0.8rem] object-contain" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [showInstall && _jsxs(_Fragment, { children: [_jsx("strong", { className: "block text-sm font-black text-navy", children: "\u0645\u0631\u06A9\u0632 \u0631\u0634\u062F \u0631\u0627 \u0646\u0635\u0628 \u06A9\u0646\u06CC\u062F" }), _jsx("p", { className: "mt-1 text-xs leading-5 text-navy/60", children: "\u0628\u0631\u0627\u06CC \u062F\u0633\u062A\u0631\u0633\u06CC \u0633\u0631\u06CC\u0639\u200C\u062A\u0631\u060C \u0633\u0627\u06CC\u062A \u0631\u0627 \u0645\u062B\u0644 \u06CC\u06A9 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646 \u0631\u0648\u06CC \u0645\u0648\u0628\u0627\u06CC\u0644 \u0627\u0636\u0627\u0641\u0647 \u06A9\u0646\u06CC\u062F." })] }), showPush && !showInstall && _jsxs(_Fragment, { children: [_jsx("strong", { className: "block text-sm font-black text-navy", children: "\u0627\u0639\u0644\u0627\u0646\u200C\u0647\u0627\u06CC \u0645\u0633\u06CC\u0631 \u0631\u0634\u062F" }), _jsx("p", { className: "mt-1 text-xs leading-5 text-navy/60", children: "\u06CC\u0627\u062F\u0622\u0648\u0631\u06CC \u062F\u0631\u0633\u200C\u0647\u0627\u060C \u0633\u0641\u0627\u0631\u0634\u200C\u0647\u0627 \u0648 \u067E\u06CC\u0627\u0645\u200C\u0647\u0627\u06CC \u0645\u0647\u0645 \u0631\u0627 \u062F\u0631\u06CC\u0627\u0641\u062A \u06A9\u0646\u06CC\u062F." })] }), message && _jsx("p", { className: "mt-1 text-xs font-bold leading-5 text-brand-700", children: message }), _jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", children: [showInstall && _jsxs("button", { type: "button", onClick: install, disabled: busy, className: "pwa-prompt-primary", children: [_jsx(Download, { className: "size-3.5" }), " \u0646\u0635\u0628 \u0627\u067E\u0644\u06CC\u06A9\u06CC\u0634\u0646"] }), showPush && _jsxs("button", { type: "button", onClick: enablePush, disabled: busy, className: "pwa-prompt-secondary", children: [_jsx(Bell, { className: "size-3.5" }), " \u0641\u0639\u0627\u0644\u200C\u0633\u0627\u0632\u06CC \u0627\u0639\u0644\u0627\u0646"] }), showInstall && _jsx("button", { type: "button", onClick: dismiss, className: "pwa-prompt-dismiss", children: "\u0628\u0639\u062F\u0627\u064B" })] })] }), _jsx("button", { type: "button", className: "pwa-prompt-close", onClick: dismiss, "aria-label": "\u0628\u0633\u062A\u0646 \u067E\u06CC\u0627\u0645 \u0646\u0635\u0628", children: _jsx(X, { className: "size-4" }) })] }));
}
