
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Department } from '@/types';

const DEPARTMENTS_STORAGE_KEY = 'app-departments';

const defaultDepartments: Department[] = [
    { id: 'capacitacion', name: 'Capacitación', staff: {} },
    { id: 'gestion_riesgos', name: 'Gestión de Riesgos', staff: {} },
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
            setDepartments(parsed);
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
    try {
      localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(newDepartments));
      setDepartments(newDepartments);
    } catch (error) {
      console.error('Failed to save departments to localStorage', error);
    }
  }, []);
  
  const addDepartment = useCallback((newDepartment: Department) => {
    const updated = [...departments, newDepartment].sort((a,b) => a.name.localeCompare(b.name));
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


  return { departments, addDepartment, removeDepartment, updateDepartment, isLoaded };
}
