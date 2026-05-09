import { useProfile } from '@/hooks/use-profile';
import { useSettings } from '@/hooks/use-settings';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/lib/utils';

export function useMobileNav() {
  const { profile } = useProfile();
  const { settings } = useSettings();
  const { user } = useAuth();

  // Dynamic name logic: Use Analista de CEMUPRAD if a guard is active
  const analyst = settings.is_guard_open 
    ? settings.orden_del_dia_draft?.staff?.['Analista de CEMUPRAD']?.[0]
    : null;
    
  const displayName = analyst?.name || profile.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const displayDepartment = analyst ? 'Analista CEMUPRAD' : (profile.department || 'Área no asignada');
  const initials = getInitials(displayName);

  return {
    profile,
    analyst,
    displayName,
    displayDepartment,
    initials
  };
}
