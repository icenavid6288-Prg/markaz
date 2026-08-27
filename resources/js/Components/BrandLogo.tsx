import { useEffect, useId, useState, type ImgHTMLAttributes } from 'react';

const FALLBACK_LOGO = '/images/brand-logo.png';

const normalizeLogo = (value: string) => {
    if (!/^https?:\/\//i.test(value)) return value;
    try {
        const url = new URL(value);
        return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ? url.pathname : value;
    } catch {
        return value;
    }
};

export default function BrandLogo({
    alt = 'لوگوی مرکز رشد و کارآفرینی دکتر بیدی',
    className = '',
    src,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    // Always resolve the shared site logo through the host-safe endpoint. The
    // database value may still be an old /storage URL while the site is being migrated.
    const requestedLogo = src ?? '/site-logo';
    const normalizedLogo = typeof requestedLogo === 'string' ? normalizeLogo(requestedLogo) : requestedLogo;
    const [logo, setLogo] = useState(normalizedLogo || FALLBACK_LOGO);
    const isPhotoFallback = logo === FALLBACK_LOGO;
    const filterId = `brand-logo-cutout-${useId().replace(/:/g, '')}`;
    const { style, onError, ...imageProps } = props;

    useEffect(() => {
        setLogo(normalizedLogo || FALLBACK_LOGO);
    }, [normalizedLogo]);

    const handleError: NonNullable<ImgHTMLAttributes<HTMLImageElement>['onError']> = (event) => {
        if (logo !== FALLBACK_LOGO) {
            setLogo(FALLBACK_LOGO);
            return;
        }
        onError?.(event);
    };

    return (
        <>
            {isPhotoFallback && (
                <svg className="brand-logo-filter-defs" aria-hidden="true" focusable="false">
                    <defs>
                        <filter id={filterId} colorInterpolationFilters="sRGB">
                            <feColorMatrix
                                type="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 0 3"
                            />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="8" intercept="-7" />
                            </feComponentTransfer>
                        </filter>
                    </defs>
                </svg>
            )}
            <img
                {...imageProps}
                src={logo || FALLBACK_LOGO}
                alt={alt}
                onError={handleError}
                decoding={imageProps.decoding ?? 'async'}
                className={`brand-logo-image ${isPhotoFallback ? 'brand-logo-photo-fallback' : ''} ${className}`.trim()}
                style={isPhotoFallback ? { ...style, filter: `url(#${filterId})` } : style}
            />
        </>
    );
}
