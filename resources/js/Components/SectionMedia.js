import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const VIDEO_ID_PATTERN = '[A-Za-z0-9_-]{6,}';
function parsedUrl(value) {
    try {
        const parsed = new URL(value, 'https://site.local');
        if (!['http:', 'https:'].includes(parsed.protocol) && !value.startsWith('/'))
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
function isHost(hostname, hosts) {
    return hosts.includes(hostname.toLowerCase());
}
/** Parse a user-provided URL into an embeddable video source. */
export function resolveVideoUrl(url) {
    const value = (url ?? '').trim();
    if (!value)
        return null;
    const parsed = parsedUrl(value);
    if (!parsed)
        return null;
    const hostname = parsed.hostname.toLowerCase();
    if (isHost(hostname, ['aparat.com', 'www.aparat.com'])) {
        const aparat = parsed.pathname.match(new RegExp(`/v/(${VIDEO_ID_PATTERN})`, 'i'))
            ?? parsed.pathname.match(new RegExp(`/video/video/embed/videohash/(${VIDEO_ID_PATTERN})`, 'i'));
        if (aparat) {
            return {
                kind: 'aparat',
                src: `https://www.aparat.com/video/video/embed/videohash/${aparat[1]}/vt/frame`,
            };
        }
    }
    if (isHost(hostname, ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'])) {
        const youtubeId = hostname === 'youtu.be'
            ? parsed.pathname.slice(1).split('/')[0]
            : parsed.searchParams.get('v')
                ?? parsed.pathname.match(new RegExp(`/(?:embed|shorts|live)/(${VIDEO_ID_PATTERN})`, 'i'))?.[1];
        if (youtubeId && new RegExp(`^${VIDEO_ID_PATTERN}$`).test(youtubeId)) {
            return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${youtubeId}` };
        }
    }
    if (isHost(hostname, ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'])) {
        const vimeoId = parsed.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
        if (vimeoId)
            return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vimeoId}` };
    }
    const isVideoFile = /\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(parsed.pathname + parsed.search);
    if (isVideoFile && (value.startsWith('/') || ['http:', 'https:'].includes(parsed.protocol))) {
        return { kind: 'file', src: value };
    }
    return null;
}
/**
 * Optional media for a page section: prefers the video (Aparat/YouTube/Vimeo/MP4)
 * and falls back to the image when no video is set.
 */
export default function SectionMedia({ video, image, className = '', poster, title = 'ویدیوی بخش' }) {
    const resolved = resolveVideoUrl(video ?? '');
    const img = (image ?? '').trim() || (poster ?? '').trim();
    if (!resolved && !img)
        return null;
    const frame = `relative overflow-hidden rounded-3xl bg-navy/5 shadow-lift ${className}`;
    if (resolved?.kind === 'aparat' || resolved?.kind === 'youtube' || resolved?.kind === 'vimeo') {
        return (_jsx("div", { className: frame, children: _jsx("div", { className: "flex aspect-video w-full items-center justify-center bg-black", children: _jsx("iframe", { src: resolved.src, title: title, className: "aspect-video w-full", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share", allowFullScreen: true, loading: "lazy", referrerPolicy: "strict-origin-when-cross-origin" }) }) }));
    }
    if (resolved?.kind === 'file') {
        return (_jsx("div", { className: frame, children: _jsxs("video", { controls: true, playsInline: true, preload: "metadata", poster: img || undefined, className: "aspect-video w-full bg-black", children: [_jsx("source", { src: resolved.src }), "\u0645\u0631\u0648\u0631\u06AF\u0631 \u0634\u0645\u0627 \u0627\u0632 \u067E\u062E\u0634 \u0648\u06CC\u062F\u06CC\u0648 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0646\u0645\u06CC\u200C\u06A9\u0646\u062F."] }) }));
    }
    return (_jsx("div", { className: frame, children: _jsx("img", { src: img, alt: "", loading: "lazy", className: "max-h-[32rem] w-full object-cover" }) }));
}
