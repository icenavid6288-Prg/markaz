import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Headset, MessageSquare, RefreshCw, Send, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
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
function formatDay(iso) {
    if (!iso)
        return '';
    try {
        const date = new Date(iso);
        const today = new Date();
        const sameDay = date.toDateString() === today.toDateString();
        return new Intl.DateTimeFormat('fa-IR', sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }).format(date);
    }
    catch {
        return '';
    }
}
export default function SupportChat({ conversations }) {
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const listRef = useRef(null);
    const messagesRef = useRef([]);
    messagesRef.current = messages;
    const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;
    const loadMessages = async (conversationId) => {
        const lastId = messagesRef.current.at(-1)?.id ?? 0;
        try {
            const response = await fetch(`/admin/support-chat/${conversationId}/messages?after_id=${lastId}`, {
                headers: { Accept: 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '' },
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
            // Silent: polling must never crash the panel.
        }
    };
    const selectConversation = async (conversation) => {
        setSelectedId(conversation.id);
        setMessages([]);
        setLoading(true);
        await loadMessages(conversation.id);
        setLoading(false);
    };
    useEffect(() => {
        if (!selectedId)
            return;
        const timer = window.setInterval(() => loadMessages(selectedId), 5000);
        return () => window.clearInterval(timer);
    }, [selectedId]);
    useEffect(() => {
        const el = listRef.current;
        if (el)
            el.scrollTop = el.scrollHeight;
    }, [messages, selectedId]);
    const reply = async (event) => {
        event.preventDefault();
        if (!selectedId || !draft.trim() || sending)
            return;
        const body = draft.trim();
        setSending(true);
        setDraft('');
        try {
            const response = await fetch(`/admin/support-chat/${selectedId}/reply`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({ body }),
            });
            if (!response.ok)
                return;
            const payload = (await response.json());
            setMessages((previous) => [...previous, payload.message]);
        }
        finally {
            setSending(false);
        }
    };
    return (_jsxs("div", { className: "flex flex-col gap-6 lg:flex-row", children: [_jsx("aside", { className: "lg:w-80 lg:shrink-0", children: _jsxs("div", { className: "rounded-2xl bg-white shadow-soft ring-1 ring-navy/5", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-navy/5 px-5 py-4", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("span", { className: "glass-tile", children: _jsx(Headset, { className: "size-4.5" }) }), _jsx("h2", { className: "text-sm font-black text-navy", children: "\u06AF\u0641\u062A\u06AF\u0648\u0647\u0627\u06CC \u0632\u0646\u062F\u0647" })] }), _jsx("button", { type: "button", onClick: () => selectedId && loadMessages(selectedId), className: "rounded-lg p-1.5 text-navy/40 transition-colors hover:bg-soft-gray hover:text-navy", "aria-label": "\u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC", children: _jsx(RefreshCw, { className: "size-4" }) })] }), _jsxs("div", { className: "max-h-[70vh] overflow-y-auto p-2", children: [conversations.length === 0 && (_jsxs("div", { className: "flex flex-col items-center gap-2 px-4 py-12 text-center", children: [_jsx(MessageSquare, { className: "size-8 text-navy/25", "aria-hidden": true }), _jsx("p", { className: "text-xs font-bold text-navy/45", children: "\u0647\u0646\u0648\u0632 \u06AF\u0641\u062A\u06AF\u0648\u06CC\u06CC \u062B\u0628\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A." })] })), conversations.map((conversation) => {
                                    const active = conversation.id === selectedId;
                                    return (_jsxs("button", { type: "button", onClick: () => selectConversation(conversation), className: `flex w-full flex-col gap-1.5 rounded-xl px-3.5 py-3 text-right transition-colors ${active ? 'bg-brand-50' : 'hover:bg-soft-gray'}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: `flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${conversation.user ? 'bg-brand-100 text-brand-800' : 'bg-navy/10 text-navy/55'}`, children: conversation.user ? conversation.user.name.slice(0, 1) : _jsx(UserRound, { className: "size-4", "aria-hidden": true }) }), _jsx("span", { className: "truncate text-sm font-black text-navy", children: conversation.user ? conversation.user.name : 'مهمان' }), _jsx("span", { className: "shrink-0 text-[0.62rem] font-bold text-navy/35", children: formatDay(conversation.last_message_at) })] }), _jsx("p", { className: "truncate pl-4 text-[0.7rem] leading-5 text-navy/50", children: conversation.last_message ?? 'بدون پیام' }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-[0.62rem] font-bold text-navy/35", children: [conversation.message_count, " \u067E\u06CC\u0627\u0645"] }), _jsx("span", { className: `rounded-md px-1.5 py-0.5 text-[0.6rem] font-black ${conversation.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-navy/10 text-navy/45'}`, children: conversation.status === 'open' ? 'باز' : 'بسته' })] })] }, conversation.id));
                                })] })] }) }), _jsx("section", { className: "flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-navy/5", children: !selected ? (_jsxs("div", { className: "flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center", children: [_jsx("span", { className: "glass-tile", children: _jsx(Headset, { className: "size-8 text-brand-600" }) }), _jsx("h3", { className: "text-base font-black text-navy", children: "\u06CC\u06A9 \u06AF\u0641\u062A\u06AF\u0648 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F" }), _jsx("p", { className: "max-w-sm text-xs leading-6 text-navy/45", children: "\u06AF\u0641\u062A\u06AF\u0648\u0647\u0627\u06CC \u0632\u0646\u062F\u0647 \u0628\u0627\u0632\u062F\u06CC\u062F\u06A9\u0646\u0646\u062F\u06AF\u0627\u0646 \u0633\u0627\u06CC\u062A \u0627\u06CC\u0646\u062C\u0627 \u0646\u0645\u0627\u06CC\u0634 \u062F\u0627\u062F\u0647 \u0645\u06CC\u200C\u0634\u0648\u0646\u062F. \u0628\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u0647\u0631 \u06AF\u0641\u062A\u06AF\u0648 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u067E\u06CC\u0627\u0645\u200C\u0647\u0627 \u0631\u0627 \u0628\u0628\u06CC\u0646\u06CC\u062F \u0648 \u0628\u0647\u200C\u0639\u0646\u0648\u0627\u0646 \u06A9\u0627\u0631\u0634\u0646\u0627\u0633 \u067E\u0627\u0633\u062E \u062F\u0647\u06CC\u062F." })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-3 border-b border-navy/5 px-5 py-4", children: [_jsx("span", { className: "flex size-9 items-center justify-center rounded-full bg-brand-100 text-xs font-black text-brand-800", children: selected.user ? selected.user.name.slice(0, 1) : _jsx(UserRound, { className: "size-4", "aria-hidden": true }) }), _jsxs("div", { className: "min-w-0 flex-1 leading-tight", children: [_jsx("div", { className: "truncate text-sm font-black text-navy", children: selected.user ? selected.user.name : 'مهمان' }), _jsx("div", { className: "mt-0.5 truncate text-[0.68rem] font-bold text-navy/45", dir: "ltr", children: selected.user?.phone ?? 'بدون شماره' })] }), _jsx("span", { className: "rounded-md bg-emerald-50 px-2 py-1 text-[0.62rem] font-black text-emerald-700", children: "\u0622\u0646\u0644\u0627\u06CC\u0646" })] }), _jsxs("div", { ref: listRef, className: "flex-1 space-y-3 overflow-y-auto bg-soft-gray px-4 py-4", children: [loading && (_jsx("div", { className: "flex justify-center py-8 text-xs font-bold text-navy/40", children: "\u062F\u0631 \u062D\u0627\u0644 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u067E\u06CC\u0627\u0645\u200C\u0647\u0627..." })), !loading && messages.length === 0 && (_jsx("div", { className: "flex justify-center py-8 text-xs font-bold text-navy/40", children: "\u0647\u0646\u0648\u0632 \u067E\u06CC\u0627\u0645\u06CC \u062F\u0631 \u0627\u06CC\u0646 \u06AF\u0641\u062A\u06AF\u0648 \u0646\u06CC\u0633\u062A." })), messages.map((message) => (_jsxs("div", { className: `flex items-end gap-2 ${message.sender === 'user' ? 'justify-start flex-row-reverse' : ''}`, children: [_jsx("span", { className: `flex size-7 shrink-0 items-center justify-center rounded-lg ${message.sender === 'user' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'}`, "aria-hidden": true, children: message.sender === 'user' ? (_jsx(UserRound, { className: "size-3.5" })) : (_jsx(Headset, { className: "size-3.5" })) }), _jsxs("div", { className: "flex max-w-[78%] flex-col", children: [_jsx("div", { className: `whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[0.8rem] leading-6 shadow-soft ${message.sender === 'user' ? 'rounded-tl-md bg-brand-600 text-white' : 'rounded-tr-md bg-white text-navy/85'}`, children: message.body }), _jsxs("span", { className: "mt-1 px-1 text-[0.62rem] font-bold text-navy/35", children: [message.sender === 'admin' ? 'شما · ' : message.sender === 'ai' ? 'هوش مصنوعی · ' : '', formatTime(message.created_at)] })] })] }, message.id)))] }), _jsxs("form", { onSubmit: reply, className: "flex items-end gap-2 border-t border-navy/10 bg-white p-3", children: [_jsx("textarea", { value: draft, onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            reply(event);
                                        }
                                    }, rows: 1, placeholder: "\u067E\u0627\u0633\u062E \u06A9\u0627\u0631\u0634\u0646\u0627\u0633 \u0631\u0627 \u0628\u0646\u0648\u06CC\u0633\u06CC\u062F...", "aria-label": "\u0645\u062A\u0646 \u067E\u0627\u0633\u062E", className: "max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-navy/10 bg-soft-gray px-4 py-2.5 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-200/40" }), _jsx("button", { type: "submit", disabled: sending || !draft.trim(), className: "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-l from-brand-600 to-brand-500 text-white shadow-glow transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95 disabled:opacity-50", "aria-label": "\u0627\u0631\u0633\u0627\u0644 \u067E\u0627\u0633\u062E", children: _jsx(Send, { className: "size-4.5", "aria-hidden": true }) })] })] })) })] }));
}
SupportChat.layout = (page) => _jsx(AdminLayout, { title: "\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0632\u0646\u062F\u0647", children: page });
