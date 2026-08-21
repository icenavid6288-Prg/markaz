import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PageProps } from '@/types';

export default function FlashToast() {
    const { flash } = usePage<PageProps>().props;
    const [visible, setVisible] = useState<null | { type: 'success' | 'error'; message: string }>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const message = flash?.success ?? flash?.error;
        if (!message) return;

        const type = flash.success ? 'success' : 'error';
        setVisible({ type, message });

        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setVisible(null), 5000);
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, [flash]);

    if (!visible) return null;

    const Icon = visible.type === 'success' ? CheckCircle2 : AlertCircle;
    return (
        <div className="pointer-events-none fixed bottom-6 left-6 z-[70] flex w-[calc(100vw-3rem)] max-w-md animate-[toast-in_.25s_ease-out] items-start gap-3 rounded-2xl bg-white p-4 shadow-lift ring-1 ring-navy/10" role="status" aria-live="polite">
            <span className={`mt-0.5 shrink-0 rounded-full p-1.5 text-white ${visible.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                <Icon className="size-4" aria-hidden />
            </span>
            <p className="flex-1 text-sm font-bold leading-6 text-navy">{visible.message}</p>
            <button type="button" onClick={() => setVisible(null)} aria-label="بستن" className="shrink-0 rounded-lg p-1 text-navy/40 transition-colors hover:bg-soft-gray hover:text-navy">
                <X className="size-4" />
            </button>
        </div>
    );
}
