interface ResolvedVideo {
    kind: 'aparat' | 'youtube' | 'vimeo' | 'file';
    src: string;
}

const VIDEO_ID_PATTERN = '[A-Za-z0-9_-]{6,}';

function parsedUrl(value: string): URL | null {
    try {
        const parsed = new URL(value, 'https://site.local');
        if (!['http:', 'https:'].includes(parsed.protocol) && !value.startsWith('/')) return null;
        return parsed;
    } catch {
        return null;
    }
}

function isHost(hostname: string, hosts: string[]): boolean {
    return hosts.includes(hostname.toLowerCase());
}

/** Parse a user-provided URL into an embeddable video source. */
export function resolveVideoUrl(url: string): ResolvedVideo | null {
    const value = (url ?? '').trim();
    if (!value) return null;

    const parsed = parsedUrl(value);
    if (!parsed) return null;
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
        if (vimeoId) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vimeoId}` };
    }

    const isVideoFile = /\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(parsed.pathname + parsed.search);
    if (isVideoFile && (value.startsWith('/') || ['http:', 'https:'].includes(parsed.protocol))) {
        return { kind: 'file', src: value };
    }

    return null;
}

interface SectionMediaProps {
    video?: string | null;
    image?: string | null;
    className?: string;
    /** Poster image shown while a direct video file is loading. */
    poster?: string | null;
    title?: string;
}

/**
 * Optional media for a page section: prefers the video (Aparat/YouTube/Vimeo/MP4)
 * and falls back to the image when no video is set.
 */
export default function SectionMedia({ video, image, className = '', poster, title = 'ویدیوی بخش' }: SectionMediaProps) {
    const resolved = resolveVideoUrl(video ?? '');
    const img = (image ?? '').trim() || (poster ?? '').trim();

    if (!resolved && !img) return null;

    const frame = `relative overflow-hidden rounded-3xl bg-navy/5 shadow-lift ${className}`;

    if (resolved?.kind === 'aparat' || resolved?.kind === 'youtube' || resolved?.kind === 'vimeo') {
        return (
            <div className={frame}>
                <div className="flex aspect-video w-full items-center justify-center bg-black">
                    <iframe
                        src={resolved.src}
                        title={title}
                        className="aspect-video w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                </div>
            </div>
        );
    }

    if (resolved?.kind === 'file') {
        return (
            <div className={frame}>
                <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={img || undefined}
                    className="aspect-video w-full bg-black"
                >
                    <source src={resolved.src} />
                    مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
                </video>
            </div>
        );
    }

    return (
        <div className={frame}>
            <img src={img} alt="" loading="lazy" className="max-h-[32rem] w-full object-cover" />
        </div>
    );
}
