import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  bannedReason: string | null;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannedReason, setBannedReason] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        (async () => {
          const { data: banned } = await supabase.rpc('check_user_banned', { target_uid: data.session!.user.id });
          if (banned === true && mounted) {
            setBannedReason('Your account has been banned. Contact the site owner.');
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
          }
        })();
      }
    }).catch(() => {
      if (!mounted) return;
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
      if (newSession?.user) {
        (async () => {
          const { data: banned } = await supabase.rpc('check_user_banned', { target_uid: newSession!.user.id });
          if (banned === true && mounted) {
            const { data: banRow } = await supabase.from('user_bans').select('reason').eq('user_id', newSession!.user.id).maybeSingle();
            setBannedReason(banRow?.reason ?? 'Your account has been banned.');
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
          }
        })();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // Wallet is created automatically by useWallet when it detects no wallet exists
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const { data: banned } = await supabase.rpc('check_user_banned', { target_uid: data.user.id });
      if (banned === true) {
        const { data: banRow } = await supabase.from('user_bans').select('reason').eq('user_id', data.user.id).maybeSingle();
        setBannedReason(banRow?.reason ?? 'Your account has been banned.');
        await supabase.auth.signOut();
        return { error: 'Your account has been banned. Contact the site owner.' };
      }
    }
    setBannedReason(null);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, bannedReason, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
