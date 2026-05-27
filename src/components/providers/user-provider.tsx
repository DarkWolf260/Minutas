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
      const { data, error } = await callWithTokenRefresh<any>(() => 
        supabase
          .from('profiles')
          .select('is_admin, is_approved')
          .eq('id', user.id)
          .single()
      );

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
      setStatus(prev => ({ ...prev, loading: false }));
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
