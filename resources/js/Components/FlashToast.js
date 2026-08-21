import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
export default function FlashToast() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(null);
    const timer = useRef(null);
    useEffect(() => {
        const message = flash?.success ?? flash?.error;
        if (!message)
            return;
        const type = flash.success ? 'success' : 'error';
        setVisible({ type, message });
        if (timer.current)
            clearTimeout(timer.current);
        timer.current = setTimeout(() => setVisible(null), 5000);
        return () => { if (timer.current)
            clearTimeout(timer.current); };
    }, [flash]);
    if (!visible)
        return null;
    const Icon = visible.type === 'success' ? CheckCircle2 : AlertCircle;
    return (_jsxs("div", { className: "pointer-events-none fixed bottom-6 left-6 z-[70] flex w-[calc(100vw-3rem)] max-w-md animate-[toast-in_.25s_ease-out] items-start gap-3 rounded-2xl bg-white p-4 shadow-lift ring-1 ring-navy/10", role: "status", "aria-live": "polite", children: [_jsx("span", { className: `mt-0.5 shrink-0 rounded-full p-1.5 text-white ${visible.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`, children: _jsx(Icon, { className: "size-4", "aria-hidden": true }) }), _jsx("p", { className: "flex-1 text-sm font-bold leading-6 text-navy", children: visible.message }), _jsx("button", { type: "button", onClick: () => setVisible(null), "aria-label": "\u0628\u0633\u062A\u0646", className: "shrink-0 rounded-lg p-1 text-navy/40 transition-colors hover:bg-soft-gray hover:text-navy", children: _jsx(X, { className: "size-4" }) })] }));
}
