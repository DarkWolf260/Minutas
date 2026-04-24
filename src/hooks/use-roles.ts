/**
 * Hook for managing staff roles with RxDB persistence.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StaffRole } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { DEFAULT_ROLES } from '@/lib/constants/structure';
import { createLookupRepository } from '@/lib/repositories';

export function useRoles() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initializedFlag = false;

    const repo = createLookupRepository(db, currentWorkspace);

    const sub = repo.watchRoles().subscribe(async (data) => {
      if (data.length > 0) {
        setRoles(
          data.map((d) => {
            const json = d.toJSON();
            return { ...(json.data as StaffRole), workspaceId: currentWorkspace };
          }) as StaffRole[]
        );
        initializedFlag = true;
        setIsLoaded(true);
      } else if (!initializedFlag) {
        initializedFlag = true;
        try {
          await repo.bulkInitRoles(DEFAULT_ROLES);
        } catch (err) {
          logger.error('Failed to auto-seed default roles', err, {
            feature: 'Roles',
            workspaceId: currentWorkspace,
          });
          setIsLoaded(true);
        }
      } else {
        setRoles([]);
        setIsLoaded(true);
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveRoles = useCallback(
    async (newRoles: StaffRole[]) => {
      if (!db || !currentWorkspace) return;
      // Optimistic update
      setRoles(newRoles);
      const repo = createLookupRepository(db, currentWorkspace);
      await repo.saveRoles(newRoles);
    },
    [db, currentWorkspace]
  );

  const clearAllRoles = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createLookupRepository(db, currentWorkspace);
    await repo.clearAllRoles(DEFAULT_ROLES);
  }, [db, currentWorkspace]);

  return { roles, saveRoles, isLoaded, clearAllRoles };
}
