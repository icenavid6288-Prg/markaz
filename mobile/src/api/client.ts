import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 1;

export const CONFIG_KEY = 'markaz:config';
export const TOKEN_KEY = 'markaz:token';

export function normalizeServerUrl(raw: string): string | null {
    let value = (raw || '').trim();
    if (!value) return null;
    if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
    try {
        const url = new URL(value);
        return (url.origin + (url.pathname.replace(/\/+$/, '') || '')).replace(/\/+$/, '');
    } catch {
        return null;
    }
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
    return normalizeServerUrl(DEFAULT_SERVER_URL) || DEFAULT_SERVER_URL;
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
    const retries = options.retries ?? (options.method || 'GET') === 'GET' ? MAX_RETRIES : 0;
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
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    if (/^data:/i.test(pathOrUrl)) return pathOrUrl;
    const base = await getServerUrl();
    return base + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
}

/** Open a site page in the phone's browser (e.g. checkout, lesson player). */
export async function openSitePage(pagePath: string): Promise<void> {
    const base = await getServerUrl();
    const url = base + (pagePath.startsWith('/') ? pagePath : '/' + pagePath);
    try {
        await Linking.openURL(url);
    } catch {
        throw new ApiError('مرورگر برای باز کردن صفحه در دسترس نیست.', 0);
    }
}
