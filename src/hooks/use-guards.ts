
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Guard, Staff, StaffMember } from '@/types';

const GUARDS_STORAGE_KEY = 'app-guards';

const defaultGuards: Guard[] = [
    { id: 'A', staff: {} },
    { id: 'B', staff: {} },
    { id: 'C', staff: {} },
    { id: 'D', staff: {} },
];

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
                const newStaff: Staff = {};
                if (!guard.staff) return { ...guard, staff: newStaff };

                // Check if migration from string[] to StaffMember[] is needed
                for (const roleName in guard.staff) {
                    const staffList = guard.staff[roleName];
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
                return { ...guard, staff: newStaff };
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
