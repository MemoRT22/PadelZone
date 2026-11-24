import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import type { ClubRole } from "@/types/database";

export interface ClubMembership {
  id: string;
  user_id: string;
  role: ClubRole;
  display_name: string;
  active: boolean;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  membership: ClubMembership | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshMembership: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [membership, setMembership] = React.useState<ClubMembership | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadMembership = React.useCallback(async (uid: string) => {
    const { data, error: mErr } = await supabase
      .from("club_memberships")
      .select("id, user_id, role, display_name, active")
      .eq("user_id", uid)
      .maybeSingle();

    if (mErr) {
      setMembership(null);
      return;
    }

    if (!data || !(data as ClubMembership).active) {
      setMembership(null);
      return;
    }

    setMembership(data as ClubMembership);
  }, []);

  const refreshMembership = React.useCallback(async () => {
    if (user) {
      await loadMembership(user.id);
    }
  }, [user, loadMembership]);

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        loadMembership(s.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        (async () => {
          if (!mounted) return;
          setSession(s);
          setUser(s?.user ?? null);
          setError(null);

          if (s?.user) {
            await loadMembership(s.user.id);
          } else {
            setMembership(null);
          }
          setLoading(false);
        })();
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadMembership]);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      setError(null);
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        setError(signInErr.message);
        return { error: signInErr.message };
      }
      return { error: null };
    },
    []
  );

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setMembership(null);
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    membership,
    loading,
    error,
    signIn,
    signOut,
    refreshMembership,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
