import type { ReactNode } from 'react';

interface SectionHeadingProps {
    eyebrow?: string;
    title: string;
    description?: string;
    align?: 'center' | 'start';
    dark?: boolean;
    action?: ReactNode;
    /** نمایش برچسب به‌سبک «ایستگاه» (قرص طلایی) در روایت سفر قهرمانی */
    station?: boolean;
}

export function SectionHeading({
    eyebrow,
    title,
    description,
    align = 'center',
    dark = false,
    action,
    station = false,
}: SectionHeadingProps) {
    const alignCls = align === 'center' ? 'text-center items-center' : 'text-start items-start';

    return (
        <div className={`flex flex-col gap-3 ${alignCls} ${action ? 'md:flex-row md:items-end md:justify-between' : ''}`}>
            <div className={`flex flex-col gap-3 ${alignCls} max-w-2xl`}>
                {eyebrow && (
                    <span className={`section-eyebrow ${station ? 'station-eyebrow' : ''}`}>
                        {!station && <span className="section-eyebrow-mark" />}
                        {eyebrow}
                    </span>
                )}
                <h2
                    className={`text-4xl font-black leading-tight md:text-5xl ${
                        dark ? 'text-white' : 'text-navy'
                    }`}
                >
                    {title}
                </h2>
                {description && (
                    <p className={`text-base leading-8 md:text-lg ${dark ? 'text-white/70' : 'text-navy/60'}`}>
                        {description}
                    </p>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}
