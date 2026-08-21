import { Headset, MessageSquare, RefreshCw, Send, UserRound } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

type Conversation = {
    id: number;
    status: string;
    user: { name: string; phone: string | null } | null;
    message_count: number;
    last_message_at: string | null;
    last_message: string | null;
};

type ChatMessage = { id: number; sender: 'user' | 'ai' | 'admin'; body: string; created_at: string | null };

function formatTime(iso: string | null): string {
    if (!iso) return '';
    try {
        return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    } catch {
        return '';
    }
}

function formatDay(iso: string | null): string {
    if (!iso) return '';
    try {
        const date = new Date(iso);
        const today = new Date();
        const sameDay = date.toDateString() === today.toDateString();
        return new Intl.DateTimeFormat('fa-IR', sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }).format(date);
    } catch {
        return '';
    }
}

export default function SupportChat({ conversations }: { conversations: Conversation[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<ChatMessage[]>([]);
    messagesRef.current = messages;

    const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;

    const loadMessages = async (conversationId: number) => {
        const lastId = messagesRef.current.at(-1)?.id ?? 0;
        try {
            const response = await fetch(`/admin/support-chat/${conversationId}/messages?after_id=${lastId}`, {
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '' },
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
            // Silent: polling must never crash the panel.
        }
    };

    const selectConversation = async (conversation: Conversation) => {
        setSelectedId(conversation.id);
        setMessages([]);
        setLoading(true);
        await loadMessages(conversation.id);
        setLoading(false);
    };

    useEffect(() => {
        if (!selectedId) return;
        const timer = window.setInterval(() => loadMessages(selectedId), 5000);
        return () => window.clearInterval(timer);
    }, [selectedId]);

    useEffect(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, selectedId]);

    const reply = async (event: FormEvent) => {
        event.preventDefault();
        if (!selectedId || !draft.trim() || sending) return;
        const body = draft.trim();
        setSending(true);
        setDraft('');
        try {
            const response = await fetch(`/admin/support-chat/${selectedId}/reply`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({ body }),
            });
            if (!response.ok) return;
            const payload = (await response.json()) as { message: ChatMessage };
            setMessages((previous) => [...previous, payload.message]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 lg:flex-row">
            {/* Conversation list */}
            <aside className="lg:w-80 lg:shrink-0">
                <div className="rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
                    <div className="flex items-center justify-between border-b border-navy/5 px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <span className="glass-tile"><Headset className="size-4.5" /></span>
                            <h2 className="text-sm font-black text-navy">گفتگوهای زنده</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => selectedId && loadMessages(selectedId)}
                            className="rounded-lg p-1.5 text-navy/40 transition-colors hover:bg-soft-gray hover:text-navy"
                            aria-label="به‌روزرسانی"
                        >
                            <RefreshCw className="size-4" />
                        </button>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto p-2">
                        {conversations.length === 0 && (
                            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                                <MessageSquare className="size-8 text-navy/25" aria-hidden />
                                <p className="text-xs font-bold text-navy/45">هنوز گفتگویی ثبت نشده است.</p>
                            </div>
                        )}
                        {conversations.map((conversation) => {
                            const active = conversation.id === selectedId;
                            return (
                                <button
                                    key={conversation.id}
                                    type="button"
                                    onClick={() => selectConversation(conversation)}
                                    className={`flex w-full flex-col gap-1.5 rounded-xl px-3.5 py-3 text-right transition-colors ${active ? 'bg-brand-50' : 'hover:bg-soft-gray'}`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${conversation.user ? 'bg-brand-100 text-brand-800' : 'bg-navy/10 text-navy/55'}`}>
                                            {conversation.user ? conversation.user.name.slice(0, 1) : <UserRound className="size-4" aria-hidden />}
                                        </span>
                                        <span className="truncate text-sm font-black text-navy">
                                            {conversation.user ? conversation.user.name : 'مهمان'}
                                        </span>
                                        <span className="shrink-0 text-[0.62rem] font-bold text-navy/35">
                                            {formatDay(conversation.last_message_at)}
                                        </span>
                                    </div>
                                    <p className="truncate pl-4 text-[0.7rem] leading-5 text-navy/50">
                                        {conversation.last_message ?? 'بدون پیام'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[0.62rem] font-bold text-navy/35">
                                            {conversation.message_count} پیام
                                        </span>
                                        <span className={`rounded-md px-1.5 py-0.5 text-[0.6rem] font-black ${conversation.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-navy/10 text-navy/45'}`}>
                                            {conversation.status === 'open' ? 'باز' : 'بسته'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </aside>

            {/* Chat window */}
            <section className="flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5">
                {!selected ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
                        <span className="glass-tile"><Headset className="size-8 text-brand-600" /></span>
                        <h3 className="text-base font-black text-navy">یک گفتگو را انتخاب کنید</h3>
                        <p className="max-w-sm text-xs leading-6 text-navy/45">
                            گفتگوهای زنده بازدیدکنندگان سایت اینجا نمایش داده می‌شوند. با انتخاب هر گفتگو می‌توانید پیام‌ها را ببینید و به‌عنوان کارشناس پاسخ دهید.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 border-b border-navy/5 px-5 py-4">
                            <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-xs font-black text-brand-800">
                                {selected.user ? selected.user.name.slice(0, 1) : <UserRound className="size-4" aria-hidden />}
                            </span>
                            <div className="min-w-0 flex-1 leading-tight">
                                <div className="truncate text-sm font-black text-navy">
                                    {selected.user ? selected.user.name : 'مهمان'}
                                </div>
                                <div className="mt-0.5 truncate text-[0.68rem] font-bold text-navy/45" dir="ltr">
                                    {selected.user?.phone ?? 'بدون شماره'}
                                </div>
                            </div>
                            <span className="rounded-md bg-emerald-50 px-2 py-1 text-[0.62rem] font-black text-emerald-700">
                                آنلاین
                            </span>
                        </div>

                        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-soft-gray px-4 py-4">
                            {loading && (
                                <div className="flex justify-center py-8 text-xs font-bold text-navy/40">
                                    در حال بارگذاری پیام‌ها...
                                </div>
                            )}
                            {!loading && messages.length === 0 && (
                                <div className="flex justify-center py-8 text-xs font-bold text-navy/40">
                                    هنوز پیامی در این گفتگو نیست.
                                </div>
                            )}
                            {messages.map((message) => (
                                <div key={message.id} className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-start flex-row-reverse' : ''}`}>
                                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${message.sender === 'user' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'}`} aria-hidden>
                                        {message.sender === 'user' ? (
                                            <UserRound className="size-3.5" />
                                        ) : (
                                            <Headset className="size-3.5" />
                                        )}
                                    </span>
                                    <div className="flex max-w-[78%] flex-col">
                                        <div className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[0.8rem] leading-6 shadow-soft ${message.sender === 'user' ? 'rounded-tl-md bg-brand-600 text-white' : 'rounded-tr-md bg-white text-navy/85'}`}>
                                            {message.body}
                                        </div>
                                        <span className="mt-1 px-1 text-[0.62rem] font-bold text-navy/35">
                                            {message.sender === 'admin' ? 'شما · ' : message.sender === 'ai' ? 'هوش مصنوعی · ' : ''}
                                            {formatTime(message.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={reply} className="flex items-end gap-2 border-t border-navy/10 bg-white p-3">
                            <textarea
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault();
                                        reply(event);
                                    }
                                }}
                                rows={1}
                                placeholder="پاسخ کارشناس را بنویسید..."
                                aria-label="متن پاسخ"
                                className="max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-navy/10 bg-soft-gray px-4 py-2.5 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-200/40"
                            />
                            <button
                                type="submit"
                                disabled={sending || !draft.trim()}
                                className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95 disabled:opacity-50"
                                aria-label="ارسال پاسخ"
                            >
                                <Send className="size-4.5" aria-hidden />
                            </button>
                        </form>
                    </>
                )}
            </section>
        </div>
    );
}

SupportChat.layout = (page: ReactNode) => <AdminLayout title="پشتیبانی زنده">{page}</AdminLayout>;
