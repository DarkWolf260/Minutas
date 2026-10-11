import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isLocalSupabase = Boolean(
  supabaseUrl && (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'))
);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.trim() !== ''
);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials not found in environment variables.');
}

// Clean up stale/expired local tokens on boot to prevent GoTrueClient retry loops when local server is offline
if (typeof window !== 'undefined' && isLocalSupabase) {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage access errors in restricted browser contexts
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      timeout: 5000,
      // Exponential backoff capped at 60s to prevent spamming if offline
      reconnectAfterMs: (tries: number) => Math.min(1000 * Math.pow(2, tries), 60000),
    },
  }
);

let cachedHealth: { reachable: boolean; timestamp: number } | null = null;

/**
 * Fast cached health check to determine if the Supabase backend is currently reachable.
 */
export async function isSupabaseOnline(force = false): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const now = Date.now();
  if (!force && cachedHealth && now - cachedHealth.timestamp < 30000) {
    return cachedHealth.reachable;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { apikey: supabaseAnonKey || '' },
    }).catch(() => null);
    clearTimeout(timer);

    const reachable = Boolean(res && (res.ok || res.status === 200 || res.status === 401));
    cachedHealth = { reachable, timestamp: now };
    return reachable;
  } catch {
    cachedHealth = { reachable: false, timestamp: now };
    return false;
  }
}

/**
 * Robust wrapper for Supabase calls to handle JWT expiration gracefully.
 */
export async function callWithTokenRefresh<T>(call: () => PromiseLike<{data: T | null, error: any}>): Promise<{data: T | null, error: any}> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase no está configurado en las variables de entorno.') };
  }

  // 1. Proactive check: Refresh session if it's expired or about to expire
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const expiresAt = (session.expires_at || 0) * 1000;
      const buffer = 30 * 1000; // 30 seconds buffer
      
      if (Date.now() + buffer > expiresAt) {
        const online = await isSupabaseOnline();
        if (online) {
          console.info('[Supabase] Token near expiration, refreshing proactively...');
          await supabase.auth.refreshSession();
        }
      }
    }
  } catch (e) {
    // Proactive check failed, proceed with call
  }

  // 2. Execute the call
  let result = await call();
  
  // 3. Fallback: Reactive retry if the proactive check wasn't enough, ONLY for genuine JWT expiry
  if (result.error) {
    const errorMsg = String(result.error.message || '');
    const errorCode = result.error.code || '';
    const errorStatus = (result.error as any).status;

    const isNetworkError = 
      errorMsg.includes('Failed to fetch') || 
      errorMsg.includes('NetworkError') || 
      errorMsg.includes('net::ERR_');

    // Detect common JWT/Auth expiration signals ONLY when not a network/connection failure
    const isExpired = !isNetworkError && (
      errorMsg.includes('JWT') || 
      errorMsg.includes('expired') ||
      errorMsg.includes('Unauthorized') ||
      errorCode === 'PGRST303' || 
      errorStatus === 401
    );

    if (isExpired) {
      const online = await isSupabaseOnline();
      if (online) {
        console.warn('[Supabase] Session expiration detected reactively. Attempting forced refresh...', {
          code: errorCode,
          status: errorStatus,
          message: errorMsg
        });
        
        try {
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (session && !refreshError) {
            console.info('[Supabase] Session refreshed successfully. Retrying operation...');
            result = await call();
          } else {
            console.error('[Supabase] Session refresh failed. User might need to re-login.', refreshError);
          }
        } catch (retryErr) {
          console.error('[Supabase] Fatal error during session refresh:', retryErr);
        }
      }
    }
  }
  
  return result;
}
