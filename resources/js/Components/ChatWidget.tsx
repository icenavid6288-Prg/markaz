import { usePage } from '@inertiajs/react';
import { Bot, Headset, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PageProps } from '@/types';

type ChatMessage = { id: number; sender: 'user' | 'ai' | 'admin'; body: string; created_at: string | null };

const TOKEN_KEY = 'markaz-chat-token';
const POLL_INTERVAL = 4000;

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function formatTime(iso: string | null): string {
    if (!iso) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    } catch {
        return '';
    }
}

function chatHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken(),
    };
    if (token) headers['X-Chat-Token'] = token;
    return headers;
}

export default function ChatWidget() {
    const { site } = usePage<PageProps>().props;
    const chat = site.chat;

    const [open, setOpen] = useState(false);
    const [conversation, setConversation] = useState<{ id: number; token: string } | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const conversationRef = useRef<{ id: number; token: string } | null>(null);
    conversationRef.current = conversation;

    const scrollToBottom = () => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, open]);

    const ensureConversation = useCallback(async (): Promise<{ id: number; token: string } | null> => {
        let token = window.localStorage.getItem(TOKEN_KEY);
        if (!token) {
            token = crypto.randomUUID();
            window.localStorage.setItem(TOKEN_KEY, token);
        }

        try {
            const response = await fetch('/support-chat/conversations', {
                method: 'POST',
                headers: chatHeaders(),
                body: JSON.stringify({ token }),
            });
            if (!response.ok) return null;
            const payload = (await response.json()) as { conversation: { id: number; token: string } };
            return payload.conversation;
        } catch {
            return null;
        }
    }, []);

    const loadMessages = useCallback(async () => {
        const current = conversationRef.current;
        if (!current) return;

        const lastId = messagesRef.current.at(-1)?.id ?? 0;
        try {
            const response = await fetch(`/support-chat/conversations/${current.id}/messages?after_id=${lastId}`, {
                headers: chatHeaders(current.token),
            });
            if (!response.ok) return;
            const payload = (await response.json()) as { messages: ChatMessage[] };
            if (payload.messages.length > 0) {
                setMessages((previous) => {
                    const known = new Set(previous.map((message) => message.id));
                    return [...previous, ...payload.messages.filter((message) => !known.has(message.id))];
                });
            }
        } catch {
            // Silent: transient network issues must not disturb the widget.
        }
    }, []);

    const messagesRef = useRef<ChatMessage[]>([]);
    messagesRef.current = messages;

    const openChat = async () => {
        setOpen(true);
        if (conversationRef.current) return;
        setLoading(true);
        setError(null);
        const created = await ensureConversation();
        setLoading(false);
        if (!created) {
            setError('در حال حاضر پشتیبانی در دسترس نیست. لطفاً بعداً تلاش کنید.');
            return;
        }
        setConversation(created);
        await loadMessages();
    };

    useEffect(() => {
        if (!open || !conversation) return;
        const timer = window.setInterval(loadMessages, POLL_INTERVAL);
        return () => window.clearInterval(timer);
    }, [open, conversation, loadMessages]);

    const send = async (event: { preventDefault: () => void }) => {
        event.preventDefault();
        const current = conversationRef.current;
        const body = draft.trim();
        if (!current || !body || sending) return;

        setSending(true);
        setError(null);
        setDraft('');

        try {
            const response = await fetch(`/support-chat/conversations/${current.id}/messages`, {
                method: 'POST',
                headers: chatHeaders(current.token),
                body: JSON.stringify({ body }),
            });
            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as { message?: string } | null;
                setError(payload?.message ?? 'ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.');
                return;
            }
            const payload = (await response.json()) as { messages: ChatMessage[] };
            setMessages((previous) => {
                const known = new Set(previous.map((message) => message.id));
                return [...previous, ...payload.messages.filter((message) => !known.has(message.id))];
            });
        } catch {
            setError('ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.');
        } finally {
            setSending(false);
        }
    };

    if (!chat?.enabled) return null;

    return (
        <>
            {open && (
                <section
                    role="dialog"
                    aria-label={chat.title}
                    className="fixed bottom-24 right-5 z-[70] flex h-[34rem] max-h-[calc(100vh-7.5rem)] w-[22.5rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-navy/10"
                >
                    {/* Header */}
                    <div className="relative overflow-hidden bg-deep-gradient px-5 py-4 text-white">
                        <div className="pointer-events-none absolute -left-10 -top-12 size-32 rounded-full bg-brand-400/20 blur-2xl" aria-hidden />
                        <div className="relative flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="flex size-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                                    <Headset className="size-5" aria-hidden />
                                </span>
                                <div className="leading-tight">
                                    <div className="text-sm font-black">{chat.title}</div>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-[0.68rem] font-bold text-white/70">
                                        <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
                                        کارشناسان آنلاین هستند
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex size-8 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-white/20"
                                aria-label="بستن پنجره پشتیبانی"
                            >
                                <X className="size-4" aria-hidden />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-soft-gray px-4 py-4">
                        {!loading && conversation && (
                            <div className="flex items-start gap-2.5">
                                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                                    <Bot className="size-4" aria-hidden />
                                </span>
                                <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-white px-4 py-3 text-[0.8rem] leading-6 text-navy/80 shadow-soft">
                                    {chat.greeting}
                                </div>
                            </div>
                        )}
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-start flex-row-reverse' : ''}`}
                            >
                                <span
                                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                                        message.sender === 'user' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'
                                    }`}
                                    aria-hidden
                                >
                                    {message.sender === 'user' ? (
                                        <span className="text-[0.6rem] font-black">شما</span>
                                    ) : (
                                        <Bot className="size-3.5" />
                                    )}
                                </span>
                                <div className="flex max-w-[78%] flex-col">
                                    <div
                                        className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[0.8rem] leading-6 shadow-soft ${
                                            message.sender === 'user'
                                                ? 'rounded-tl-md bg-brand-600 text-white'
                                                : 'rounded-tr-md bg-white text-navy/85'
                                        }`}
                                    >
                                        {message.body}
                                    </div>
                                    <span className="mt-1 px-1 text-[0.62rem] font-bold text-navy/35">
                                        {formatTime(message.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {sending && (
                            <div className="flex items-center gap-2 text-xs font-bold text-navy/45">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                                    <Bot className="size-3.5" aria-hidden />
                                </span>
                                <span className="flex gap-1">
                                    <span className="size-1.5 animate-bounce rounded-full bg-navy/40" />
                                    <span className="size-1.5 animate-bounce rounded-full bg-navy/40 [animation-delay:120ms]" />
                                    <span className="size-1.5 animate-bounce rounded-full bg-navy/40 [animation-delay:240ms]" />
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-[0.7rem] font-bold text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Composer */}
                    <form onSubmit={send} className="flex items-end gap-2 border-t border-navy/10 bg-white p-3">
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    send(event);
                                }
                            }}
                            rows={1}
                            placeholder="پیام خود را بنویسید..."
                            aria-label="متن پیام"
                            className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-navy/10 bg-soft-gray px-4 py-2.5 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-200/40"
                        />
                        <button
                            type="submit"
                            disabled={sending || !draft.trim()}
                            className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95 disabled:opacity-50"
                            aria-label="ارسال پیام"
                        >
                            <Send className="size-4.5" aria-hidden />
                        </button>
                    </form>
                </section>
            )}

            {/* Launcher */}
            <button
                type="button"
                onClick={openChat}
                className="fixed bottom-5 right-5 z-[70] flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-deep-green text-white shadow-glow transition-all hover:scale-105 hover:from-brand-700 hover:to-brand-800 active:scale-95"
                aria-label="پشتیبانی زنده"
                title={chat.title}
            >
                <Headset className="size-6" aria-hidden />
                <span className="absolute -right-0.5 -top-0.5 flex size-3.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" aria-hidden />
                    <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-emerald-500" aria-hidden />
                </span>
            </button>
        </>
    );
}
