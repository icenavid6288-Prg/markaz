import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Pause, Play, PlayCircle, SkipBack } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '@/lib/format';
function audioSource(value) {
    if (!value)
        return '';
    if (/^(https?:|\/|blob:)/i.test(value))
        return value;
    return `/${value}`;
}
function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${formatNumber(minutes)}:${String(remainder).padStart(2, '0')}`;
}
export function PodcastPlayer({ episodes }) {
    const audioRef = useRef(null);
    const [selectedId, setSelectedId] = useState(episodes[0]?.id ?? null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(episodes[0]?.duration_seconds ?? 0);
    const [playing, setPlaying] = useState(false);
    const selected = episodes.find((episode) => episode.id === selectedId) ?? episodes[0];
    const source = audioSource(selected?.audio_url);
    useEffect(() => {
        setCurrentTime(0);
        setDuration(selected?.duration_seconds ?? 0);
        setPlaying(false);
        audioRef.current?.load();
    }, [selectedId, selected?.duration_seconds]);
    if (!selected)
        return null;
    const selectEpisode = (id) => setSelectedId(id);
    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio || !source)
            return;
        if (audio.paused) {
            await audio.play();
        }
        else {
            audio.pause();
        }
    };
    const resetAudio = () => {
        if (!audioRef.current)
            return;
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
    };
    const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
    return (_jsxs("div", { className: "podcast-player liquid-card p-5 md:p-6", children: [_jsx("span", { className: "liquid-blob blob-a", "aria-hidden": true }), _jsx("span", { className: "liquid-blob blob-b", "aria-hidden": true }), _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "glass-tile glass-tile-lg", children: _jsx(PlayCircle, { className: "size-7", "aria-hidden": true }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-xs font-bold text-brand-700", children: "\u062F\u0631 \u062D\u0627\u0644 \u067E\u062E\u0634" }), _jsx("h3", { className: "mt-1 line-clamp-2 text-base font-black text-navy", children: selected.title })] })] }), _jsx("div", { className: "mt-5 h-1.5 overflow-hidden rounded-full bg-navy/10", "aria-hidden": true, children: _jsx("span", { className: "block h-full rounded-full bg-gradient-to-l from-brand-600 to-brand-300 transition-[width]", style: { width: `${percent}%` } }) }), _jsxs("div", { className: "mt-2 flex items-center justify-between text-[0.68rem] font-bold text-navy/40", dir: "ltr", children: [_jsx("span", { children: formatTime(currentTime) }), _jsx("span", { children: formatTime(duration) })] }), _jsx("audio", { ref: audioRef, src: source || undefined, preload: "metadata", controls: true, className: "mt-4 w-full", "aria-label": `پخش ${selected.title}`, onLoadedMetadata: (event) => setDuration(event.currentTarget.duration || selected.duration_seconds || 0), onTimeUpdate: (event) => setCurrentTime(event.currentTarget.currentTime), onPlay: () => setPlaying(true), onPause: () => setPlaying(false), onEnded: () => setPlaying(false) }), _jsxs("div", { className: "mt-4 flex items-center gap-2", children: [_jsxs("button", { type: "button", onClick: togglePlay, disabled: !source, className: "inline-flex items-center gap-2 rounded-xl bg-deep-green px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-45", children: [playing ? _jsx(Pause, { className: "size-4", "aria-hidden": true }) : _jsx(Play, { className: "size-4", "aria-hidden": true }), playing ? 'مکث' : 'پخش قسمت'] }), _jsx("button", { type: "button", onClick: resetAudio, className: "flex size-10 items-center justify-center rounded-xl border border-navy/10 bg-white/70 text-navy/55 transition-colors hover:border-brand-300 hover:text-brand-700", "aria-label": "\u0634\u0631\u0648\u0639 \u0645\u062C\u062F\u062F \u0642\u0633\u0645\u062A", children: _jsx(SkipBack, { className: "size-4", "aria-hidden": true }) }), !source && _jsx("span", { className: "text-xs text-amber-700", children: "\u0641\u0627\u06CC\u0644 \u0635\u0648\u062A\u06CC \u0627\u06CC\u0646 \u0642\u0633\u0645\u062A \u0647\u0646\u0648\u0632 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0646\u0634\u062F\u0647 \u0627\u0633\u062A." })] }), _jsxs("div", { className: "mt-6 border-t border-navy/5 pt-4", children: [_jsx("div", { className: "mb-3 text-xs font-black text-navy/50", children: "\u0627\u0646\u062A\u062E\u0627\u0628 \u0642\u0633\u0645\u062A" }), _jsx("div", { className: "flex flex-col gap-2", children: episodes.map((episode, index) => (_jsxs("button", { type: "button", onClick: () => selectEpisode(episode.id), className: `flex items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors ${episode.id === selected.id ? 'bg-brand-50 text-brand-800' : 'bg-white/55 text-navy/65 hover:bg-white/85'}`, children: [_jsx("span", { className: "flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-brand-700 shadow-sm", children: formatNumber(index + 1) }), _jsx("span", { className: "flex-1 truncate text-xs font-bold", children: episode.title }), episode.is_free && _jsx("span", { className: "rounded-md bg-brand-100 px-1.5 py-0.5 text-[0.6rem] font-black text-brand-700", children: "\u0631\u0627\u06CC\u06AF\u0627\u0646" }), _jsx("span", { className: "text-[0.65rem] text-navy/40", children: formatTime(episode.duration_seconds ?? 0) })] }, episode.id))) })] })] })] }));
}
