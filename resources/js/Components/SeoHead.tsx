import { Head, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

export interface SeoData {
    noindex?: boolean;
    title: string;
    description: string;
    keywords?: string | null;
    canonical: string;
    image?: string | null;
    type?: string;
    schema: Record<string, unknown>;
}

function safeJson(value: Record<string, unknown>): string {
    return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export function SeoHead({ seo }: { seo?: SeoData | null }) {
    const { csp_nonce: cspNonce } = usePage<PageProps>().props;

    if (!seo) {
        return null;
    }

    const schemaType = seo.type?.toLowerCase();
    const ogType = schemaType === 'website' || schemaType === 'webpage' || schemaType === 'collectionpage'
        ? 'website'
        : schemaType === 'product'
            ? 'product'
            : 'article';

    return (
        <Head title={seo.title}>
            <meta name="description" content={seo.description} head-key="description" />
            {seo.keywords && <meta name="keywords" content={seo.keywords} head-key="keywords" />}
            <meta name="robots" content={seo.noindex ? 'noindex, nofollow, noarchive' : 'index, follow'} head-key="robots" />
            <link rel="canonical" href={seo.canonical} head-key="canonical" />

            <meta property="og:type" content={ogType} head-key="og:type" />
            <meta property="og:title" content={seo.title} head-key="og:title" />
            <meta property="og:description" content={seo.description} head-key="og:description" />
            <meta property="og:url" content={seo.canonical} head-key="og:url" />
            <meta property="og:locale" content="fa_IR" head-key="og:locale" />
            {seo.image && <meta property="og:image" content={seo.image} head-key="og:image" />}

            <meta name="twitter:card" content={seo.image ? 'summary_large_image' : 'summary'} head-key="twitter:card" />
            <meta name="twitter:title" content={seo.title} head-key="twitter:title" />
            <meta name="twitter:description" content={seo.description} head-key="twitter:description" />
            {seo.image && <meta name="twitter:image" content={seo.image} head-key="twitter:image" />}

            <script
                type="application/ld+json"
                nonce={cspNonce ?? undefined}
                dangerouslySetInnerHTML={{ __html: safeJson(seo.schema) }}
                head-key="structured-data"
            />
        </Head>
    );
}
