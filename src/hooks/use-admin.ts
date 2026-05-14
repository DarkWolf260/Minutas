import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase, callWithTokenRefresh } from '@/lib/supabase';

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await callWithTokenRefresh<any>(() => 
          supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()
        );

        if (error) throw error;
        setIsAdmin(data?.is_admin || false);
      } catch (err) {
        console.error('Error checking admin status:', err);
        // Fallback to metadata if profile check fails (transitional)
        setIsAdmin(user.user_metadata?.is_admin === true);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  return {
    isAdmin,
    isLoading: authLoading || loading
  };
}
