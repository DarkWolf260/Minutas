/**
 * Hook for managing guard assignments with localStorage persistence.
 * 
 * Manages guard schedules and staff assignments for operational shifts.
 * Automatically migrates staff data from legacy string[] to StaffMember[] format.
 * 
 * @returns Guard state and operations
 * @property {Guard[]} guards - List of all guards with their staff assignments
 * @property {(guards: Guard[]) => void} saveGuards - Update guard list
 * @property {boolean} isLoaded - Loading state
 * 
 * @example
 * ```tsx
 * const { guards, saveGuards, isLoaded } = useGuards();
 * 
 * // Update guard staff
 * const updatedGuards = guards.map(g => 
 *   g.id === 'A' ? { ...g, staff: newStaff } : g
 * );
 * saveGuards(updatedGuards);
 * ```
 */

'use client';

import { useCallback } from 'react';
import type { Guard, Staff } from '@/types';
import { useLocalStorage } from './use-local-storage';

const GUARDS_STORAGE_KEY = 'app-guards';

const defaultGuards: Guard[] = [
  { id: 'A', staff: {} },
  { id: 'B', staff: {} },
  { id: 'C', staff: {} },
  { id: 'D', staff: {} },
];

export function useGuards() {
  const [guards, setGuards, isLoaded] = useLocalStorage<Guard[]>(
    GUARDS_STORAGE_KEY,
    defaultGuards,
    {
      migrate: (parsedGuards: any[]) => {
        if (!parsedGuards || parsedGuards.length === 0) {
          return defaultGuards;
        }

        // Migrate old format (string[]) to new format (StaffMember[])
        return parsedGuards.map((guard: any) => {
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
      },
      onError: (error, operation) => {
        console.error(`Failed to ${operation} guards:`, error);
      }
    }
  );

  const saveGuards = useCallback((newGuards: Guard[]) => {
    setGuards(newGuards);
  }, [setGuards]);

  const clearAllGuards = useCallback(() => {
    setGuards(defaultGuards);
  }, [setGuards]);

  return { guards, saveGuards, isLoaded, clearAllGuards };
}
