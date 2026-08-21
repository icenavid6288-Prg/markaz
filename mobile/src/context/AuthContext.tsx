import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, getToken, setToken } from '../api/client';
import type { AuthData, UserPayload } from '../api/types';

interface AuthContextValue {
    token: string | null;
    user: UserPayload | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

    // Restore the persisted session on launch.
    useEffect(() => {
        (async () => {
            try {
                const stored = await getToken();
                if (!stored) {
                    setLoading(false);
                    return;
                }
                const me = await api<{ user: UserPayload }>('/api/v1/auth/me');
                setTokenState(stored);
                setUser(me.user);
            } catch (error) {
                if (error instanceof ApiError && error.status === 401) {
                    await setToken(null);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = useCallback(
        async (email: string, password: string) => {
            const data = await api<AuthData>('/api/v1/auth/login', {
                method: 'POST',
                body: { email, password },
            });
            applyAuth(data);
        },
        [applyAuth]
    );

    const register = useCallback(
        async (name: string, email: string, password: string) => {
            const data = await api<AuthData>('/api/v1/auth/register', {
                method: 'POST',
                body: { name, email, password, password_confirmation: password },
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
        const me = await api<{ user: UserPayload }>('/api/v1/auth/me');
        setUser(me.user);
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
