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
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initializedFlag = false;

    const repo = createLookupRepository(db, currentWorkspace, isCloud);

    const sub = repo.watchDepartments().subscribe(async (data) => {
      console.log(`[useDepartments] Data received (${isCloud ? 'Cloud' : 'Local'}):`, data);
      if (data.length > 0) {
        setDepartments(
          data.map((d) => {
            const item = d.toJSON ? d.toJSON() : d;
            // Handle cases where Supabase might return data as a stringified JSON
            const rawData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
            return { ...(rawData as Department), workspace_id: currentWorkspace };
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
            workspace_id: currentWorkspace,
          });
          setIsLoaded(true);
        }
      } else {
        setDepartments([]);
        setIsLoaded(true);
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  const saveDepartments = useCallback(
    async (newDepartments: Department[]) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.saveDepartments(newDepartments);
    },
    [db, currentWorkspace, isCloud]
  );

  const addDepartment = useCallback(
    async (newDepartment: Department) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.addDepartment(newDepartment);
    },
    [db, currentWorkspace, isCloud]
  );

  const removeDepartment = useCallback(
    async (departmentId: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.removeDepartment(departmentId);
    },
    [db, currentWorkspace, isCloud]
  );

  const updateDepartment = useCallback(
    async (updatedDepartment: Department) => {
      if (!db || !currentWorkspace) return;
      const repo = createLookupRepository(db, currentWorkspace, isCloud);
      await repo.updateDepartment(updatedDepartment);
    },
    [db, currentWorkspace, isCloud]
  );

  const clearAllDepartments = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createLookupRepository(db, currentWorkspace, isCloud);
    await repo.clearAllDepartments(DEFAULT_DEPARTMENTS);
  }, [db, currentWorkspace, isCloud]);

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

