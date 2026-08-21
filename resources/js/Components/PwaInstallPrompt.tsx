import axios from 'axios';
import { Bell, Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import BrandLogo from '@/Components/BrandLogo';
import type { PageProps } from '@/types';

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PushSubscriptionJson = {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
};

const DISMISS_KEY = 'markaz-pwa-prompt-dismissed-until';

function isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function base64ToUint8Array(value: string): Uint8Array {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export default function PwaInstallPrompt() {
    const { auth } = usePage<PageProps>().props;
    const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
    const [isIos, setIsIos] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [pushAvailable, setPushAvailable] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

    useEffect(() => {
        if (isStandalone()) return;

        const dismissedUntil = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
        const onBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallEvent(event as InstallPromptEvent);
            if (dismissedUntil < Date.now()) setIsVisible(true);
        };

        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window);
        setIsIos(ios);
        if (ios && dismissedUntil < Date.now()) setIsVisible(true);
        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

        return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    }, []);

    useEffect(() => {
        if (!auth?.user || !vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

        let cancelled = false;
        setPushAvailable(true);
        navigator.serviceWorker.ready.then(async (registration) => {
            const subscription = await registration.pushManager.getSubscription();
            if (!cancelled && subscription) setPushEnabled(true);
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
        if (choice.outcome === 'accepted') setIsVisible(false);
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
                applicationServerKey: base64ToUint8Array(vapidKey) as unknown as BufferSource,
            });
            const payload = subscription.toJSON() as PushSubscriptionJson;
            const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
            await axios.post('/notifications/subscriptions', {
                endpoint: payload.endpoint,
                keys: payload.keys,
                content_encoding: 'aes128gcm',
            }, { headers: { 'X-CSRF-TOKEN': csrf } });
            setPushEnabled(true);
            setMessage('اعلان‌های مسیر رشد فعال شد.');
        } catch {
            setMessage('فعال‌سازی اعلان‌ها انجام نشد. اتصال امن HTTPS و تنظیم VAPID را بررسی کنید.');
        } finally {
            setBusy(false);
        }
    };

    const showInstall = isVisible && !isStandalone() && (Boolean(installEvent) || isIos);
    const showPush = Boolean(auth?.user) && pushAvailable && !pushEnabled;
    if (!showInstall && !showPush && !message) return null;

    return (
        <aside className="pwa-prompt" dir="rtl" aria-live="polite">
            <div className="pwa-prompt-icon" aria-hidden><BrandLogo src="/app-icon" alt="" className="size-full rounded-[0.8rem] object-contain" /></div>
            <div className="min-w-0 flex-1">
                {showInstall && <>
                    <strong className="block text-sm font-black text-navy">مرکز رشد را نصب کنید</strong>
                    <p className="mt-1 text-xs leading-5 text-navy/60">برای دسترسی سریع‌تر، سایت را مثل یک اپلیکیشن روی موبایل اضافه کنید.</p>
                </>}
                {showPush && !showInstall && <>
                    <strong className="block text-sm font-black text-navy">اعلان‌های مسیر رشد</strong>
                    <p className="mt-1 text-xs leading-5 text-navy/60">یادآوری درس‌ها، سفارش‌ها و پیام‌های مهم را دریافت کنید.</p>
                </>}
                {message && <p className="mt-1 text-xs font-bold leading-5 text-brand-700">{message}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {showInstall && <button type="button" onClick={install} disabled={busy} className="pwa-prompt-primary"><Download className="size-3.5" /> نصب اپلیکیشن</button>}
                    {showPush && <button type="button" onClick={enablePush} disabled={busy} className="pwa-prompt-secondary"><Bell className="size-3.5" /> فعال‌سازی اعلان</button>}
                    {showInstall && <button type="button" onClick={dismiss} className="pwa-prompt-dismiss">بعداً</button>}
                </div>
            </div>
            <button type="button" className="pwa-prompt-close" onClick={dismiss} aria-label="بستن پیام نصب"><X className="size-4" /></button>
        </aside>
    );
}
