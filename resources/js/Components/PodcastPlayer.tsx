import { Pause, Play, PlayCircle, SkipBack } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '@/lib/format';

export interface PodcastEpisodeData {
    id: number;
    title: string;
    description?: string | null;
    audio_url?: string | null;
    duration_seconds: number | null;
    is_free: boolean;
}

function audioSource(value?: string | null): string {
    if (!value) return '';
    if (/^(https?:|\/|blob:)/i.test(value)) return value;
    return `/${value}`;
}

function formatTime(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${formatNumber(minutes)}:${String(remainder).padStart(2, '0')}`;
}

export function PodcastPlayer({ episodes }: { episodes: PodcastEpisodeData[] }) {
    const audioRef = useRef<HTMLAudioElement>(null);
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

    if (!selected) return null;

    const selectEpisode = (id: number) => setSelectedId(id);

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio || !source) return;

        if (audio.paused) {
            await audio.play();
        } else {
            audio.pause();
        }
    };

    const resetAudio = () => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
    };

    const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
        <div className="podcast-player liquid-card p-5 md:p-6">
            <span className="liquid-blob blob-a" aria-hidden />
            <span className="liquid-blob blob-b" aria-hidden />
            <div className="relative">
                <div className="flex items-start gap-3">
                    <span className="glass-tile glass-tile-lg">
                        <PlayCircle className="size-7" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-brand-700">در حال پخش</div>
                        <h3 className="mt-1 line-clamp-2 text-base font-black text-navy">{selected.title}</h3>
                    </div>
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-navy/10" aria-hidden>
                    <span className="block h-full rounded-full bg-gradient-to-l from-brand-600 to-brand-300 transition-[width]" style={{ width: `${percent}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[0.68rem] font-bold text-navy/40" dir="ltr">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>

                <audio
                    ref={audioRef}
                    src={source || undefined}
                    preload="metadata"
                    controls
                    className="mt-4 w-full"
                    aria-label={`پخش ${selected.title}`}
                    onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || selected.duration_seconds || 0)}
                    onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                />

                <div className="mt-4 flex items-center gap-2">
                    <button type="button" onClick={togglePlay} disabled={!source} className="inline-flex items-center gap-2 rounded-xl bg-deep-green px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-45">
                        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
                        {playing ? 'مکث' : 'پخش قسمت'}
                    </button>
                    <button type="button" onClick={resetAudio} className="flex size-10 items-center justify-center rounded-xl border border-navy/10 bg-white/70 text-navy/55 transition-colors hover:border-brand-300 hover:text-brand-700" aria-label="شروع مجدد قسمت">
                        <SkipBack className="size-4" aria-hidden />
                    </button>
                    {!source && <span className="text-xs text-amber-700">فایل صوتی این قسمت هنوز بارگذاری نشده است.</span>}
                </div>

                <div className="mt-6 border-t border-navy/5 pt-4">
                    <div className="mb-3 text-xs font-black text-navy/50">انتخاب قسمت</div>
                    <div className="flex flex-col gap-2">
                        {episodes.map((episode, index) => (
                            <button
                                key={episode.id}
                                type="button"
                                onClick={() => selectEpisode(episode.id)}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors ${episode.id === selected.id ? 'bg-brand-50 text-brand-800' : 'bg-white/55 text-navy/65 hover:bg-white/85'}`}
                            >
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-brand-700 shadow-sm">{formatNumber(index + 1)}</span>
                                <span className="flex-1 truncate text-xs font-bold">{episode.title}</span>
                                {episode.is_free && <span className="rounded-md bg-brand-100 px-1.5 py-0.5 text-[0.6rem] font-black text-brand-700">رایگان</span>}
                                <span className="text-[0.65rem] text-navy/40">{formatTime(episode.duration_seconds ?? 0)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
