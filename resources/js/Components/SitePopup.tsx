import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BellRing, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PageProps } from '@/types';

const DISMISS_KEY = 'markaz-site-popup-dismissed';

type PopupConfig = NonNullable<PageProps['site']['popup']>;

function hasDismissed(frequency: PopupConfig['frequency']): boolean {
    if (typeof window === 'undefined') return false;
    if (frequency === 'always') return false;

    if (frequency === 'session') {
        return window.sessionStorage.getItem(DISMISS_KEY) === '1';
    }

    const value = window.localStorage.getItem(DISMISS_KEY);
    if (!value) return false;
    if (frequency === 'once') return value === '1';

    return value === new Date().toISOString().slice(0, 10);
}

function rememberDismissal(frequency: PopupConfig['frequency']) {
    if (typeof window === 'undefined' || frequency === 'always') return;
    if (frequency === 'session') {
        window.sessionStorage.setItem(DISMISS_KEY, '1');
        return;
    }
    window.localStorage.setItem(DISMISS_KEY, frequency === 'daily' ? new Date().toISOString().slice(0, 10) : '1');
}

export default function SitePopup({ paused = false }: { paused?: boolean }) {
    const { site } = usePage<PageProps>().props;
    const popup = site.popup;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!popup?.enabled || paused || hasDismissed(popup.frequency)) return;

        const timer = window.setTimeout(() => setOpen(true), Math.max(0, popup.delay_seconds) * 1000);
        return () => window.clearTimeout(timer);
    }, [paused, popup]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') dismiss();
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    if (!popup?.enabled || !open) return null;

    const dismiss = () => {
        rememberDismissal(popup.frequency);
        setOpen(false);
    };

    const cta = popup.cta_url.startsWith('/') ? (
        <Link href={popup.cta_url} onClick={dismiss} className="site-popup-cta">
            {popup.cta_label}
            <ArrowLeft className="size-4" aria-hidden />
        </Link>
    ) : (
        <a href={popup.cta_url} onClick={dismiss} className="site-popup-cta">
            {popup.cta_label}
            <ArrowLeft className="size-4" aria-hidden />
        </a>
    );

    return (
        <div className="site-popup-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && dismiss()}>
            <section className="site-popup-panel" role="dialog" aria-modal="true" aria-labelledby="site-popup-title">
                <div className="site-popup-orb site-popup-orb-one" aria-hidden />
                <div className="site-popup-orb site-popup-orb-two" aria-hidden />
                <button type="button" className="site-popup-close" onClick={dismiss} aria-label="بستن پیشنهاد">
                    <X className="size-4" aria-hidden />
                </button>
                <div className="site-popup-content">
                    <span className="site-popup-icon"><BellRing className="size-5" aria-hidden /></span>
                    <span className="site-popup-kicker">یک قدم تازه در مسیر رشد</span>
                    <h2 id="site-popup-title">{popup.title}</h2>
                    <p>{popup.message}</p>
                    <div className="site-popup-actions">
                        {cta}
                        <button type="button" onClick={dismiss} className="site-popup-later">بعداً یادآوری کن</button>
                    </div>
                </div>
            </section>
        </div>
    );
}
