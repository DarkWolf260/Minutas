import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  cedula_type: string;
  cedula_number: string;
  is_admin: boolean;
  is_approved: boolean;
  created_at: string;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAdmin = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newValue = !user.is_admin;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: newValue })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_admin: newValue } : u
      ));
      toast.success(newValue ? 'Usuario ahora es administrador' : 'Permisos de administrador removidos');
    } catch (error: any) {
      toast.error('Error al actualizar permisos');
    }
  };

  const toggleApproval = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newValue = !user.is_approved;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: newValue })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_approved: newValue } : u
      ));
      toast.success(newValue ? 'Cuenta aprobada' : 'Aprobación removida');
    } catch (error: any) {
      toast.error('Error al actualizar estado');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Perfil eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar perfil');
    }
  };

  return {
    users,
    loading,
    toggleAdmin,
    toggleApproval,
    deleteUser,
    refresh: fetchUsers
  };
}
