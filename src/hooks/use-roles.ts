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
import type { StaffRole } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { LEADER_ROLES } from '@/lib/constants/roles';
import { PERSONNEL_STATUS } from '@/lib/constants/personnel';

const defaultRoles: StaffRole[] = [
  { name: LEADER_ROLES.DIRECTOR, isSingle: true, departmentScope: [], order: 0 },
  { name: LEADER_ROLES.JEFE_OPERACIONES, isSingle: true, departmentScope: ['ops'], order: 1 },
  { name: 'Jefe de los Servicios', isSingle: true, departmentScope: ['ops'], order: 2 },
  { name: 'Analista de CEMUPRAD', isSingle: false, departmentScope: ['cemuprad'], order: 3 },
  { name: 'Auxiliar de CEMUPRAD', isSingle: false, departmentScope: ['cemuprad'], order: 4 },
  { name: 'Operador de radio', isSingle: false, departmentScope: ['ops'], order: 5 },
  { name: 'Técnico', isSingle: false, departmentScope: ['ops'], order: 6 },
  { name: 'Auxiliar', isSingle: false, departmentScope: ['ops'], order: 7 },
  { name: 'Conductor', isSingle: false, departmentScope: ['ops'], order: 8 },
  {
    name: PERSONNEL_STATUS.REPOSO.charAt(0).toUpperCase() + PERSONNEL_STATUS.REPOSO.slice(1),
    isSingle: false,
    departmentScope: [],
    order: 9,
  },
  {
    name: PERSONNEL_STATUS.PERMISO.charAt(0).toUpperCase() + PERSONNEL_STATUS.PERMISO.slice(1),
    isSingle: false,
    departmentScope: [],
    order: 10,
  },
  {
    name: 'Apoyo',
    isSingle: false,
    departmentScope: [],
    order: 11,
  },
  {
    name: PERSONNEL_STATUS.VACACIONES.charAt(0).toUpperCase() + PERSONNEL_STATUS.VACACIONES.slice(1),
    isSingle: false,
    departmentScope: [],
    order: 12,
  },
];

export function useRoles() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.lookups
      .find({
        selector: { 
          type: 'role',
          workspaceId: currentWorkspace
        },
        sort: [{ 'data.order': 'asc' }],
      })
      .$.subscribe((data) => {
        if (data.length > 0) {
          const loadedRoles = data.map((d) => {
            const json = d.toJSON();
            return { ...(json.data as StaffRole), workspaceId: currentWorkspace };
          }) as StaffRole[];
          setRoles(loadedRoles);

          // Check for missing default roles and insert them
          const existingRoleNames = new Map(loadedRoles.map(r => [r.name.toLowerCase(), r]));
          const missingDefaults = defaultRoles.filter(
            dr => !existingRoleNames.has(dr.name.toLowerCase())
          );

          const rolesWithIncorrectOrder = defaultRoles.filter(dr => {
            const existing = existingRoleNames.get(dr.name.toLowerCase());
            return existing && existing.order !== dr.order;
          });

          if (missingDefaults.length > 0 || rolesWithIncorrectOrder.length > 0) {
            const toUpsert = [
              ...missingDefaults.map((role) => ({
                id: `${currentWorkspace}:role:${role.name}`,
                workspaceId: currentWorkspace,
                type: 'role' as const,
                name: role.name,
                data: { ...role, workspaceId: currentWorkspace },
              })),
              ...rolesWithIncorrectOrder.map((role) => {
                const existing = existingRoleNames.get(role.name.toLowerCase())!;
                return {
                  id: `${currentWorkspace}:role:${existing.name}`, // Use existing name casing
                  workspaceId: currentWorkspace,
                  type: 'role' as const,
                  name: existing.name,
                  data: { ...existing, order: role.order },
                };
              })
            ];

            db.lookups.bulkUpsert(toUpsert as any).catch((err) => {
              const isConflict = err.code === 'CONFLICT' || err.status === 409;
              if (!isConflict) {
                logger.error('Failed to sync default roles and orders', err, { feature: 'Roles', workspaceId: currentWorkspace });
              }
            });
          }
        } else {
          // Initial roles if DB is empty for this workspace
          const toInsert = defaultRoles.map((role) => ({
            id: `${currentWorkspace}:role:${role.name}`,
            workspaceId: currentWorkspace,
            type: 'role' as const,
            name: role.name,
            data: { ...role, workspaceId: currentWorkspace },
          }));

          db.lookups.bulkInsert(toInsert as any).catch((err) => {
            const isConflict = err.code === 'CONFLICT' || err.status === 409;
            if (!isConflict) {
              logger.error('Failed to insert default roles', err, { feature: 'Roles', workspaceId: currentWorkspace });
            }
          });
        }
        setIsLoaded(true);
      });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveRoles = useCallback(
    async (newRoles: StaffRole[]) => {
      if (!db) return;

      // Optimistic update
      setRoles(newRoles);

      try {
        const allDocs = await db.lookups.find({ selector: { type: 'role', workspaceId: currentWorkspace } }).exec();
        const newIds = new Set(newRoles.map((r) => `${currentWorkspace}:role:${r.name}`));
        const toDelete = allDocs.filter((d) => !newIds.has(d.primary));

        if (toDelete.length > 0) {
          await db.lookups.bulkRemove(toDelete.map((d) => d.primary));
        }

        const toUpsert = newRoles.map((role) => ({
          id: `${currentWorkspace}:role:${role.name}`,
          workspaceId: currentWorkspace,
          type: 'role' as const,
          name: role.name,
          data: { ...role, workspaceId: currentWorkspace },
        }));

        await db.lookups.bulkUpsert(toUpsert as any);
      } catch (error) {
        logger.error('Failed to save roles', error, { feature: 'Roles', workspaceId: currentWorkspace });
      }
    },
    [db, currentWorkspace]
  );

  const clearAllRoles = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const allDocs = await db.lookups.find({ selector: { type: 'role', workspaceId: currentWorkspace } }).exec();
      await db.lookups.bulkRemove(allDocs.map((d) => d.primary));
      
      const toInsert = defaultRoles.map((role) => ({
        id: `${currentWorkspace}:role:${role.name}`,
        workspaceId: currentWorkspace,
        type: 'role' as const,
        name: role.name,
        data: { ...role, workspaceId: currentWorkspace },
      }));
      
      await db.lookups.bulkInsert(toInsert as any);
    } catch (error) {
      logger.error('Failed to clear roles', error, { feature: 'Roles', workspaceId: currentWorkspace });
    }
  }, [db, currentWorkspace]);

  return { roles, saveRoles, isLoaded, clearAllRoles };
}
