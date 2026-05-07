import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

export interface UserStatus {
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  exists: boolean;
}

export function useUserStatus() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<UserStatus>({
    isAdmin: false,
    isApproved: false,
    loading: true,
    exists: false
  });

  useEffect(() => {
    async function fetchStatus() {
      if (!user) {
        setStatus({ isAdmin: false, isApproved: false, loading: false, exists: false });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin, is_approved')
          .eq('id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') { // Not found
            // Fallback to metadata if profile doesn't exist yet (transitional)
            setStatus({
              isAdmin: user.user_metadata?.is_admin === true,
              isApproved: user.user_metadata?.is_approved === true,
              loading: false,
              exists: false
            });
            return;
          }
          throw error;
        }

        setStatus({
          isAdmin: data.is_admin,
          isApproved: data.is_approved,
          loading: false,
          exists: true
        });
      } catch (err) {
        console.error('Error fetching user status:', err);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    }

    if (!authLoading) {
      fetchStatus();
    }
  }, [user, authLoading]);

  return status;
}
