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
import type { Guard } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';

const defaultGuards: Guard[] = [
  { id: 'A', staff: {} },
  { id: 'B', staff: {} },
  { id: 'C', staff: {} },
  { id: 'D', staff: {} },
];

export function useGuards() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [guards, setGuards] = useState<Guard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initialized = false;

    const sub = db.configs.find({
      selector: { 
        type: 'guard',
        workspaceId: currentWorkspace
      }
    }).$.subscribe((data) => {
      if (data.length > 0) {
        setGuards(data.map((d) => {
          const json = d.toJSON();
          const guardData = json.data as Guard;
          // Ensure the returned guard object reflects its associated workspace in the UI if needed
          return { ...guardData, workspaceId: currentWorkspace };
        }) as Guard[]);
        initialized = true;
      } else if (!initialized) {
        // Only insert defaults on the very first load for this workspace
        initialized = true;
        const docs = defaultGuards.map(g => ({
          id: `${currentWorkspace}:guard:${g.id}`,
          workspaceId: currentWorkspace,
          type: 'guard' as const,
          name: g.id,
          data: { ...g, workspaceId: currentWorkspace }
        }));
        db.configs
          .bulkInsert(docs)
          .catch((err) => logger.error('Failed to insert default guards', err, { feature: 'Guards', workspaceId: currentWorkspace }));
      } else {
        // User deleted all guards — keep the list empty
        setGuards([]);
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveGuards = useCallback(
    async (newGuards: Guard[]) => {
      if (!db || !currentWorkspace) return;
      try {
        // Delete guards that are no longer in the list for this workspace
        const existingDocs = await db.configs.find({
          selector: { 
            type: 'guard',
            workspaceId: currentWorkspace
          }
        }).exec();
        const newIds = new Set(newGuards.map((g) => `${currentWorkspace}:guard:${g.id}`));
        const toDelete = existingDocs.filter((doc) => !newIds.has(doc.id));
        await Promise.all(toDelete.map((doc) => doc.remove()));
        
        // Upsert the remaining/updated guards
        if (newGuards.length > 0) {
          const docs = newGuards.map(g => ({
            id: `${currentWorkspace}:guard:${g.id}`,
            workspaceId: currentWorkspace,
            type: 'guard' as const,
            name: g.id,
            data: { ...g, workspaceId: currentWorkspace }
          }));
          await db.configs.bulkUpsert(docs);
        }
      } catch (error) {
        logger.error('Failed to save guards', error, { feature: 'Guards', workspaceId: currentWorkspace });
      }
    },
    [db, currentWorkspace]
  );

  const clearAllGuards = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const allDocs = await db.configs.find({
        selector: { 
          type: 'guard',
          workspaceId: currentWorkspace
        }
      }).exec();
      await Promise.all(allDocs.map((d) => d.remove()));
      
      const docs = defaultGuards.map(g => ({
        id: `${currentWorkspace}:guard:${g.id}`,
        workspaceId: currentWorkspace,
        type: 'guard' as const,
        name: g.id,
        data: { ...g, workspaceId: currentWorkspace }
      }));
      await db.configs.bulkInsert(docs);
    } catch (error) {
      logger.error('Failed to clear guards', error, { feature: 'Guards', workspaceId: currentWorkspace });
    }
  }, [db, currentWorkspace]);

  return { guards, saveGuards, isLoaded, clearAllGuards };
}
