import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ensureProfile } from '../lib/auth';
import { getSupabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const user = session?.user;
    if (!user) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    ensureProfile(user)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const refreshProfile = useCallback(async () => {
    const user = session?.user;
    if (!user) {
      setProfile(null);
      return null;
    }
    const data = await ensureProfile(user);
    setProfile(data);
    return data;
  }, [session?.user]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAuthenticated: Boolean(session),
      refreshProfile,
    }),
    [session, profile, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
