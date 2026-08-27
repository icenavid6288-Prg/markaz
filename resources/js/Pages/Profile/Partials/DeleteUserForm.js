import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from '@inertiajs/react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import Modal from '@/Components/Modal';
export default function DeleteUserForm({ className = '' }) {
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef(null);
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({ password: '' });
    const closeModal = () => {
        setConfirming(false);
        clearErrors();
        reset();
    };
    const deleteUser = (event) => {
        event.preventDefault();
        destroy('/profile', {
            preserveScroll: true,
            onSuccess: closeModal,
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };
    return (_jsxs("section", { className: `profile-delete ${className}`, children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("span", { className: "profile-icon profile-icon-danger", children: _jsx(AlertTriangle, { className: "size-5" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-black text-red-700 dark:text-red-300", children: "\u062D\u0630\u0641 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC" }), _jsx("p", { className: "mt-1 text-xs leading-6 text-red-900/60 dark:text-red-100/60", children: "\u0627\u06CC\u0646 \u0639\u0645\u0644\u06CC\u0627\u062A \u062F\u0627\u0626\u0645\u06CC \u0627\u0633\u062A \u0648 \u062F\u0648\u0631\u0647\u200C\u0647\u0627\u060C \u0633\u0641\u0627\u0631\u0634\u200C\u0647\u0627 \u0648 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u062D\u0633\u0627\u0628 \u0634\u0645\u0627 \u0631\u0627 \u062D\u0630\u0641 \u0645\u06CC\u200C\u06A9\u0646\u062F." })] })] }), _jsxs("button", { type: "button", onClick: () => setConfirming(true), className: "mt-5 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-black text-red-600 transition-colors hover:bg-red-50 dark:border-red-300/20 dark:bg-white/5 dark:text-red-300", children: [_jsx(Trash2, { className: "size-4" }), " \u062D\u0630\u0641 \u062D\u0633\u0627\u0628"] }), _jsx(Modal, { show: confirming, onClose: closeModal, children: _jsxs("form", { onSubmit: deleteUser, className: "profile-delete-modal p-6", dir: "rtl", children: [_jsx("h2", { className: "text-lg font-black text-navy", children: "\u0622\u06CC\u0627 \u0627\u0632 \u062D\u0630\u0641 \u062D\u0633\u0627\u0628 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062A\u06CC\u062F\u061F" }), _jsx("p", { className: "mt-2 text-sm leading-7 text-navy/55", children: "\u0628\u0631\u0627\u06CC \u062A\u0623\u06CC\u06CC\u062F \u0646\u0647\u0627\u06CC\u06CC\u060C \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0641\u0639\u0644\u06CC \u062E\u0648\u062F \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F. \u0627\u06CC\u0646 \u0627\u0642\u062F\u0627\u0645 \u0642\u0627\u0628\u0644 \u0628\u0627\u0632\u06AF\u0634\u062A \u0646\u06CC\u0633\u062A." }), _jsx("label", { htmlFor: "delete-password", className: "mt-5 block text-xs font-black text-navy/70", children: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631" }), _jsx("input", { id: "delete-password", ref: passwordInput, type: "password", value: data.password, onChange: (event) => setData('password', event.target.value), className: "mt-2 w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100", autoComplete: "current-password", autoFocus: true }), errors.password && _jsx("p", { className: "mt-2 text-xs font-bold text-red-600", children: errors.password }), _jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [_jsx("button", { type: "button", onClick: closeModal, className: "rounded-xl border border-navy/10 px-4 py-2.5 text-xs font-black text-navy/60", children: "\u0627\u0646\u0635\u0631\u0627\u0641" }), _jsxs("button", { type: "submit", disabled: processing, className: "inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50", children: [_jsx(Trash2, { className: "size-4" }), " ", processing ? 'در حال حذف...' : 'حذف دائمی حساب'] })] })] }) })] }));
}
