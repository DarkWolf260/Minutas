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
import type { Department } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.departments.find().$.subscribe((data) => {
      if (data.length > 0) {
        setDepartments(data.map((d) => d.toJSON()) as Department[]);
      } else {
        // Initial departments if DB is empty
        db.departments
          .bulkInsert(defaultDepartments)
          .catch((err) => logger.error('Failed to insert default departments', err, { feature: 'Departments' }));
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const saveDepartments = useCallback(
    async (newDepartments: Department[]) => {
      if (!db) return;
      try {
        const allDocs = await db.departments.find().exec();
        const newIds = new Set(newDepartments.map((d) => d.id));
        const toDelete = allDocs.filter((d) => !newIds.has(d.id));
        if (toDelete.length > 0) await Promise.all(toDelete.map((d) => d.remove()));
        await db.departments.bulkUpsert(newDepartments);
      } catch (error) {
        logger.error('Failed to save departments', error, { feature: 'Departments' });
      }
    },
    [db]
  );

  const addDepartment = useCallback(
    async (newDepartment: Department) => {
      if (!db) return;
      try {
        await db.departments.insert(newDepartment);
      } catch (error) {
        logger.error('Failed to add department', error, { feature: 'Departments', metadata: { departmentId: newDepartment.id } });
      }
    },
    [db]
  );

  const removeDepartment = useCallback(
    async (departmentId: string) => {
      if (!db) return;
      try {
        const doc = await db.departments.findOne(departmentId).exec();
        if (doc) await doc.remove();
      } catch (error) {
        logger.error('Failed to remove department', error, { feature: 'Departments', metadata: { departmentId } });
      }
    },
    [db]
  );

  const updateDepartment = useCallback(
    async (updatedDepartment: Department) => {
      if (!db) return;
      try {
        const doc = await db.departments.findOne(updatedDepartment.id).exec();
        if (doc) await doc.patch(updatedDepartment);
      } catch (error) {
        logger.error('Failed to update department', error, { feature: 'Departments', metadata: { departmentId: updatedDepartment.id } });
      }
    },
    [db]
  );

  const clearAllDepartments = useCallback(async () => {
    if (!db) return;
    try {
      const allDocs = await db.departments.find().exec();
      await Promise.all(allDocs.map((d) => d.remove()));
      await db.departments.bulkInsert(defaultDepartments);
    } catch (error) {
      logger.error('Failed to clear departments', error, { feature: 'Departments' });
    }
  }, [db]);

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
