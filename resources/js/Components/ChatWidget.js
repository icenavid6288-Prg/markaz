import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { usePage } from '@inertiajs/react';
import { Bot, Headset, Send, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
const TOKEN_KEY = 'markaz-chat-token';
const POLL_INTERVAL = 4000;
function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
}
function formatTime(iso) {
    if (!iso)
        return '';
    try {
        return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    }
    catch {
        return '';
    }
}
function chatHeaders(token) {
    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken(),
    };
    if (token)
        headers['X-Chat-Token'] = token;
    return headers;
}
export default function ChatWidget() {
    const { site } = usePage().props;
    const chat = site.chat;
    const [open, setOpen] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const listRef = useRef(null);
    const conversationRef = useRef(null);
    conversationRef.current = conversation;
    const scrollToBottom = () => {
        const el = listRef.current;
        if (el)
            el.scrollTop = el.scrollHeight;
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages, open]);
    const ensureConversation = useCallback(async () => {
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
            if (!response.ok)
                return null;
            const payload = (await response.json());
            return payload.conversation;
        }
        catch {
            return null;
        }
    }, []);
    const loadMessages = useCallback(async () => {
        const current = conversationRef.current;
        if (!current)
            return;
        const lastId = messagesRef.current.at(-1)?.id ?? 0;
        try {
            const response = await fetch(`/support-chat/conversations/${current.id}/messages?after_id=${lastId}`, {
                headers: chatHeaders(current.token),
            });
            if (!response.ok)
                return;
            const payload = (await response.json());
            if (payload.messages.length > 0) {
                setMessages((previous) => {
                    const known = new Set(previous.map((message) => message.id));
                    return [...previous, ...payload.messages.filter((message) => !known.has(message.id))];
                });
            }
        }
        catch {
            // Silent: transient network issues must not disturb the widget.
        }
    }, []);
    const messagesRef = useRef([]);
    messagesRef.current = messages;
    const openChat = async () => {
        setOpen(true);
        if (conversationRef.current)
            return;
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
        if (!open || !conversation)
            return;
        const timer = window.setInterval(loadMessages, POLL_INTERVAL);
        return () => window.clearInterval(timer);
    }, [open, conversation, loadMessages]);
    const send = async (event) => {
        event.preventDefault();
        const current = conversationRef.current;
        const body = draft.trim();
        if (!current || !body || sending)
            return;
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
                const payload = (await response.json().catch(() => null));
                setError(payload?.message ?? 'ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.');
                return;
            }
            const payload = (await response.json());
            setMessages((previous) => {
                const known = new Set(previous.map((message) => message.id));
                return [...previous, ...payload.messages.filter((message) => !known.has(message.id))];
            });
        }
        catch {
            setError('ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.');
        }
        finally {
            setSending(false);
        }
    };
    if (!chat?.enabled)
        return null;
    return (_jsxs(_Fragment, { children: [open && (_jsxs("section", { role: "dialog", "aria-label": chat.title, className: "fixed bottom-24 right-5 z-[70] flex h-[34rem] max-h-[calc(100vh-7.5rem)] w-[22.5rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-lift ring-1 ring-navy/10", children: [_jsxs("div", { className: "relative overflow-hidden bg-deep-gradient px-5 py-4 text-white", children: [_jsx("div", { className: "pointer-events-none absolute -left-10 -top-12 size-32 rounded-full bg-brand-400/20 blur-2xl", "aria-hidden": true }), _jsxs("div", { className: "relative flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "flex size-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md", children: _jsx(Headset, { className: "size-5", "aria-hidden": true }) }), _jsxs("div", { className: "leading-tight", children: [_jsx("div", { className: "text-sm font-black", children: chat.title }), _jsxs("div", { className: "mt-0.5 flex items-center gap-1.5 text-[0.68rem] font-bold text-white/70", children: [_jsx("span", { className: "size-1.5 rounded-full bg-emerald-400", "aria-hidden": true }), "\u06A9\u0627\u0631\u0634\u0646\u0627\u0633\u0627\u0646 \u0622\u0646\u0644\u0627\u06CC\u0646 \u0647\u0633\u062A\u0646\u062F"] })] })] }), _jsx("button", { type: "button", onClick: () => setOpen(false), className: "flex size-8 items-center justify-center rounded-xl bg-white/10 text-white/80 transition-colors hover:bg-white/20", "aria-label": "\u0628\u0633\u062A\u0646 \u067E\u0646\u062C\u0631\u0647 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC", children: _jsx(X, { className: "size-4", "aria-hidden": true }) })] })] }), _jsxs("div", { ref: listRef, className: "flex-1 space-y-3 overflow-y-auto bg-soft-gray px-4 py-4", children: [!loading && conversation && (_jsxs("div", { className: "flex items-start gap-2.5", children: [_jsx("span", { className: "mt-1 flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700", children: _jsx(Bot, { className: "size-4", "aria-hidden": true }) }), _jsx("div", { className: "max-w-[80%] rounded-2xl rounded-tr-md bg-white px-4 py-3 text-[0.8rem] leading-6 text-navy/80 shadow-soft", children: chat.greeting })] })), messages.map((message) => (_jsxs("div", { className: `flex items-end gap-2 ${message.sender === 'user' ? 'justify-start flex-row-reverse' : ''}`, children: [_jsx("span", { className: `flex size-7 shrink-0 items-center justify-center rounded-lg ${message.sender === 'user' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'}`, "aria-hidden": true, children: message.sender === 'user' ? (_jsx("span", { className: "text-[0.6rem] font-black", children: "\u0634\u0645\u0627" })) : (_jsx(Bot, { className: "size-3.5" })) }), _jsxs("div", { className: "flex max-w-[78%] flex-col", children: [_jsx("div", { className: `whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[0.8rem] leading-6 shadow-soft ${message.sender === 'user'
                                                    ? 'rounded-tl-md bg-brand-600 text-white'
                                                    : 'rounded-tr-md bg-white text-navy/85'}`, children: message.body }), _jsx("span", { className: "mt-1 px-1 text-[0.62rem] font-bold text-navy/35", children: formatTime(message.created_at) })] })] }, message.id))), sending && (_jsxs("div", { className: "flex items-center gap-2 text-xs font-bold text-navy/45", children: [_jsx("span", { className: "flex size-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700", children: _jsx(Bot, { className: "size-3.5", "aria-hidden": true }) }), _jsxs("span", { className: "flex gap-1", children: [_jsx("span", { className: "size-1.5 animate-bounce rounded-full bg-navy/40" }), _jsx("span", { className: "size-1.5 animate-bounce rounded-full bg-navy/40 [animation-delay:120ms]" }), _jsx("span", { className: "size-1.5 animate-bounce rounded-full bg-navy/40 [animation-delay:240ms]" })] })] }))] }), error && (_jsx("div", { className: "border-t border-red-100 bg-red-50 px-4 py-2 text-[0.7rem] font-bold text-red-700", children: error })), _jsxs("form", { onSubmit: send, className: "flex items-end gap-2 border-t border-navy/10 bg-white p-3", children: [_jsx("textarea", { value: draft, onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => {
                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        event.preventDefault();
                                        send(event);
                                    }
                                }, rows: 1, placeholder: "\u067E\u06CC\u0627\u0645 \u062E\u0648\u062F \u0631\u0627 \u0628\u0646\u0648\u06CC\u0633\u06CC\u062F...", "aria-label": "\u0645\u062A\u0646 \u067E\u06CC\u0627\u0645", className: "max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-navy/10 bg-soft-gray px-4 py-2.5 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-200/40" }), _jsx("button", { type: "submit", disabled: sending || !draft.trim(), className: "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95 disabled:opacity-50", "aria-label": "\u0627\u0631\u0633\u0627\u0644 \u067E\u06CC\u0627\u0645", children: _jsx(Send, { className: "size-4.5", "aria-hidden": true }) })] })] })), _jsxs("button", { type: "button", onClick: openChat, className: "fixed bottom-5 right-5 z-[70] flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-deep-green text-white shadow-glow transition-all hover:scale-105 hover:from-brand-700 hover:to-brand-800 active:scale-95", "aria-label": "\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0632\u0646\u062F\u0647", title: chat.title, children: [_jsx(Headset, { className: "size-6", "aria-hidden": true }), _jsxs("span", { className: "absolute -right-0.5 -top-0.5 flex size-3.5", children: [_jsx("span", { className: "absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60", "aria-hidden": true }), _jsx("span", { className: "relative inline-flex size-3.5 rounded-full border-2 border-white bg-emerald-500", "aria-hidden": true })] })] })] }));
}
