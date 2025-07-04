
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Guard, Staff } from '@/types';

const GUARDS_STORAGE_KEY = 'app-guards';

const defaultGuards: Guard[] = [
    { id: 'A', staff: {} },
    { id: 'B', staff: {} },
    { id: 'C', staff: {} },
    { id: 'D', staff: {} },
];

const roleNameMapping: Record<string, string> = {
    jefeServicios: 'Jefe de los Servicios',
    operadorRadio: 'Operador de Radio',
    cemprad: 'CEMUPRAD',
    tecnico: 'Técnico',
    auxiliar: 'Auxiliar',
    conductor: 'Conductor',
    permiso: 'Permiso',
    vacaciones: 'Vacaciones',
    apoyo: 'Apoyo',
};


export function useGuards() {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedGuards = localStorage.getItem(GUARDS_STORAGE_KEY);
      if (storedGuards) {
        const parsedGuards = JSON.parse(storedGuards);
        if (parsedGuards.length > 0) {
            const migratedGuards = parsedGuards.map((guard: any) => {
                // Check if migration is needed by looking for an old key
                if (guard.staff && typeof guard.staff.jefeServicios !== 'undefined') {
                    const newStaff: Staff = {};
                    for (const oldKey in guard.staff) {
                        const newKey = roleNameMapping[oldKey];
                        if (newKey) {
                            const value = guard.staff[oldKey];
                            if (typeof value === 'string') {
                                newStaff[newKey] = value ? [value] : [];
                            } else if (Array.isArray(value)) {
                                newStaff[newKey] = value.filter(Boolean);
                            }
                        }
                    }
                    return { ...guard, staff: newStaff };
                }
                return guard; // Already in new format
            });
            setGuards(migratedGuards);
        } else {
            setGuards(defaultGuards);
        }
      } else {
        setGuards(defaultGuards);
      }
    } catch (error) {
      console.error('Failed to load or migrate guards from localStorage', error);
      setGuards(defaultGuards);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const saveGuards = useCallback((newGuards: Guard[]) => {
    try {
      localStorage.setItem(GUARDS_STORAGE_KEY, JSON.stringify(newGuards));
      setGuards(newGuards);
    } catch (error) {
      console.error('Failed to save guards to localStorage', error);
    }
  }, []);

  const clearAllGuards = useCallback(() => {
    try {
      localStorage.removeItem(GUARDS_STORAGE_KEY);
      setGuards(defaultGuards);
    } catch (error) {
      console.error('Failed to clear guards from localStorage', error);
    }
  }, []);

  return { guards, saveGuards, isLoaded, clearAllGuards };
}
