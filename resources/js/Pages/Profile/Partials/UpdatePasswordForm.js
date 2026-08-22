import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from '@inertiajs/react';
import { CheckCircle2, KeyRound } from 'lucide-react';
export default function UpdatePasswordForm({ className = '' }) {
    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const updatePassword = (event) => {
        event.preventDefault();
        put('/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };
    return (_jsxs("form", { onSubmit: updatePassword, className: `profile-form ${className}`, children: [_jsxs("div", { className: "grid gap-5 md:grid-cols-3", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "current_password", children: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0641\u0639\u0644\u06CC" }), _jsx("input", { id: "current_password", type: "password", value: data.current_password, onChange: (event) => setData('current_password', event.target.value), autoComplete: "current-password" }), errors.current_password && _jsx("p", { className: "profile-error", children: errors.current_password })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", children: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062C\u062F\u06CC\u062F" }), _jsx("input", { id: "password", type: "password", value: data.password, onChange: (event) => setData('password', event.target.value), autoComplete: "new-password" }), errors.password && _jsx("p", { className: "profile-error", children: errors.password })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password_confirmation", children: "\u062A\u06A9\u0631\u0627\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062C\u062F\u06CC\u062F" }), _jsx("input", { id: "password_confirmation", type: "password", value: data.password_confirmation, onChange: (event) => setData('password_confirmation', event.target.value), autoComplete: "new-password" }), errors.password_confirmation && _jsx("p", { className: "profile-error", children: errors.password_confirmation })] })] }), _jsxs("div", { className: "mt-6 flex flex-wrap items-center gap-3", children: [_jsxs("button", { type: "submit", disabled: processing, className: "profile-submit", children: [_jsx(KeyRound, { className: "size-4" }), " ", processing ? 'در حال ذخیره...' : 'تغییر رمز عبور'] }), recentlySuccessful && _jsxs("span", { className: "profile-success", children: [_jsx(CheckCircle2, { className: "size-4" }), " \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u06A9\u0631\u062F."] })] })] }));
}
