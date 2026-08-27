import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Crop, ImagePlus, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, } from 'react';
import { Button } from '@/Components/ui/Button';
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const OUTPUT_SIZE = 512;
export default function ImageCropField({ label, value, help, error, onChange }) {
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const dragRef = useRef(null);
    const [editing, setEditing] = useState(false);
    const [sourceUrl, setSourceUrl] = useState(null);
    const [image, setImage] = useState(null);
    const [box, setBox] = useState(0);
    const [transform, setTransform] = useState({ zoom: MIN_ZOOM, x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const previewUrl = useMemo(() => {
        if (value instanceof File)
            return URL.createObjectURL(value);
        return typeof value === 'string' && value ? value : null;
    }, [value]);
    useEffect(() => {
        const url = previewUrl;
        return () => {
            if (url && value instanceof File)
                URL.revokeObjectURL(url);
        };
    }, [previewUrl, value]);
    const geometry = (zoom) => {
        if (!image || box <= 0)
            return null;
        const cover = Math.max(box / image.naturalWidth, box / image.naturalHeight);
        const scale = cover * zoom;
        return { scale, dw: image.naturalWidth * scale, dh: image.naturalHeight * scale };
    };
    const clampTransform = (next) => {
        const g = geometry(next.zoom);
        if (!g)
            return next;
        return {
            zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next.zoom)),
            x: Math.min(0, Math.max(box - g.dw, next.x)),
            y: Math.min(0, Math.max(box - g.dh, next.y)),
        };
    };
    // Reset the framing whenever a new image (or a resized crop box) appears.
    useEffect(() => {
        const g = geometry(MIN_ZOOM);
        if (!g)
            return;
        setTransform({ zoom: MIN_ZOOM, x: (box - g.dw) / 2, y: (box - g.dh) / 2 });
        // geometry() reads refs/state; the reset should only happen on image/box changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image, box]);
    // Measure the (square) crop box and keep it in sync with window resizes.
    useEffect(() => {
        if (!editing)
            return;
        const el = containerRef.current;
        if (!el)
            return;
        const measure = () => setBox(Math.round(el.getBoundingClientRect().width));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [editing]);
    // Keep the zoom level anchored to the point under the cursor while scrolling.
    useEffect(() => {
        const el = containerRef.current;
        if (!el || !editing || !image)
            return;
        const onWheel = (event) => {
            event.preventDefault();
            const rect = el.getBoundingClientRect();
            zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * 0.002));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing, image, box]);
    const zoomAt = (anchorX, anchorY, factor) => {
        setTransform((current) => {
            const g = geometry(current.zoom);
            if (!g)
                return current;
            const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor));
            const next = geometry(zoom);
            if (!next)
                return current;
            const naturalX = (anchorX - current.x) / g.scale;
            const naturalY = (anchorY - current.y) / g.scale;
            return clampTransform({
                zoom,
                x: anchorX - naturalX * next.scale,
                y: anchorY - naturalY * next.scale,
            });
        });
    };
    const onPointerDown = (event) => {
        if (!image)
            return;
        containerRef.current?.setPointerCapture(event.pointerId);
        dragRef.current = { startX: event.clientX, startY: event.clientY, x: transform.x, y: transform.y };
        setDragging(true);
    };
    const onPointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag || !image)
            return;
        setTransform((current) => clampTransform({
            ...current,
            x: drag.x + (event.clientX - drag.startX),
            y: drag.y + (event.clientY - drag.startY),
        }));
    };
    const onPointerUp = () => {
        dragRef.current = null;
        setDragging(false);
    };
    const onKeyDown = (event) => {
        if (!image)
            return;
        const step = event.shiftKey ? 48 : 16;
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setTransform((current) => clampTransform({ ...current, x: current.x - step }));
        }
        else if (event.key === 'ArrowRight') {
            event.preventDefault();
            setTransform((current) => clampTransform({ ...current, x: current.x + step }));
        }
        else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setTransform((current) => clampTransform({ ...current, y: current.y - step }));
        }
        else if (event.key === 'ArrowDown') {
            event.preventDefault();
            setTransform((current) => clampTransform({ ...current, y: current.y + step }));
        }
        else if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            zoomAt(box / 2, box / 2, 1.15);
        }
        else if (event.key === '-') {
            event.preventDefault();
            zoomAt(box / 2, box / 2, 1 / 1.15);
        }
    };
    const pickFile = (file) => {
        setLocalError(null);
        if (!file)
            return;
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
        if (sourceUrl)
            URL.revokeObjectURL(sourceUrl);
        setSourceUrl(null);
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    };
    const applyCrop = () => {
        if (!image || box <= 0)
            return;
        const g = geometry(transform.zoom);
        if (!g)
            return;
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
            if (blob)
                onChange(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
            closeEditor();
        }, 'image/jpeg', 0.92);
    };
    const g = editing ? geometry(transform.zoom) : null;
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-col gap-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50/40 p-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm", children: previewUrl ? (_jsx("img", { src: previewUrl, alt: label, className: "size-full object-cover" })) : (_jsx("div", { className: "flex size-full items-center justify-center text-navy/25", children: _jsx(ImagePlus, { className: "size-8", "aria-hidden": true }) })) }), _jsxs("div", { className: "flex flex-1 flex-col items-start gap-2.5", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/png,image/jpeg,image/webp", className: "hidden", onChange: (event) => pickFile(event.target.files?.[0] ?? null) }), _jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: () => fileInputRef.current?.click(), children: [_jsx(ImagePlus, { className: "size-4" }), " ", value ? 'برش مجدد تصویر' : 'انتخاب و برش تصویر'] }), value && (_jsxs("button", { type: "button", onClick: () => onChange(null), className: "inline-flex items-center gap-1.5 text-xs font-bold text-red-600 transition-colors hover:text-red-700", children: [_jsx(Trash2, { className: "size-3.5", "aria-hidden": true }), " \u062D\u0630\u0641 \u062A\u0635\u0648\u06CC\u0631"] }))] })] }), value instanceof File && (_jsx("span", { className: "inline-flex w-fit items-center rounded-lg bg-brand-100 px-2.5 py-1 text-[0.68rem] font-black text-brand-800", children: "\u062A\u0635\u0648\u06CC\u0631 \u062C\u062F\u06CC\u062F \u0628\u0631\u0634 \u062E\u0648\u0631\u062F\u0647 \u0648 \u0622\u0645\u0627\u062F\u0647 \u0630\u062E\u06CC\u0631\u0647 \u0627\u0633\u062A" })), _jsx("p", { className: "text-[0.68rem] leading-5 text-navy/40", children: help ?? 'پس از انتخاب، عکس را جابه‌جا و بزرگنمایی کنید تا کادر مربع دلخواه ثبت شود؛ PNG، JPG یا WEBP تا ۸ مگابایت.' })] }), localError && _jsx("p", { className: "mt-1 text-xs font-bold text-red-600", children: localError }), error && _jsx("p", { className: "mt-1 text-xs font-bold text-red-600", children: error }), editing && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm", role: "dialog", "aria-modal": "true", "aria-label": `برش ${label}`, children: _jsxs("div", { className: "w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-lift", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 border-b border-navy/5 px-5 py-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-black text-navy", children: ["\u0628\u0631\u0634 ", label] }), _jsx("p", { className: "mt-0.5 text-xs leading-5 text-navy/45", children: "\u062A\u0635\u0648\u06CC\u0631 \u0631\u0627 \u0628\u06A9\u0634\u06CC\u062F \u062A\u0627 \u062C\u0627\u0628\u0647\u200C\u062C\u0627 \u0634\u0648\u062F\u061B \u0628\u0627 \u0686\u0631\u062E \u0645\u0627\u0648\u0633\u060C \u0646\u0648\u0627\u0631 \u0644\u063A\u0632\u0646\u062F\u0647 \u06CC\u0627 \u06A9\u0644\u06CC\u062F\u0647\u0627\u06CC \u062C\u0647\u062A\u200C\u0646\u0645\u0627\u060C \u06A9\u0627\u062F\u0631 \u0645\u0631\u0628\u0639 \u0631\u0627 \u062A\u0646\u0638\u06CC\u0645 \u06A9\u0646\u06CC\u062F." })] }), _jsx("button", { type: "button", onClick: closeEditor, className: "flex size-8 shrink-0 items-center justify-center rounded-lg text-navy/40 transition-colors hover:bg-soft-gray hover:text-navy", "aria-label": "\u0628\u0633\u062A\u0646", children: _jsx(X, { className: "size-4", "aria-hidden": true }) })] }), _jsxs("div", { className: "p-5", children: [_jsxs("div", { ref: containerRef, tabIndex: 0, role: "application", "aria-label": "\u0645\u062D\u06CC\u0637 \u0628\u0631\u0634 \u062A\u0635\u0648\u06CC\u0631", className: "relative mx-auto aspect-square w-full max-w-[340px] touch-none select-none overflow-hidden rounded-xl bg-navy/10 outline-none ring-2 ring-brand-200 focus-visible:ring-brand-500", style: { cursor: dragging ? 'grabbing' : 'grab' }, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: onPointerUp, onKeyDown: onKeyDown, children: [image && sourceUrl && g && (_jsx("img", { src: sourceUrl, alt: "", draggable: false, className: "absolute max-w-none", style: { left: transform.x, top: transform.y, width: g.dw, height: g.dh } })), _jsx("div", { className: "pointer-events-none absolute inset-0", style: { boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.9)' }, "aria-hidden": true })] }), _jsxs("div", { className: "mt-4 flex items-center gap-3 px-1", children: [_jsx(ZoomOut, { className: "size-4 shrink-0 text-navy/40", "aria-hidden": true }), _jsx("input", { type: "range", min: MIN_ZOOM, max: MAX_ZOOM, step: 0.01, value: transform.zoom, onChange: (event) => zoomAt(box / 2, box / 2, Number(event.target.value) / transform.zoom), className: "h-2 flex-1 cursor-pointer accent-brand-600", "aria-label": "\u0628\u0632\u0631\u06AF\u0646\u0645\u0627\u06CC\u06CC" }), _jsx(ZoomIn, { className: "size-4 shrink-0 text-navy/40", "aria-hidden": true })] }), _jsxs("div", { className: "mt-5 flex items-center justify-end gap-2", children: [_jsx("button", { type: "button", onClick: closeEditor, className: "rounded-xl px-4 py-2.5 text-sm font-bold text-navy/55 transition-colors hover:bg-soft-gray hover:text-navy", children: "\u0627\u0646\u0635\u0631\u0627\u0641" }), _jsxs(Button, { type: "button", onClick: applyCrop, loading: processing, children: [_jsx(Crop, { className: "size-4" }), " \u062A\u0623\u06CC\u06CC\u062F \u0628\u0631\u0634"] })] })] })] }) }))] }));
}
