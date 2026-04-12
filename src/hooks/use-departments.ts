/**
 * Hook for managing organizational departments with RxDB persistence.
 *
 * Manages department structure and staff assignments using RxDB.
 *
 * @returns Department state and operations
 * @property {Department[]} departments - List of all departments
 * @property {(name: string) => void} addDepartment - Create new department
 * @property {(id: string) => void} removeDepartment - Delete department
 * @property {(id: string, updates: Partial<Department>) => void} updateDepartment - Update department
 * @property {(departments: Department[]) => void} saveDepartments - Batch update
 * @property {boolean} isLoaded - Loading state
 *
 * @example
 * ```tsx
 * const { departments, addDepartment, updateDepartment } = useDepartments();
 *
 * addDepartment('Operaciones Especiales');
 * updateDepartment('dept-1', { staff: [...newStaff] });
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Department } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';

const defaultDepartments: Department[] = [
  { id: 'ops', name: 'Departamento de Operaciones', staff: {} },
  { id: 'cemuprad', name: 'CEMUPRAD', staff: {} },
  { id: 'educ', name: 'Departamento de Educación', staff: {} },
  { id: 'riesgos', name: 'Departamento de Gestión de Riesgos', staff: {} },
  { id: 'it', name: 'Departamento de Informática', staff: {} },
  { id: 'log', name: 'Departamento de Logística', staff: {} },
];

export function useDepartments() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.lookups
      .find({
        selector: { 
          type: 'department',
          workspaceId: currentWorkspace 
        },
      })
      .$.subscribe((data) => {
        if (data.length > 0) {
          setDepartments(data.map((d) => {
            const json = d.toJSON();
            return { ...(json.data as Department), workspaceId: currentWorkspace };
          }) as Department[]);
        } else {
          setDepartments([]);
        }
        setIsLoaded(true);
      });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveDepartments = useCallback(
    async (newDepartments: Department[]) => {
      if (!db || !currentWorkspace) return;
      try {
        const allDocs = await db.lookups.find({ selector: { type: 'department', workspaceId: currentWorkspace } }).exec();
        const newIds = new Set(newDepartments.map((d) => `${currentWorkspace}:dept:${d.id}`));
        const toDelete = allDocs.filter((d) => !newIds.has(d.primary));
        if (toDelete.length > 0) {
          await db.lookups.bulkRemove(toDelete.map((d) => d.primary));
        }

        const toUpsert = newDepartments.map((dept) => ({
          id: `${currentWorkspace}:dept:${dept.id}`,
          workspaceId: currentWorkspace,
          type: 'department' as const,
          name: dept.name,
          data: { ...dept, workspaceId: currentWorkspace },
        }));
        await db.lookups.bulkUpsert(toUpsert as any);
      } catch (error) {
        logger.error('Failed to save departments', error, { feature: 'Departments', workspaceId: currentWorkspace });
      }
    },
    [db, currentWorkspace]
  );

  const addDepartment = useCallback(
    async (newDepartment: Department) => {
      if (!db || !currentWorkspace) return;
      try {
        await db.lookups.insert({
          id: `${currentWorkspace}:dept:${newDepartment.id}`,
          workspaceId: currentWorkspace,
          type: 'department',
          name: newDepartment.name,
          data: { ...newDepartment, workspaceId: currentWorkspace },
        });
      } catch (error) {
        logger.error('Failed to add department', error, { feature: 'Departments', workspaceId: currentWorkspace, metadata: { departmentId: newDepartment.id } });
      }
    },
    [db, currentWorkspace]
  );

  const removeDepartment = useCallback(
    async (departmentId: string) => {
      if (!db || !currentWorkspace) return;
      try {
        const doc = await db.lookups.findOne(`${currentWorkspace}:dept:${departmentId}`).exec();
        if (doc) await doc.remove();
      } catch (error) {
        logger.error('Failed to remove department', error, { feature: 'Departments', workspaceId: currentWorkspace, metadata: { departmentId } });
      }
    },
    [db, currentWorkspace]
  );

  const updateDepartment = useCallback(
    async (updatedDepartment: Department) => {
      if (!db || !currentWorkspace) return;
      try {
        const doc = await db.lookups.findOne(`${currentWorkspace}:dept:${updatedDepartment.id}`).exec();
        if (doc) {
          await doc.patch({
            name: updatedDepartment.name,
            data: { ...updatedDepartment, workspaceId: currentWorkspace },
          });
        }
      } catch (error) {
        logger.error('Failed to update department', error, { feature: 'Departments', workspaceId: currentWorkspace, metadata: { departmentId: updatedDepartment.id } });
      }
    },
    [db, currentWorkspace]
  );

  const clearAllDepartments = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const allDocs = await db.lookups.find({ selector: { type: 'department', workspaceId: currentWorkspace } }).exec();
      await db.lookups.bulkRemove(allDocs.map((d) => d.primary));
      
      const toInsert = defaultDepartments.map((dept) => ({
        id: `${currentWorkspace}:dept:${dept.id}`,
        workspaceId: currentWorkspace,
        type: 'department' as const,
        name: dept.name,
        data: { ...dept, workspaceId: currentWorkspace },
      }));
      await db.lookups.bulkInsert(toInsert as any);
    } catch (error) {
      logger.error('Failed to clear departments', error, { feature: 'Departments', workspaceId: currentWorkspace });
    }
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
