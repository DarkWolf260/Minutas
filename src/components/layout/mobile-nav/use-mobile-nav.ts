import { useProfile } from '@/hooks/configuracion';
import { useSettings } from '@/hooks/configuracion';
import { useAuth } from '@/hooks/admin';
import { getInitials } from '@/lib/utils';

export function useMobileNav() {
  const { profile } = useProfile();
  const { settings } = useSettings();
  const { user } = useAuth();

  // Dynamic name logic: Use Analista de Sala de Monitoreo if a guard is active
  const analyst = settings.is_guard_open 
    ? (settings.orden_del_dia_draft?.staff?.['Analista de Sala de Monitoreo']?.[0]
      || settings.orden_del_dia_draft?.staff?.['Analista de CEMUPRAD']?.[0]
      || Object.entries(settings.orden_del_dia_draft?.staff || {}).find(([k]) => k.toLowerCase().includes('analista'))?.[1]?.[0])
    : null;
    
  const displayName = analyst?.name || profile.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const displayDepartment = analyst ? 'Analista Sala de Monitoreo' : (profile.department || 'Área no asignada');
  const initials = getInitials(displayName);

  return {
    profile,
    analyst,
    displayName,
    displayDepartment,
    initials
  };
}
