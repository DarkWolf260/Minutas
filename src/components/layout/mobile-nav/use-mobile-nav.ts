import { useProfile } from '@/hooks/use-profile';
import { useSettings } from '@/hooks/use-settings';
import { getInitials } from '@/lib/utils';

export function useMobileNav() {
  const { profile } = useProfile();
  const { settings } = useSettings();

  // Dynamic name logic: Use Analista de CEMUPRAD if a guard is active
  const analyst = settings.isGuardOpen 
    ? settings.ordenDelDiaDraft?.staff?.['Analista de CEMUPRAD']?.[0]
    : null;
    
  const displayName = analyst?.name || profile.name || 'Usuario';
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
