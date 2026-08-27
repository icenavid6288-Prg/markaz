import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowUpLeft, BriefcaseBusiness, Compass, GraduationCap, Lightbulb, Route, Sparkles, TrendingUp, Users, } from 'lucide-react';
const visuals = {
    coaching: { Icon: Compass, label: 'همراهی', index: '۰۱' },
    talent: { Icon: Sparkles, label: 'کشف', index: '۰۲' },
    academic: { Icon: GraduationCap, label: 'یادگیری', index: '۰۳' },
    trainer: { Icon: Users, label: 'توانمندسازی', index: '۰۴' },
    business: { Icon: BriefcaseBusiness, label: 'رشد حرفه‌ای', index: '۰۵' },
    default: { Icon: Lightbulb, label: 'رشد', index: '—' },
};
export function getServiceVisualIcon(variant) {
    return visuals[variant].Icon;
}
export function getServiceVisualVariant(slug, icon) {
    const value = `${slug} ${icon ?? ''}`.toLowerCase();
    if (value.includes('talent') || value.includes('استعداد'))
        return 'talent';
    if (value.includes('academic') || value.includes('تحصیلی'))
        return 'academic';
    if (value.includes('trainer') || value.includes('مدرس'))
        return 'trainer';
    if (value.includes('business') || value.includes('کسب'))
        return 'business';
    if (value.includes('coach') || value.includes('کوچ'))
        return 'coaching';
    return 'default';
}
export function ServiceVisual({ variant = 'default', label, compact = false }) {
    const config = visuals[variant];
    const Icon = config.Icon;
    return (_jsxs("div", { className: `service-art ${compact ? 'service-art-compact' : ''}`, "data-variant": variant, "aria-hidden": "true", children: [_jsx("div", { className: "service-art-wash" }), _jsx("div", { className: "service-art-rule" }), _jsx("span", { className: "service-art-index", children: config.index }), _jsx("span", { className: "service-art-kicker", children: config.label }), _jsxs("div", { className: "service-art-path", children: [_jsx("span", { className: "service-art-path-line" }), _jsx("span", { className: "service-art-path-node service-art-path-node-one" }), _jsx("span", { className: "service-art-path-node service-art-path-node-two" })] }), _jsxs("div", { className: "service-art-core", children: [_jsx("div", { className: "service-art-icon", children: _jsx(Icon, { strokeWidth: 1.4 }) }), _jsx("span", { className: "service-art-core-shadow" })] }), _jsxs("div", { className: "service-art-stamp", children: [_jsx("span", { children: label ?? config.label }), _jsx(ArrowUpLeft, { className: "size-4" })] }), _jsxs("span", { className: "service-art-corner", children: ["DR. BEIDI / ", config.index] })] }));
}
export function GrowthOrbit() {
    return (_jsxs("div", { className: "growth-art", "aria-hidden": "true", children: [_jsxs("div", { className: "growth-art-panel", children: [_jsx("div", { className: "growth-art-grid" }), _jsx("div", { className: "growth-art-sun" }), _jsx("div", { className: "growth-art-route growth-art-route-one" }), _jsx("div", { className: "growth-art-route growth-art-route-two" }), _jsx("span", { className: "growth-art-node growth-art-node-one" }), _jsx("span", { className: "growth-art-node growth-art-node-two" }), _jsx("span", { className: "growth-art-node growth-art-node-three" }), _jsx("div", { className: "growth-art-monogram", children: "\u0631" }), _jsxs("div", { className: "growth-art-caption", children: [_jsx("span", { children: "\u0645\u0633\u06CC\u0631 \u0631\u0634\u062F" }), _jsx("small", { children: "\u0627\u0632 \u0634\u0646\u0627\u062E\u062A \u062A\u0627 \u0627\u0633\u062A\u0642\u0644\u0627\u0644" })] }), _jsx("div", { className: "growth-art-index", children: "\u06F0\u06F1 \u2014 \u06F0\u06F7" }), _jsx("div", { className: "growth-art-side-label", children: "GROWTH / PATH" }), _jsxs("div", { className: "growth-art-route-label", children: [_jsx(Route, { className: "size-4" }), " \u0647\u0631 \u0645\u0633\u06CC\u0631\u060C \u06CC\u06A9 \u062F\u0627\u0633\u062A\u0627\u0646 \u062A\u0627\u0632\u0647"] })] }), _jsxs("div", { className: "growth-art-note", children: [_jsx(TrendingUp, { className: "size-5" }), _jsx("span", { children: "\u0622\u06CC\u0646\u062F\u0647 \u0631\u0627 \u0627\u0632 \u0647\u0645\u06CC\u0646\u200C\u062C\u0627 \u0637\u0631\u0627\u062D\u06CC \u06A9\u0646\u06CC\u062F" })] })] }));
}
