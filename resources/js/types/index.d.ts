export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    roles?: string[];
    permissions?: string[];
    unread_notifications?: number;
    email_verified_at?: string | null;
}

export interface SiteData {
    name: string;
    slogan: string;
    logo?: string | null;
    popup?: {
        enabled: boolean;
        title: string;
        message: string;
        cta_label: string;
        cta_url: string;
        delay_seconds: number;
        frequency: 'session' | 'daily' | 'once' | 'always';
    };
    contact: {
        address: string;
        phone: string;
        email: string;
        eitaa: string;
        website: string;
        working_hours: string;
    };
    social: {
        instagram: string;
        eitaa: string;
    };
    enamad?: {
        enabled: boolean;
        title: string;
        image_url: string;
        link_url: string;
    };
    hero: {
        title: string;
        subtitle: string;
        image?: string | null;
        background?: string | null;
        cta_primary: string;
        cta_secondary: string;
    };
    chat?: {
        enabled: boolean;
        title: string;
        greeting: string;
        ai_enabled: boolean;
    };
}

export interface MenuItem {
    title: string;
    url: string;
    children?: MenuItem[];
}

export interface SeoData {
    title: string;
    description: string;
    keywords?: string | null;
    canonical: string;
    image?: string | null;
    type?: string;
    schema: Record<string, unknown>;
}

export interface AuthModalState {
    mode?: 'login' | 'register';
    step?: 'phone' | 'code';
    phone?: string;
    dev_code?: string | null;
    status?: string;
}

export interface PageContentField {
    label: string;
    type: string;
    value: string;
    icon?: string;
}

export interface PageContentData {
    key: string;
    label: string;
    path: string;
    icon: string;
    fields: Record<string, PageContentField>;
}

export interface SharedData {
    auth: { user: User };
    authModal?: AuthModalState | null;
    site: SiteData;
    pageContent?: PageContentData | null;
    seo?: SeoData | null;
    menus: { header: MenuItem[]; footer: MenuItem[] };
    flash: { success: string | null; error: string | null };
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & SharedData;
