import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export interface CloudWorkspace {
  id: string;
  name: string;
  estado: string;
  municipio: string;
  created_at: string;
}

export function useCloudWorkspaces() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<CloudWorkspace[]>([]);

  const fetchCloudWorkspaces = useCallback(async () => {
    if (!user) return [];
    try {
      setLoading(true);
      
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('is_admin, allowed_workspaces')
        .eq('id', user.id)
        .single();

      if (pError) throw pError;

      let query = supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!profile.is_admin) {
        if (!profile.allowed_workspaces || profile.allowed_workspaces.length === 0) {
          setWorkspaces([]);
          return [];
        }
        query = query.in('id', profile.allowed_workspaces);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const formatted = (data || []).map(ws => ({
        ...ws,
        estado: ws.estado || 'No definido',
        municipio: ws.municipio || 'No definido'
      }));
      
      setWorkspaces(formatted);
      return formatted;
    } catch (err: any) {
      console.error('Error fetching cloud workspaces:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Suscripción Realtime
  useEffect(() => {
    if (!user) return;

    fetchCloudWorkspaces();

    // Use a unique channel name per mount to avoid React Strict Mode race conditions
    // where supabase.channel() returns an already-subscribed channel that is pending removal.
    const channelName = `workspaces-changes-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'workspaces' },
        () => {
          // Refetching is safer for complex RLS logic than manual state patching
          fetchCloudWorkspaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCloudWorkspaces]);

  const createCloudWorkspace = async (name: string, stateId: string, muniId: string, customId: string) => {
    if (!user) return null;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workspaces')
        .insert({ 
          id: customId,
          name, 
          estado: stateId, 
          municipio: muniId 
        })
        .select()
        .single();

      if (error) throw error;
      toast.success(`Área "${name}" creada en la nube`);
      return data as CloudWorkspace;
    } catch (err: any) {
      toast.error('Error al crear área en la nube: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteCloudWorkspace = async (id: string, name: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(`Área "${name}" eliminada`);
      return true;
    } catch (err: any) {
      toast.error('Error al eliminar área: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    workspaces,
    loading,
    fetchCloudWorkspaces,
    createCloudWorkspace,
    deleteCloudWorkspace
  };
}
