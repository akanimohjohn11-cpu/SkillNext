'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SessionUser } from '@/lib/auth-session';
import { UserRole } from '@/types';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  supabaseConfigured: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  switchPreviewRole: (role: UserRole) => Promise<SessionUser | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  supabaseConfigured: false,
  refreshSession: async () => {},
  logout: async () => {},
  switchPreviewRole: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
        setSupabaseConfigured(Boolean(data.supabaseConfigured));
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data) {
          setUser(data.user ?? null);
          setSupabaseConfigured(Boolean(data.supabaseConfigured));
        }
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/session', {
      method: 'DELETE',
      headers: { 'X-Requested-With': 'SkillNestClient' },
    });
    setUser(null);
  }, []);

  const switchPreviewRole = useCallback(async (role: UserRole) => {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'SkillNestClient',
      },
      body: JSON.stringify({ action: 'preview_role', role }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setUser(data.user ?? null);
    return (data.user as SessionUser) ?? null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        supabaseConfigured,
        refreshSession,
        logout,
        switchPreviewRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
