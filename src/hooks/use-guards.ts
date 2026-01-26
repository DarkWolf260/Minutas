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

import { useState, useEffect, useCallback } from 'react';
import type { Guard } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';

const defaultGuards: Guard[] = [
  { id: 'A', staff: {} },
  { id: 'B', staff: {} },
  { id: 'C', staff: {} },
  { id: 'D', staff: {} },
];

export function useGuards() {
  const db = useDatabase();
  const [guards, setGuards] = useState<Guard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.guards.find().$.subscribe(data => {
      if (data.length > 0) {
        setGuards(data.map(d => d.toJSON()) as Guard[]);
      } else {
        // Initial guards if DB is empty
        db.guards.bulkInsert(defaultGuards).catch(err => console.error('Failed to insert default guards:', err));
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const saveGuards = useCallback(async (newGuards: Guard[]) => {
    if (!db) return;
    try {
      await db.guards.bulkUpsert(newGuards);
    } catch (error) {
      console.error('Failed to save guards:', error);
    }
  }, [db]);

  const clearAllGuards = useCallback(async () => {
    if (!db) return;
    try {
      const allDocs = await db.guards.find().exec();
      await Promise.all(allDocs.map(d => d.remove()));
      await db.guards.bulkInsert(defaultGuards);
    } catch (error) {
      console.error('Failed to clear guards:', error);
    }
  }, [db]);

  return { guards, saveGuards, isLoaded, clearAllGuards };
}
