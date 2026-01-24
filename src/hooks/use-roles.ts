/**
 * Hook for managing staff roles with localStorage persistence.
 * 
 * Manages organizational roles with department scope, single/multi assignment,
 * and automatic migration support for adding departmentScope to existing roles.
 * 
 * @returns Role state and operations
 * @property {StaffRole[]} roles - List of all roles
 * @property {(roles: StaffRole[]) => void} saveRoles - Update roles list
 * @property {() => void} clearAllRoles - Reset to default roles
 * @property {boolean} isLoaded - Loading state
 * 
 * @example
 * ```tsx
 * const { roles, saveRoles } = useRoles();
 * 
 * const updatedRoles = [...roles, {
 *   name: 'Coordinador',
 *   isSingle: true,
 *   departmentScope: ['ops']
 * }];
 * saveRoles(updatedRoles);
 * ```
 */

'use client';

import { useCallback } from 'react';
import type { StaffRole } from '@/types';
import { useLocalStorage } from './use-local-storage';

const ROLES_STORAGE_KEY = 'app-staff-roles';

const defaultRoles: StaffRole[] = [
  { name: 'Director', isSingle: true, departmentScope: [] },
  { name: 'Jefe de Operaciones', isSingle: true, departmentScope: ['ops'] },
  { name: 'Jefe de los Servicios', isSingle: true, departmentScope: ['ops'] },
  { name: 'Analista de CEMUPRAD', isSingle: false, departmentScope: ['cemuprad'] },
  { name: 'Auxiliar de CEMUPRAD', isSingle: false, departmentScope: ['cemuprad'] },
  { name: 'Operador de radio', isSingle: false, departmentScope: ['ops'] },
  { name: 'Técnico', isSingle: false, departmentScope: ['ops'] },
  { name: 'Auxiliar', isSingle: false, departmentScope: ['ops'] },
  { name: 'Conductor', isSingle: false, departmentScope: ['ops'] },
  { name: 'Jefe de CEMUPRAD', isSingle: true, departmentScope: ['cemuprad'] },
  { name: 'Reposo', isSingle: false, departmentScope: [] },
  { name: 'Permiso', isSingle: false, departmentScope: [] },
  { name: 'Vacaciones', isSingle: false, departmentScope: [] },
  { name: 'Apoyo', isSingle: false, departmentScope: [] },
];


export function useRoles() {
  const [roles, setRoles, isLoaded] = useLocalStorage<StaffRole[]>(
    ROLES_STORAGE_KEY,
    defaultRoles,
    {
      migrate: (parsed: any[]) => {
        if (!parsed || !Array.isArray(parsed)) {
          return defaultRoles;
        }

        // Migration for old roles without departmentScope and ensuring all fields exist
        const migrated = parsed.map((role: any) => ({
          name: role.name,
          isSingle: role.isSingle ?? false,
          departmentScope: role.departmentScope ?? (defaultRoles.find(dr => dr.name === role.name)?.departmentScope || []),
        }));

        // Add any default roles that might be missing from storage
        const allRoles = [...migrated];
        const migratedRoleNames = new Set(migrated.map((r: StaffRole) => r.name));
        defaultRoles.forEach(defaultRole => {
          if (!migratedRoleNames.has(defaultRole.name)) {
            allRoles.push(defaultRole);
          }
        });

        return allRoles;
      },
      onError: (error, operation) => {
        console.error(`Failed to ${operation} roles:`, error);
      }
    }
  );

  const saveRoles = useCallback((newRoles: StaffRole[]) => {
    // The `newRoles` array is already in the desired order from drag-and-drop.
    // Do not sort it again here.
    setRoles(newRoles);
  }, [setRoles]);

  const clearAllRoles = useCallback(() => {
    setRoles(defaultRoles);
  }, [setRoles]);

  return { roles, saveRoles, isLoaded, clearAllRoles };
}
