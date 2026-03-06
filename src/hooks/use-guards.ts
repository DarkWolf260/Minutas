/**
 * Hook for managing guard assignments with RxDB persistence.
 *
 * Manages guard schedules and staff assignments for operational shifts using RxDB.
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
import { logger } from '@/lib/logger';

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
    let initialized = false;

    const sub = db.guards.find().$.subscribe((data) => {
      if (data.length > 0) {
        setGuards(data.map((d) => d.toJSON()) as Guard[]);
        initialized = true;
      } else if (!initialized) {
        // Only insert defaults on the very first load (never been set up before)
        initialized = true;
        db.guards
          .bulkInsert(defaultGuards)
          .catch((err) => logger.error('Failed to insert default guards', err, { feature: 'Guards' }));
      } else {
        // User deleted all guards — keep the list empty
        setGuards([]);
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const saveGuards = useCallback(
    async (newGuards: Guard[]) => {
      if (!db) return;
      try {
        // Delete guards that are no longer in the list
        const existingDocs = await db.guards.find().exec();
        const newIds = new Set(newGuards.map((g) => g.id));
        const toDelete = existingDocs.filter((doc) => !newIds.has(doc.id));
        await Promise.all(toDelete.map((doc) => doc.remove()));
        // Upsert the remaining/updated guards
        if (newGuards.length > 0) {
          await db.guards.bulkUpsert(newGuards);
        }
      } catch (error) {
        logger.error('Failed to save guards', error, { feature: 'Guards' });
      }
    },
    [db]
  );

  const clearAllGuards = useCallback(async () => {
    if (!db) return;
    try {
      const allDocs = await db.guards.find().exec();
      await Promise.all(allDocs.map((d) => d.remove()));
      await db.guards.bulkInsert(defaultGuards);
    } catch (error) {
      logger.error('Failed to clear guards', error, { feature: 'Guards' });
    }
  }, [db]);

  return { guards, saveGuards, isLoaded, clearAllGuards };
}
