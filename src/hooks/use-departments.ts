/**
 * Hook for managing organizational departments with RxDB persistence.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Department } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { DEFAULT_DEPARTMENTS } from '@/lib/constants/structure';
import { createLookupRepository } from '@/lib/repositories';

export function useDepartments() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initializedFlag = false;

    const repo = createLookupRepository(db, currentWorkspace);

    const sub = repo.watchDepartments().subscribe(async (data) => {
      if (data.length > 0) {
        setDepartments(
          data.map((d) => {
            const json = d.toJSON();
            return { ...(json.data as Department), workspaceId: currentWorkspace };
          }) as Department[]
        );
        initializedFlag = true;
        setIsLoaded(true);
      } else if (!initializedFlag) {
        initializedFlag = true;
        try {
          await repo.bulkInitDepartments(DEFAULT_DEPARTMENTS);
        } catch (err) {
          logger.error('Failed to auto-seed default departments', err, {
            feature: 'Departments',
            workspaceId: currentWorkspace,
          });
          setIsLoaded(true);
        }
      } else {
        setDepartments([]);
        setIsLoaded(true);
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveDepartments = useCallback(
    async (newDepartments: Department[]) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace);
      await repo.saveDepartments(newDepartments);
    },
    [db, currentWorkspace]
  );

  const addDepartment = useCallback(
    async (newDepartment: Department) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace);
      await repo.addDepartment(newDepartment);
    },
    [db, currentWorkspace]
  );

  const removeDepartment = useCallback(
    async (departmentId: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace);
      await repo.removeDepartment(departmentId);
    },
    [db, currentWorkspace]
  );

  const updateDepartment = useCallback(
    async (updatedDepartment: Department) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace);
      await repo.updateDepartment(updatedDepartment);
    },
    [db, currentWorkspace]
  );

  const clearAllDepartments = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createLookupRepository(db, currentWorkspace);
    await repo.clearAllDepartments(DEFAULT_DEPARTMENTS);
  }, [db, currentWorkspace]);

  return {
    departments,
    addDepartment,
    removeDepartment,
    updateDepartment,
    isLoaded,
    clearAllDepartments,
    saveDepartments,
  };
}
