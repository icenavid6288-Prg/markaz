import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Head } from '@inertiajs/react';
function safeJson(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
export function SeoHead({ seo }) {
    if (!seo) {
        return null;
    }
    const schemaType = seo.type?.toLowerCase();
    const ogType = schemaType === 'website' || schemaType === 'webpage' || schemaType === 'collectionpage'
        ? 'website'
        : schemaType === 'product'
            ? 'product'
            : 'article';
    return (_jsxs(Head, { title: seo.title, children: [_jsx("meta", { name: "description", content: seo.description, "head-key": "description" }), seo.keywords && _jsx("meta", { name: "keywords", content: seo.keywords, "head-key": "keywords" }), _jsx("meta", { name: "robots", content: "index, follow", "head-key": "robots" }), _jsx("link", { rel: "canonical", href: seo.canonical, "head-key": "canonical" }), _jsx("meta", { property: "og:type", content: ogType, "head-key": "og:type" }), _jsx("meta", { property: "og:title", content: seo.title, "head-key": "og:title" }), _jsx("meta", { property: "og:description", content: seo.description, "head-key": "og:description" }), _jsx("meta", { property: "og:url", content: seo.canonical, "head-key": "og:url" }), _jsx("meta", { property: "og:locale", content: "fa_IR", "head-key": "og:locale" }), seo.image && _jsx("meta", { property: "og:image", content: seo.image, "head-key": "og:image" }), _jsx("meta", { name: "twitter:card", content: seo.image ? 'summary_large_image' : 'summary', "head-key": "twitter:card" }), _jsx("meta", { name: "twitter:title", content: seo.title, "head-key": "twitter:title" }), _jsx("meta", { name: "twitter:description", content: seo.description, "head-key": "twitter:description" }), seo.image && _jsx("meta", { name: "twitter:image", content: seo.image, "head-key": "twitter:image" }), _jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: safeJson(seo.schema) }, "head-key": "structured-data" })] }));
}
