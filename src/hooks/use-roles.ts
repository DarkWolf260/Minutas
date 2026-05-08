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
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initializedFlag = false;

    const repo = createLookupRepository(db, currentWorkspace, isCloud);

    const sub = repo.watchRoles().subscribe(async (data) => {
      console.log(`[useRoles] Data received (${isCloud ? 'Cloud' : 'Local'}):`, data);
      if (data.length > 0) {
        setRoles(
          data.map((d) => {
            const item = d.toJSON ? d.toJSON() : d;
            // Handle cases where Supabase might return data as a stringified JSON
            const rawData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            return { ...(rawData as StaffRole), workspace_id: currentWorkspace };
          }) as StaffRole[]
        );
        initializedFlag = true;
        setIsLoaded(true);
      } else if (!initializedFlag) {
        initializedFlag = true;
        setRoles(DEFAULT_ROLES as StaffRole[]);
        setIsLoaded(true);
      } else {
        setRoles([]);
        setIsLoaded(true);
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  const saveRoles = useCallback(
    async (newRoles: StaffRole[]) => {
      if (!db || !currentWorkspace) return;
      // Optimistic update
      setRoles(newRoles);
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.saveRoles(newRoles);
    },
    [db, currentWorkspace, isCloud]
  );

  const clearAllRoles = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createLookupRepository(db, currentWorkspace, isCloud);
    await repo.clearAllRoles(DEFAULT_ROLES);
  }, [db, currentWorkspace, isCloud]);

  return { roles, saveRoles, isLoaded, clearAllRoles };
}

