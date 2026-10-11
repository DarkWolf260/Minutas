import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, options?: any) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session safely with a 3-second timeout to prevent hangs when offline or server is down
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{ data: { session: null } }>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 3000)
    );

    Promise.race([sessionPromise, timeoutPromise])
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch(err => {
        if (err?.message !== 'TIMEOUT') {
          console.warn('[Auth] Error fetching initial session (backend might be offline):', err);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (event === 'SIGNED_OUT' && typeof window !== 'undefined') {
        sessionStorage.removeItem('workspace-prompted-this-session');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn: async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        return {
          data: { user: null, session: null },
          error: new Error('Supabase no está configurado. Por favor, define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.'),
        };
      }
      return supabase.auth.signInWithPassword({ email, password });
    },
    signUp: async (email: string, password: string, options?: any) => {
      if (!isSupabaseConfigured) {
        return {
          data: { user: null, session: null },
          error: new Error('Supabase no está configurado. Por favor, define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.'),
        };
      }
      return supabase.auth.signUp({ email, password, options });
    },
    signOut: async () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('workspace-prompted-this-session');
      }
      if (!isSupabaseConfigured) {
        setUser(null);
        setSession(null);
        return { error: null };
      }
      return supabase.auth.signOut();
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
