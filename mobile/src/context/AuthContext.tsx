import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, getToken, setToken, setUnauthorizedHandler } from '../api/client';
import type { AuthData, UserPayload } from '../api/types';

interface AuthContextValue {
    token: string | null;
    user: UserPayload | null;
    loading: boolean;
    login: (identifier: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * `/api/v1/auth/me` returns the user object directly under the `data` key,
 * while login/register wrap it in `{ user, token }`. Accept both shapes so a
 * restored session always resolves to a real user.
 */
function extractUser(payload: UserPayload | { user: UserPayload }): UserPayload {
    return (payload as { user?: UserPayload }).user ?? (payload as UserPayload);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setTokenState] = useState<string | null>(null);
    const [user, setUser] = useState<UserPayload | null>(null);
    const [loading, setLoading] = useState(true);

    const applyAuth = useCallback((data: AuthData) => {
        setTokenState(data.token);
        setUser(data.user);
        setToken(data.token);
    }, []);

    const clearAuth = useCallback(() => {
        setTokenState(null);
        setUser(null);
        setToken(null);
    }, []);

    // A 401 on any authenticated call means the token is gone (revoked, expired
    // or issued by another server) — return to the login screen.
    useEffect(() => {
        setUnauthorizedHandler(clearAuth);
        return () => setUnauthorizedHandler(null);
    }, [clearAuth]);

    // Restore the persisted session on launch.
    useEffect(() => {
        (async () => {
            try {
                const stored = await getToken();
                if (!stored) return;

                try {
                    const me = await api<UserPayload | { user: UserPayload }>('/api/v1/auth/me');
                    setUser(extractUser(me));
                    setTokenState(stored);
                } catch (error) {
                    if (error instanceof ApiError && error.status === 401) {
                        // The token was revoked or expired — drop it for good.
                        await setToken(null);
                    } else {
                        // Server unreachable (offline, wrong URL): keep the session
                        // instead of logging the user out.
                        setTokenState(stored);
                    }
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = useCallback(
        async (identifier: string, password: string) => {
            const isPhone = /^09\d{9}$/.test(identifier);
            const data = await api<AuthData>('/api/v1/auth/login', {
                method: 'POST',
                body: isPhone ? { phone: identifier, password } : { email: identifier, password },
            });
            applyAuth(data);
        },
        [applyAuth]
    );

    const register = useCallback(
        async (name: string, email: string, password: string, phone = '') => {
            const data = await api<AuthData>('/api/v1/auth/register', {
                method: 'POST',
                body: { name, email: email || undefined, phone, password, password_confirmation: password },
            });
            applyAuth(data);
        },
        [applyAuth]
    );

    const logout = useCallback(async () => {
        try {
            await api('/api/v1/auth/logout', { method: 'POST' });
        } catch {
            /* server unreachable — still clear locally */
        }
        clearAuth();
    }, [clearAuth]);

    const refreshMe = useCallback(async () => {
        const me = await api<UserPayload | { user: UserPayload }>('/api/v1/auth/me');
        setUser(extractUser(me));
    }, []);

    const value = useMemo(
        () => ({ token, user, loading, login, register, logout, refreshMe }),
        [token, user, loading, login, register, logout, refreshMe]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
