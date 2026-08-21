import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BellRing, X } from 'lucide-react';
import { useEffect, useState } from 'react';
const DISMISS_KEY = 'markaz-site-popup-dismissed';
function hasDismissed(frequency) {
    if (typeof window === 'undefined')
        return false;
    if (frequency === 'always')
        return false;
    if (frequency === 'session') {
        return window.sessionStorage.getItem(DISMISS_KEY) === '1';
    }
    const value = window.localStorage.getItem(DISMISS_KEY);
    if (!value)
        return false;
    if (frequency === 'once')
        return value === '1';
    return value === new Date().toISOString().slice(0, 10);
}
function rememberDismissal(frequency) {
    if (typeof window === 'undefined' || frequency === 'always')
        return;
    if (frequency === 'session') {
        window.sessionStorage.setItem(DISMISS_KEY, '1');
        return;
    }
    window.localStorage.setItem(DISMISS_KEY, frequency === 'daily' ? new Date().toISOString().slice(0, 10) : '1');
}
export default function SitePopup({ paused = false }) {
    const { site } = usePage().props;
    const popup = site.popup;
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!popup?.enabled || paused || hasDismissed(popup.frequency))
            return;
        const timer = window.setTimeout(() => setOpen(true), Math.max(0, popup.delay_seconds) * 1000);
        return () => window.clearTimeout(timer);
    }, [paused, popup]);
    useEffect(() => {
        if (!open)
            return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                dismiss();
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);
    if (!popup?.enabled || !open)
        return null;
    const dismiss = () => {
        rememberDismissal(popup.frequency);
        setOpen(false);
    };
    const cta = popup.cta_url.startsWith('/') ? (_jsxs(Link, { href: popup.cta_url, onClick: dismiss, className: "site-popup-cta", children: [popup.cta_label, _jsx(ArrowLeft, { className: "size-4", "aria-hidden": true })] })) : (_jsxs("a", { href: popup.cta_url, onClick: dismiss, className: "site-popup-cta", children: [popup.cta_label, _jsx(ArrowLeft, { className: "size-4", "aria-hidden": true })] }));
    return (_jsx("div", { className: "site-popup-backdrop", role: "presentation", onMouseDown: (event) => event.target === event.currentTarget && dismiss(), children: _jsxs("section", { className: "site-popup-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "site-popup-title", children: [_jsx("div", { className: "site-popup-orb site-popup-orb-one", "aria-hidden": true }), _jsx("div", { className: "site-popup-orb site-popup-orb-two", "aria-hidden": true }), _jsx("button", { type: "button", className: "site-popup-close", onClick: dismiss, "aria-label": "\u0628\u0633\u062A\u0646 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F", children: _jsx(X, { className: "size-4", "aria-hidden": true }) }), _jsxs("div", { className: "site-popup-content", children: [_jsx("span", { className: "site-popup-icon", children: _jsx(BellRing, { className: "size-5", "aria-hidden": true }) }), _jsx("span", { className: "site-popup-kicker", children: "\u06CC\u06A9 \u0642\u062F\u0645 \u062A\u0627\u0632\u0647 \u062F\u0631 \u0645\u0633\u06CC\u0631 \u0631\u0634\u062F" }), _jsx("h2", { id: "site-popup-title", children: popup.title }), _jsx("p", { children: popup.message }), _jsxs("div", { className: "site-popup-actions", children: [cta, _jsx("button", { type: "button", onClick: dismiss, className: "site-popup-later", children: "\u0628\u0639\u062F\u0627\u064B \u06CC\u0627\u062F\u0622\u0648\u0631\u06CC \u06A9\u0646" })] })] })] }) }));
}
