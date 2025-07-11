
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StaffRole } from '@/types';

const ROLES_STORAGE_KEY = 'app-staff-roles';

const defaultRoles: StaffRole[] = [
    { name: 'Jefe de los Servicios', isSingle: true, departmentScope: ['OPERATIONS'] },
    { name: 'Operador de Radio', isSingle: true, departmentScope: ['OPERATIONS'] },
    { name: 'CEMUPRAD', isSingle: false, departmentScope: ['OPERATIONS'] },
    { name: 'Técnico', isSingle: false, departmentScope: ['OPERATIONS'] },
    { name: 'Auxiliar', isSingle: false, departmentScope: ['OPERATIONS'] },
    { name: 'Conductor', isSingle: false, departmentScope: ['OPERATIONS'] },
    { name: 'Permiso', isSingle: false, departmentScope: [] },
    { name: 'Vacaciones', isSingle: false, departmentScope: [] },
    { name: 'Apoyo', isSingle: false, departmentScope: [] },
];


export function useRoles() {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedRoles = localStorage.getItem(ROLES_STORAGE_KEY);
      if (storedRoles) {
        const parsed = JSON.parse(storedRoles);
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

        setRoles(allRoles);
      } else {
        setRoles(defaultRoles);
      }
    } catch (error) {
      console.error('Failed to load roles from localStorage', error);
      setRoles(defaultRoles);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const saveRoles = useCallback((newRoles: StaffRole[]) => {
    try {
      // The `newRoles` array is already in the desired order from drag-and-drop.
      // Do not sort it again here.
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(newRoles));
      setRoles(newRoles);
    } catch (error) {
      console.error('Failed to save roles to localStorage', error);
    }
  }, []);

  const clearAllRoles = useCallback(() => {
    try {
      localStorage.removeItem(ROLES_STORAGE_KEY);
      setRoles(defaultRoles);
    } catch (error) {
      console.error('Failed to clear roles from localStorage', error);
    }
  }, []);

  return { roles, saveRoles, isLoaded, clearAllRoles };
}
