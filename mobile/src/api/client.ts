import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;

export const CONFIG_KEY = 'markaz:config';
export const TOKEN_KEY = 'markaz:token';

/** Hosts that only exist on a local network — force plain http so a phone can reach them. */
function isLocalHostname(hostname: string): boolean {
    const host = hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
    if (host === '0.0.0.0' || host === '::1' || host === '[::1]' || host === '10.0.2.2') return true;
    // LAN ranges: 10.x, 192.168.x, 172.16-31.x and the loopback 127.x block.
    return /^(10\.|192\.168\.|127\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
}

export function normalizeServerUrl(raw: string): string | null {
    let value = (raw || '').trim();
    if (!value) return null;
    // No scheme: use http for local/LAN hosts (a dev server is not https),
    // and https for real domains.
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
        const host = value.split(/[/:?#]/, 1)[0];
        value = (isLocalHostname(host) ? 'http://' : 'https://') + value;
    }
    try {
        const url = new URL(value);
        return (url.origin + (url.pathname.replace(/\/+$/, '') || '')).replace(/\/+$/, '');
    } catch {
        return null;
    }
}

/** Build an absolute URL from an API path, a relative path or an already-absolute URL. */
export async function absoluteUrl(pathOrUrl: string): Promise<string> {
    const value = (pathOrUrl || '').trim();
    if (/^(https?:)?\/\//i.test(value)) return value.startsWith('//') ? `https:${value}` : value;
    const base = await getServerUrl();
    return base + (value.startsWith('/') ? value : '/' + value);
}

/** The server URL compiled into the app (EXPO_PUBLIC_API_URL) or the dev fallback. */
export function getDefaultServerUrl(): string {
    return normalizeServerUrl(DEFAULT_SERVER_URL) || DEFAULT_SERVER_URL;
}

export async function getServerUrl(): Promise<string> {
    try {
        const raw = await AsyncStorage.getItem(CONFIG_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const normalized = normalizeServerUrl(parsed.serverUrl);
            if (normalized) return normalized;
        }
    } catch {
        /* fall through */
    }
    return getDefaultServerUrl();
}

export async function setServerUrl(raw: string): Promise<string> {
    const normalized = normalizeServerUrl(raw);
    if (!normalized) throw new Error('آدرس واردشده معتبر نیست. مثال: https://example.com');
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify({ serverUrl: normalized }));
    return normalized;
}

export async function resetServerUrl(): Promise<string> {
    await AsyncStorage.removeItem(CONFIG_KEY);
    return getServerUrl();
}

export async function getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Notified whenever an authenticated request is rejected with 401 so the app can
 * drop a revoked/expired session instead of showing errors on every screen.
 */
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
    unauthorizedHandler = handler;
}

export class ApiError extends Error {
    status: number;
    errors?: Record<string, string[]>;

    constructor(message: string, status: number, errors?: Record<string, string[]>) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

function firstValidationError(errors?: Record<string, string[]>): string | null {
    if (!errors) return null;
    for (const key of Object.keys(errors)) {
        if (errors[key]?.length) return errors[key][0];
    }
    return null;
}

export async function api<T>(
    path: string,
    options: { method?: string; body?: unknown; auth?: boolean; query?: Record<string, string>; timeoutMs?: number; retries?: number } = {}
): Promise<T> {
    const base = await getServerUrl();
    const token = await getToken();

    let url = base + path;
    if (options.query) {
        const qs = Object.entries(options.query)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`;

    let response: Response | null = null;
    const isReadOnly = (options.method || 'GET') === 'GET';
    const retries = options.retries ?? (isReadOnly ? MAX_RETRIES : 0);
    const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            response = await fetch(url, {
                method: options.method || 'GET',
                headers,
                body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
            });
            clearTimeout(timeout);
            break;
        } catch {
            clearTimeout(timeout);
            if (attempt === retries) {
                throw new ApiError('امکان اتصال به سرور نیست. آدرس سرور را در تنظیمات بررسی کنید.', 0);
            }
        }
    }
    if (!response) throw new ApiError('پاسخی از سرور دریافت نشد.', 0);

    const text = await response.text();
    let json: { data?: T; message?: string; errors?: Record<string, string[]> } | null = null;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = null;
    }

    if (!response.ok) {
        if (response.status === 401 && options.auth !== false && token) {
            unauthorizedHandler?.();
        }

        throw new ApiError(
            firstValidationError(json?.errors) || json?.message || `خطای ${response.status}`,
            response.status,
            json?.errors
        );
    }

    return (json?.data as T) ?? (json as unknown as T);
}

/** Resolve a possibly-relative asset path (thumbnail/image) to an absolute URL. */
export async function resolveAssetUrl(pathOrUrl?: string | null): Promise<string | null> {
    if (!pathOrUrl) return null;
    if (/^data:/i.test(pathOrUrl)) return pathOrUrl;
    return absoluteUrl(pathOrUrl);
}

/**
 * Open a site page in the phone's browser (e.g. checkout, lesson player).
 * Accepts both site-relative paths (`/checkout/ABC`) and absolute URLs returned
 * by the API (`https://site.com/checkout/ABC`).
 */
export async function openSitePage(pagePath: string): Promise<void> {
    const url = await absoluteUrl(pagePath);
    try {
        await Linking.openURL(url);
    } catch {
        throw new ApiError('مرورگر برای باز کردن صفحه در دسترس نیست.', 0);
    }
}
