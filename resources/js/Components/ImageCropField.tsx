import { Crop, ImagePlus, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button } from '@/Components/ui/Button';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const OUTPUT_SIZE = 512;

interface ImageCropFieldProps {
    label: string;
    value: string | File | null;
    help?: string;
    error?: string;
    onChange: (file: File | null) => void;
}

interface Transform {
    zoom: number;
    x: number;
    y: number;
}

interface Geometry {
    scale: number;
    dw: number;
    dh: number;
}

export default function ImageCropField({ label, value, help, error, onChange }: ImageCropFieldProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);

    const [editing, setEditing] = useState(false);
    const [sourceUrl, setSourceUrl] = useState<string | null>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [box, setBox] = useState(0);
    const [transform, setTransform] = useState<Transform>({ zoom: MIN_ZOOM, x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const previewUrl = useMemo(() => {
        if (value instanceof File) return URL.createObjectURL(value);
        return typeof value === 'string' && value ? value : null;
    }, [value]);

    useEffect(() => {
        const url = previewUrl;
        return () => {
            if (url && value instanceof File) URL.revokeObjectURL(url);
        };
    }, [previewUrl, value]);

    const geometry = (zoom: number): Geometry | null => {
        if (!image || box <= 0) return null;
        const cover = Math.max(box / image.naturalWidth, box / image.naturalHeight);
        const scale = cover * zoom;
        return { scale, dw: image.naturalWidth * scale, dh: image.naturalHeight * scale };
    };

    const clampTransform = (next: Transform): Transform => {
        const g = geometry(next.zoom);
        if (!g) return next;
        return {
            zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next.zoom)),
            x: Math.min(0, Math.max(box - g.dw, next.x)),
            y: Math.min(0, Math.max(box - g.dh, next.y)),
        };
    };

    // Reset the framing whenever a new image (or a resized crop box) appears.
    useEffect(() => {
        const g = geometry(MIN_ZOOM);
        if (!g) return;
        setTransform({ zoom: MIN_ZOOM, x: (box - g.dw) / 2, y: (box - g.dh) / 2 });
        // geometry() reads refs/state; the reset should only happen on image/box changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image, box]);

    // Measure the (square) crop box and keep it in sync with window resizes.
    useEffect(() => {
        if (!editing) return;
        const el = containerRef.current;
        if (!el) return;
        const measure = () => setBox(Math.round(el.getBoundingClientRect().width));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [editing]);

    // Keep the zoom level anchored to the point under the cursor while scrolling.
    useEffect(() => {
        const el = containerRef.current;
        if (!el || !editing || !image) return;
        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            const rect = el.getBoundingClientRect();
            zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * 0.002));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing, image, box]);

    const zoomAt = (anchorX: number, anchorY: number, factor: number) => {
        setTransform((current) => {
            const g = geometry(current.zoom);
            if (!g) return current;
            const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor));
            const next = geometry(zoom);
            if (!next) return current;
            const naturalX = (anchorX - current.x) / g.scale;
            const naturalY = (anchorY - current.y) / g.scale;
            return clampTransform({
                zoom,
                x: anchorX - naturalX * next.scale,
                y: anchorY - naturalY * next.scale,
            });
        });
    };

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!image) return;
        containerRef.current?.setPointerCapture(event.pointerId);
        dragRef.current = { startX: event.clientX, startY: event.clientY, x: transform.x, y: transform.y };
        setDragging(true);
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || !image) return;
        setTransform((current) =>
            clampTransform({
                ...current,
                x: drag.x + (event.clientX - drag.startX),
                y: drag.y + (event.clientY - drag.startY),
            }),
        );
    };

    const onPointerUp = () => {
        dragRef.current = null;
        setDragging(false);
    };

    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!image) return;
        const step = event.shiftKey ? 48 : 16;
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setTransform((current) => clampTransform({ ...current, x: current.x - step }));
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            setTransform((current) => clampTransform({ ...current, x: current.x + step }));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setTransform((current) => clampTransform({ ...current, y: current.y - step }));
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            setTransform((current) => clampTransform({ ...current, y: current.y + step }));
        } else if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            zoomAt(box / 2, box / 2, 1.15);
        } else if (event.key === '-') {
            event.preventDefault();
            zoomAt(box / 2, box / 2, 1 / 1.15);
        }
    };

    const pickFile = (file: File | null) => {
        setLocalError(null);
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setLocalError('فقط تصویر PNG، JPG یا WEBP انتخاب کنید.');
            return;
        }
        if (file.size > MAX_BYTES) {
            setLocalError('حجم تصویر نباید بیشتر از ۸ مگابایت باشد.');
            return;
        }

        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            setSourceUrl(url);
            setImage(img);
            setTransform({ zoom: MIN_ZOOM, x: 0, y: 0 });
            setEditing(true);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            setLocalError('فایل انتخاب‌شده تصویر معتبری نیست.');
        };
        img.src = url;
    };

    const closeEditor = () => {
        setEditing(false);
        setImage(null);
        if (sourceUrl) URL.revokeObjectURL(sourceUrl);
        setSourceUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const applyCrop = () => {
        if (!image || box <= 0) return;
        const g = geometry(transform.zoom);
        if (!g) return;

        setProcessing(true);
        const naturalX = -transform.x / g.scale;
        const naturalY = -transform.y / g.scale;
        const cropSize = box / g.scale;
        const out = Math.max(1, Math.round(Math.min(OUTPUT_SIZE, cropSize)));
        const canvas = document.createElement('canvas');
        canvas.width = out;
        canvas.height = out;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setProcessing(false);
            return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, out, out);
        ctx.drawImage(image, naturalX, naturalY, cropSize, cropSize, 0, 0, out, out);
        canvas.toBlob((blob) => {
            setProcessing(false);
            if (blob) onChange(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
            closeEditor();
        }, 'image/jpeg', 0.92);
    };

    const g = editing ? geometry(transform.zoom) : null;

    return (
        <div>
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4">
                <div className="flex items-center gap-4">
                    <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
                        {previewUrl ? (
                            <img src={previewUrl} alt={label} className="size-full object-cover" />
                        ) : (
                            <div className="flex size-full items-center justify-center text-navy/25">
                                <ImagePlus className="size-8" aria-hidden />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-2.5">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <ImagePlus className="size-4" /> {value ? 'برش مجدد تصویر' : 'انتخاب و برش تصویر'}
                        </Button>
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange(null)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 transition-colors hover:text-red-700"
                            >
                                <Trash2 className="size-3.5" aria-hidden /> حذف تصویر
                            </button>
                        )}
                    </div>
                </div>
                {value instanceof File && (
                    <span className="inline-flex w-fit items-center rounded-lg bg-brand-100 px-2.5 py-1 text-[0.68rem] font-black text-brand-800">
                        تصویر جدید برش خورده و آماده ذخیره است
                    </span>
                )}
                <p className="text-[0.68rem] leading-5 text-navy/40">
                    {help ?? 'پس از انتخاب، عکس را جابه‌جا و بزرگنمایی کنید تا کادر مربع دلخواه ثبت شود؛ PNG، JPG یا WEBP تا ۸ مگابایت.'}
                </p>
            </div>
            {localError && <p className="mt-1 text-xs font-bold text-red-600">{localError}</p>}
            {error && <p className="mt-1 text-xs font-bold text-red-600">{error}</p>}

            {editing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`برش ${label}`}
                >
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-lift">
                        <div className="flex items-start justify-between gap-3 border-b border-navy/5 px-5 py-4">
                            <div>
                                <h3 className="text-sm font-black text-navy">برش {label}</h3>
                                <p className="mt-0.5 text-xs leading-5 text-navy/45">
                                    تصویر را بکشید تا جابه‌جا شود؛ با چرخ ماوس، نوار لغزنده یا کلیدهای جهت‌نما، کادر مربع را تنظیم کنید.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeEditor}
                                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-navy/40 transition-colors hover:bg-soft-gray hover:text-navy"
                                aria-label="بستن"
                            >
                                <X className="size-4" aria-hidden />
                            </button>
                        </div>
                        <div className="p-5">
                            <div
                                ref={containerRef}
                                tabIndex={0}
                                role="application"
                                aria-label="محیط برش تصویر"
                                className="relative mx-auto aspect-square w-full max-w-[340px] touch-none select-none overflow-hidden rounded-xl bg-navy/10 outline-none ring-2 ring-brand-200 focus-visible:ring-brand-500"
                                style={{ cursor: dragging ? 'grabbing' : 'grab' }}
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerCancel={onPointerUp}
                                onKeyDown={onKeyDown}
                            >
                                {image && sourceUrl && g && (
                                    <img
                                        src={sourceUrl}
                                        alt=""
                                        draggable={false}
                                        className="absolute max-w-none"
                                        style={{ left: transform.x, top: transform.y, width: g.dw, height: g.dh }}
                                    />
                                )}
                                <div
                                    className="pointer-events-none absolute inset-0"
                                    style={{ boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.9)' }}
                                    aria-hidden
                                />
                            </div>
                            <div className="mt-4 flex items-center gap-3 px-1">
                                <ZoomOut className="size-4 shrink-0 text-navy/40" aria-hidden />
                                <input
                                    type="range"
                                    min={MIN_ZOOM}
                                    max={MAX_ZOOM}
                                    step={0.01}
                                    value={transform.zoom}
                                    onChange={(event) => zoomAt(box / 2, box / 2, Number(event.target.value) / transform.zoom)}
                                    className="h-2 flex-1 cursor-pointer accent-brand-600"
                                    aria-label="بزرگنمایی"
                                />
                                <ZoomIn className="size-4 shrink-0 text-navy/40" aria-hidden />
                            </div>
                            <div className="mt-5 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeEditor}
                                    className="rounded-xl px-4 py-2.5 text-sm font-bold text-navy/55 transition-colors hover:bg-soft-gray hover:text-navy"
                                >
                                    انصراف
                                </button>
                                <Button type="button" onClick={applyCrop} loading={processing}>
                                    <Crop className="size-4" /> تأیید برش
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
