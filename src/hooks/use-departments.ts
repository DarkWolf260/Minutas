
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Department, Staff } from '@/types';

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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEPARTMENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migratedDepartments = parsed.map((dept: any) => {
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
          setDepartments(migratedDepartments);
        } else {
          setDepartments(defaultDepartments);
        }
      } else {
        setDepartments(defaultDepartments);
      }
    } catch (error) {
      console.error('Failed to load departments from localStorage', error);
      setDepartments(defaultDepartments);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveDepartments = useCallback((newDepartments: Department[]) => {
    setDepartments(newDepartments);
    try {
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(newDepartments));
    } catch (error) {
      console.error('Failed to save departments to localStorage', error);
    }
  }, []);

  const addDepartment = useCallback((newDepartment: Department) => {
    const updated = [...departments, newDepartment].sort((a, b) => a.name.localeCompare(b.name));
    saveDepartments(updated);
  }, [departments, saveDepartments]);

  const removeDepartment = useCallback((departmentId: string) => {
    const updated = departments.filter(d => d.id !== departmentId);
    saveDepartments(updated);
  }, [departments, saveDepartments]);

  const updateDepartment = useCallback((updatedDepartment: Department) => {
    const updated = departments.map(d => d.id === updatedDepartment.id ? updatedDepartment : d);
    saveDepartments(updated);
  }, [departments, saveDepartments]);

  const clearAllDepartments = useCallback(() => {
    saveDepartments(defaultDepartments);
  }, [saveDepartments]);


  return { departments, addDepartment, removeDepartment, updateDepartment, isLoaded, clearAllDepartments, saveDepartments };
}
