import { useState, useEffect, useRef } from 'react';
import { useWorkspaceManager } from '@/lib/db/db-context';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { useDepartments } from '@/hooks/use-departments';
import { toast } from 'sonner';
import type { StaffRole, Department } from '@/lib/types';

// Ayudantes de almacenamiento
export const SETUP_DONE_KEY = 'minutas-setup-complete-v1';
export const STEP_KEY = 'minutas-setup-step';
export const WS_KEY = 'minutas-setup-workspace';
export const ROLES_KEY = 'minutas-setup-roles-v1';
export const DEPTOS_KEY = 'minutas-setup-depts-v1';

export function tryGet(key: string): string | null {
  try { return localStorage.getItem(key); }
  catch { return sessionStorage.getItem(key); }
}
export function trySet(key: string, val: string) {
  try { localStorage.setItem(key, val); }
  catch { sessionStorage.setItem(key, val); }
}
export function tryRemove(key: string) {
  try { localStorage.removeItem(key); }
  catch { sessionStorage.removeItem(key); }
}

export function useSetup(onComplete: (goToTemplates?: boolean) => void) {
  const [paso, setPasoEstado] = useState(0);
  const [nombreWorkspace, setNombreWorkspace] = useState('');
  const { createWorkspace, switchWorkspace, workspaces } = useWorkspaceManager();
  const { saveSettings, isLoaded: settingsCargados } = useSettings();

  const { roles: dbRoles, saveRoles, isLoaded: rolesCargados } = useRoles();
  const { departments: dbDepts, saveDepartments, isLoaded: deptsCargados } = useDepartments();

  const [roles, setRolesEstado] = useState<StaffRole[]>([]);
  const [departamentos, setDepartamentosEstado] = useState<Department[]>([]);
  const inicializado = useRef(false);

  const setRoles = (r: StaffRole[]) => {
    setRolesEstado(r);
    trySet(ROLES_KEY, JSON.stringify(r));
  };

  const setDepartamentos = (d: Department[]) => {
    setDepartamentosEstado(d);
    trySet(DEPTOS_KEY, JSON.stringify(d));
  };

  // Sincronizar con DB o LocalStorage
  useEffect(() => {
    if (!inicializado.current && rolesCargados && deptsCargados) {
      const rolesGuardados = tryGet(ROLES_KEY);
      const deptosGuardados = tryGet(DEPTOS_KEY);

      if (rolesGuardados) setRolesEstado(JSON.parse(rolesGuardados));
      else if (dbRoles.length > 0) setRolesEstado(dbRoles);

      if (deptosGuardados) setDepartamentosEstado(JSON.parse(deptosGuardados));
      else if (dbDepts.length > 0) setDepartamentosEstado(dbDepts);

      inicializado.current = true;
    }
  }, [rolesCargados, deptsCargados, dbRoles, dbDepts]);

  const setPaso = (s: number) => {
    setPasoEstado(s);
    trySet(STEP_KEY, String(s));
  };

  useEffect(() => {
    if (!settingsCargados) return;
    const pasoGuardado = tryGet(STEP_KEY);
    const wsGuardado = tryGet(WS_KEY);
    if (pasoGuardado) setPasoEstado(Number(pasoGuardado));
    if (wsGuardado) setNombreWorkspace(wsGuardado);
  }, [settingsCargados]);

  const marcarCompletado = () => {
    trySet(SETUP_DONE_KEY, 'true');
    tryRemove(STEP_KEY);
    tryRemove(WS_KEY);
    tryRemove(ROLES_KEY);
    tryRemove(DEPTOS_KEY);
  };

  const finalizar = async (irAPlantillas = false, triggerTour = false) => {
    try {
      if (roles.length > 0) await saveRoles(roles);
      if (departamentos.length > 0) await saveDepartments(departamentos);
    } catch (err) {
      console.error('Error al guardar datos finales del setup:', err);
    } finally {
      marcarCompletado();
      if (irAPlantillas) trySet('minutas-template-bootstrap-ok', 'true');
      if (triggerTour) trySet('minutas-trigger-tour', 'true');
      setPasoEstado(8); // Pantalla final (PasoDone)
    }
  };

  const manejarContinuarWorkspace = async (nombre: string, esExistente: boolean) => {
    setNombreWorkspace(nombre);
    trySet(WS_KEY, nombre);
    try {
      if (esExistente) {
        await switchWorkspace(nombre);
      } else {
        await createWorkspace(nombre);
        await switchWorkspace(nombre);
      }
    } catch {
      toast.error('No se pudo configurar el área de trabajo.');
      return;
    }
    setPaso(2);
  };

  return {
    // Estado
    paso,
    setPaso,
    nombreWorkspace,
    workspaces,
    roles,
    setRoles,
    departamentos,
    setDepartamentos,
    settingsCargados,

    // Acciones
    finalizar,
    manejarContinuarWorkspace,
    saveSettings
  };
}
