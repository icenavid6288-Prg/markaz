import { useState } from 'react';
import { ChevronDown, CircleHelp } from 'lucide-react';

export type GuideStep = { title: string; text: string };

/** Collapsible Persian usage guide, consistent with the Instagram module panels. */
export function EitaaGuide({ title = 'راهنمای استفاده از این صفحه', steps, hints = [], defaultOpen = false }: {
    title?: string;
    steps: GuideStep[];
    hints?: string[];
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <section className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/60 shadow-soft">
            <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 px-5 py-4 text-right">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-soft"><CircleHelp className="size-5" /></span>
                <span className="flex-1 text-sm font-black text-navy">{title}</span>
                <ChevronDown className={`size-5 shrink-0 text-brand-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="border-t border-brand-100 bg-white/70 px-5 py-4">
                    <ol className="space-y-3">
                        {steps.map((step, index) => (
                            <li key={step.title} className="flex gap-3">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[0.65rem] font-black text-white">{index + 1}</span>
                                <div>
                                    <strong className="text-xs font-black text-navy">{step.title}</strong>
                                    <p className="mt-0.5 text-xs leading-6 text-navy/60">{step.text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                    {hints.length > 0 && (
                        <ul className="mt-4 space-y-1.5 border-t border-brand-100 pt-3">
                            {hints.map((hint) => (
                                <li key={hint} className="flex gap-2 text-[0.68rem] leading-5 text-navy/55">
                                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
                                    {hint}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}

/** Banner explaining an API-limited (unsupported) area, per module policy. */
export function EitaaUnsupported({ text }: { text: string }) {
    return (
        <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[0.65rem] font-black">!</span>
            <p className="text-xs leading-6">{text}</p>
        </section>
    );
}

export default EitaaGuide;
