/**
 * Hook for managing staff roles with RxDB persistence.
 *
 * Manages organizational roles with department scope and single/multi assignment using RxDB.
 *
 * @returns Role state and operations
 * @property {StaffRole[]} roles - List of all roles
 * @property {(roles: StaffRole[]) => void} saveRoles - Update roles list
 * @property {() => void} clearAllRoles - Reset to default roles
 * @property {boolean} isLoaded - Loading state
 *
 * @example
 * ```tsx
 * const { roles, saveRoles } = useRoles();
 *
 * const updatedRoles = [...roles, {
 *   name: 'Coordinador',
 *   isSingle: true,
 *   departmentScope: ['ops']
 * }];
 * saveRoles(updatedRoles);
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StaffRole } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';
import { logger } from '@/lib/logger';
import { LEADER_ROLES } from '@/constants/roles';
import { PERSONNEL_STATUS } from '@/constants/personnel';

const defaultRoles: StaffRole[] = [
  { name: LEADER_ROLES.DIRECTOR, isSingle: true, departmentScope: [], order: 0 },
  { name: LEADER_ROLES.JEFE_OPERACIONES, isSingle: true, departmentScope: ['ops'], order: 1 },
  { name: 'Jefe de los Servicios', isSingle: true, departmentScope: ['ops'], order: 2 },
  { name: 'Analista de CEMUPRAD', isSingle: false, departmentScope: ['cemuprad'], order: 3 },
  { name: 'Operador de radio', isSingle: false, departmentScope: ['ops'], order: 4 },
  { name: 'Técnico', isSingle: false, departmentScope: ['ops'], order: 5 },
  { name: 'Auxiliar', isSingle: false, departmentScope: ['ops'], order: 6 },
  { name: 'Conductor', isSingle: false, departmentScope: ['ops'], order: 7 },
  {
    name: PERSONNEL_STATUS.REPOSO.charAt(0).toUpperCase() + PERSONNEL_STATUS.REPOSO.slice(1),
    isSingle: false,
    departmentScope: [],
    order: 8,
  },
  {
    name: PERSONNEL_STATUS.PERMISO.charAt(0).toUpperCase() + PERSONNEL_STATUS.PERMISO.slice(1),
    isSingle: false,
    departmentScope: [],
    order: 9,
  },
  {
    name: PERSONNEL_STATUS.APOYO.charAt(0).toUpperCase() + PERSONNEL_STATUS.APOYO.slice(1),
    isSingle: false,
    departmentScope: [],
    order: 10,
  },
  {
    name: PERSONNEL_STATUS.VACACIONES.charAt(0).toUpperCase() + PERSONNEL_STATUS.VACACIONES.slice(1),
    isSingle: false,
    departmentScope: [],
    order: 11,
  },
];

export function useRoles() {
  const db = useDatabase();
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.roles
      .find({
        sort: [{ order: 'asc' }],
      })
      .$.subscribe((data) => {
        if (data.length > 0) {
          setRoles(data.map((d) => d.toJSON()) as StaffRole[]);
        } else {
          // Initial roles if DB is empty
          db.roles
            .bulkInsert(defaultRoles)
            .catch((err) => {
              const isConflict =
                err.code === 'CONFLICT' ||
                err.status === 409 ||
                err.message?.includes('conflict') ||
                err.parameters?.writeError?.status === 409;

              if (!isConflict) {
                logger.error('Failed to insert default roles', err, { feature: 'Roles' });
              }
            });
        }
        setIsLoaded(true);
      });

    return () => sub.unsubscribe();
  }, [db]);

  const saveRoles = useCallback(
    async (newRoles: StaffRole[]) => {
      if (!db) return;

      // Optimistic update for immediate UI response
      setRoles(newRoles);

      try {
        const allDocs = await db.roles.find().exec();
        const newNames = new Set(newRoles.map((r) => r.name));
        const toDelete = allDocs.filter((d) => !newNames.has(d.name));

        if (toDelete.length > 0) {
          await Promise.all(toDelete.map((d) => d.remove()));
        }

        await db.roles.bulkUpsert(newRoles);
      } catch (error) {
        logger.error('Failed to save roles', error, { feature: 'Roles' });
        // The subscription will eventually revert the state to the DB version if it fails
      }
    },
    [db]
  );

  const clearAllRoles = useCallback(async () => {
    if (!db) return;
    try {
      const allDocs = await db.roles.find().exec();
      await Promise.all(allDocs.map((d) => d.remove()));
      await db.roles.bulkInsert(defaultRoles);
    } catch (error) {
      logger.error('Failed to clear roles', error, { feature: 'Roles' });
    }
  }, [db]);

  return { roles, saveRoles, isLoaded, clearAllRoles };
}
