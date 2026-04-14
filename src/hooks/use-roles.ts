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
 * const defaultRole: StaffRole = {
 *   name: 'Nuevo Cargo',
 *   isSingle: false,
 *   departmentScope: [DEPARTMENT_IDS.OPERATIONS], // Default to operations
 *   order: roles.length
 * };
 * saveRoles([...roles, defaultRole]);
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StaffRole } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { PERSONNEL_STATUS } from '@/lib/constants/personnel';
import { DEFAULT_ROLES } from '@/lib/constants/structure';
import { DEPARTMENT_IDS } from '@/lib/constants/departments';

export function useRoles() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;
    let initialized = false;

    const sub = db.lookups
      .find({
        selector: { 
          type: 'role',
          workspaceId: currentWorkspace
        },
        sort: [{ 'data.order': 'asc' }],
      })
      .$.subscribe(async (data) => {
        if (data.length > 0) {
          const loadedRoles = data.map((d) => {
            const json = d.toJSON();
            return { ...(json.data as StaffRole), workspaceId: currentWorkspace };
          }) as StaffRole[];
          setRoles(loadedRoles);
          initialized = true;
        } else if (!initialized) {
          // Auto-seed default roles on first load for this workspace
          initialized = true;
          try {
            const existing = await db.lookups.find({ selector: { type: 'role', workspaceId: currentWorkspace } }).exec();
            if (existing.length === 0) {
              await db.lookups.bulkInsert(DEFAULT_ROLES.map(role => ({
                id: `${currentWorkspace}:role:${role.name}`,
                workspaceId: currentWorkspace,
                type: 'role' as const,
                name: role.name,
                data: role
              })));
            }
          } catch (err) {
            logger.error('Failed to auto-seed default roles', err, { feature: 'Roles', workspaceId: currentWorkspace });
          }
        } else {
          setRoles([]);
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
      
      const toInsert = DEFAULT_ROLES.map((role) => ({
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
