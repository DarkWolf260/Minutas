import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

/**
 * Robust wrapper for Supabase calls to handle JWT expiration.
 */
export async function callWithTokenRefresh<T>(call: () => PromiseLike<{data: T | null, error: any}>): Promise<{data: T | null, error: any}> {
  // 1. Proactive check: Refresh session if it's expired or about to expire
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const expiresAt = (session.expires_at || 0) * 1000;
      const buffer = 30 * 1000; // 30 seconds buffer
      
      if (Date.now() + buffer > expiresAt) {
        console.info('[Supabase] Token near expiration, refreshing proactively...');
        await supabase.auth.refreshSession();
      }
    }
  } catch (e) {
    console.warn('[Supabase] Proactive session check failed:', e);
  }

  // 2. Execute the call
  let result = await call();
  
  // 3. Fallback: Reactive retry if the proactive check wasn't enough (e.g., clock drift)
  if (result.error) {
    const errorMsg = result.error.message || '';
    const errorCode = result.error.code || '';
    const errorStatus = (result.error as any).status;

    // Detect common JWT/Auth expiration signals
    const isExpired = 
      errorMsg.includes('JWT') || 
      errorMsg.includes('expired') ||
      errorMsg.includes('Unauthorized') ||
      errorCode === 'PGRST303' || 
      errorStatus === 401;

    if (isExpired) {
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
  
  return result;
}
