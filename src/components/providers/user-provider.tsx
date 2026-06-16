import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase, callWithTokenRefresh } from '@/lib/supabase';

interface UserStatus {
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  exists: boolean;
}

interface UserContextType extends UserStatus {
  refreshStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<UserStatus>({
    isAdmin: false,
    isApproved: false,
    loading: true,
    exists: false
  });

  const fetchStatus = async () => {
    if (!user) {
      setStatus({ isAdmin: false, isApproved: false, loading: false, exists: false });
      return;
    }

    try {
      // Fetch status with a 4-second timeout to prevent hangs when offline or server is down
      const fetchPromise = callWithTokenRefresh<any>(() => 
        supabase
          .from('profiles')
          .select('is_admin, is_approved')
          .eq('id', user.id)
          .single()
      );

      const timeoutPromise = new Promise<{data: null, error: any}>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 4000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          setStatus({
            isAdmin: false,
            isApproved: false,
            loading: false,
            exists: false
          });
          return;
        }
        throw error;
      }

      if (!data) {
        throw new Error('No profile data returned');
      }

      setStatus({
        isAdmin: data.is_admin,
        isApproved: data.is_approved,
        loading: false,
        exists: true
      });
    } catch (err) {
      console.error('Error fetching user status:', err);
      
      // Fallback: Check if we have status cached in user metadata to prevent offline lockouts
      const metadataAdmin = user.user_metadata?.is_admin === true;
      const metadataApproved = user.user_metadata?.is_approved === true;
      
      setStatus({
        isAdmin: metadataAdmin,
        isApproved: metadataApproved,
        loading: false, // Ensure loading is set to false to unblock UI
        exists: false
      });
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchStatus();
    }
  }, [user?.id, authLoading]);

  const value = {
    ...status,
    refreshStatus: fetchStatus
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
