/**
 * Hook for managing organizational departments with localStorage persistence.
 * 
 * Manages department structure and staff assignments with automatic migration
 * from legacy string[] format to StaffMember[] format.
 * 
 * @returns Department state and operations
 * @property {Department[]} departments - List of all departments
 * @property {(name: string) => void} addDepartment - Create new department
 * @property {(id: string) => void} removeDepartment - Delete department
 * @property {(id: string, updates: Partial<Department>) => void} updateDepartment - Update department
 * @property {(departments: Department[]) => void} saveDepartments - Batch update
 * @property {boolean} isLoaded - Loading state
 * 
 * @example
 * ```tsx
 * const { departments, addDepartment, updateDepartment } = useDepartments();
 * 
 * addDepartment('Operaciones Especiales');
 * updateDepartment('dept-1', { staff: [...newStaff] });
 * ```
 */

'use client';

import { useCallback } from 'react';
import type { Department, Staff } from '@/types';
import { useLocalStorage } from './use-local-storage';

const DEPARTMENTS_STORAGE_KEY = 'app-departments';

const defaultDepartments: Department[] = [
  { id: 'ops', name: 'Departamento de Operaciones', staff: {} },
  { id: 'cemuprad', name: 'CEMUPRAD', staff: {} },
  { id: 'educ', name: 'Departamento de Educación', staff: {} },
  { id: 'riesgos', name: 'Departamento de Gestión de Riesgos', staff: {} },
  { id: 'it', name: 'Departamento de Informática', staff: {} },
  { id: 'log', name: 'Departamento de Logística', staff: {} },
];

export function useDepartments() {
  const [departments, setDepartments, isLoaded] = useLocalStorage<Department[]>(
    DEPARTMENTS_STORAGE_KEY,
    defaultDepartments,
    {
      migrate: (parsed: any[]) => {
        if (!Array.isArray(parsed) || parsed.length === 0) {
          return defaultDepartments;
        }

        // Migrate old format (string[]) to new format (StaffMember[])
        return parsed.map((dept: any) => {
          const newStaff: Staff = {};
          if (!dept.staff) return { ...dept, staff: newStaff };

          // Check if migration from string[] to StaffMember[] is needed
          for (const roleName in dept.staff) {
            const staffList = dept.staff[roleName];
            if (Array.isArray(staffList) && staffList.length > 0 && typeof staffList[0] === 'string') {
              // This is the old format (string[])
              newStaff[roleName] = staffList.map((name: string) => ({
                id: `staff_${Date.now()}_${Math.random()}`,
                name: name,
                cedula: undefined
              }));
            } else {
              // Already in new format (StaffMember[]) or empty
              newStaff[roleName] = staffList;
            }
          }
          return { ...dept, staff: newStaff };
        });
      },
      onError: (error, operation) => {
        console.error(`Failed to ${operation} departments:`, error);
      }
    }
  );

  const saveDepartments = useCallback((newDepartments: Department[]) => {
    setDepartments(newDepartments);
  }, [setDepartments]);

  const addDepartment = useCallback((newDepartment: Department) => {
    setDepartments(prev => [...prev, newDepartment].sort((a, b) => a.name.localeCompare(b.name)));
  }, [setDepartments]);

  const removeDepartment = useCallback((departmentId: string) => {
    setDepartments(prev => prev.filter(d => d.id !== departmentId));
  }, [setDepartments]);

  const updateDepartment = useCallback((updatedDepartment: Department) => {
    setDepartments(prev => prev.map(d => d.id === updatedDepartment.id ? updatedDepartment : d));
  }, [setDepartments]);

  const clearAllDepartments = useCallback(() => {
    setDepartments(defaultDepartments);
  }, [setDepartments]);


  return { departments, addDepartment, removeDepartment, updateDepartment, isLoaded, clearAllDepartments, saveDepartments };
}
