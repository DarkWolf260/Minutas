import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function useAdmin() {
  const { user, loading } = useAuth();
  
  // Usamos useMemo para que solo se calcule cuando cambie el objeto 'user'
  const isAdmin = useMemo(() => {
    return user?.user_metadata?.is_admin === true;
  }, [user]);

  return {
    isAdmin,
    isLoading: loading
  };
}
