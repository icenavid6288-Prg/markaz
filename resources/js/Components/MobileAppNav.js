import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, usePage } from '@inertiajs/react';
export default function MobileAppNav({ items, ariaLabel = 'ناوبری سریع اپلیکیشن' }) {
    const { url } = usePage();
    const isActive = (item) => {
        if (typeof item.active === 'boolean')
            return item.active;
        if (!item.href || item.href.startsWith('#'))
            return false;
        if (item.href === '/')
            return url === '/';
        if (item.href === '/dashboard')
            return url === '/dashboard';
        return url === item.href || url.startsWith(`${item.href}/`);
    };
    return (_jsx("nav", { className: "mobile-app-nav", "aria-label": ariaLabel, children: _jsx("div", { className: "mobile-app-nav-inner", children: items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                const content = (_jsxs(_Fragment, { children: [_jsx("span", { className: "mobile-app-nav-icon", children: _jsx(Icon, { className: "size-[1.15rem]", strokeWidth: active ? 2.4 : 1.9, "aria-hidden": true }) }), _jsx("span", { className: "mobile-app-nav-label", children: item.label })] }));
                if (item.onClick) {
                    return (_jsx("button", { type: "button", onClick: item.onClick, className: `mobile-app-nav-item ${active ? 'is-active' : ''}`, children: content }, item.label));
                }
                return (_jsx(Link, { href: item.href ?? '/', className: `mobile-app-nav-item ${active ? 'is-active' : ''}`, children: content }, item.label));
            }) }) }));
}
