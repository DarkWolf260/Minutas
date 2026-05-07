/**
 * Hook for managing personnel/staff members with RxDB persistence.
 *
 * Manages CRUD operations for personnel data using RxDB.
 *
 * @returns Personnel state and operations
 * @property {StaffMember[]} personnel - List of all personnel members
 * @property {(member: Omit<StaffMember, 'id'>) => void} addMember - Add a new member (ID auto-generated)
 * @property {(id: string, updates: Partial<StaffMember>) => void} updateMember - Update existing member
 * @property {(id: string) => void} removeMember - Remove a member
 * @property {(newPersonnel: StaffMember[]) => void} savePersonnel - Batch update personnel
 * @property {boolean} isLoaded - Loading state indicator
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StaffMember } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { StaffMemberSchema } from '@/lib/validations/schemas';
import { logger } from '@/lib/logger';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { generateId } from '@/lib/utils/id';
import { createPersonnelRepository } from '@/lib/repositories';

export function usePersonnel() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [personnel, setPersonnel] = useState<StaffMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createPersonnelRepository(db, currentWorkspace);
    const sub = repo.watchAll().subscribe((data) => {
      setPersonnel(data.map((d) => d.toJSON()) as StaffMember[]);
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const addMember = useCallback(
    async (newMember: Omit<StaffMember, 'id'>) => {
      if (!db || !currentWorkspace) return;
      try {
        const memberWithId: StaffMember = {
          ...newMember,
          id: generateId('personnel'),
          workspace_id: currentWorkspace,
        } as any;

        const validatedMember = StaffMemberSchema.parse(memberWithId) as StaffMember;
        const repo = createPersonnelRepository(db, currentWorkspace);
        await repo.add(validatedMember);
        logger.info('Personnel added', {
          id: validatedMember.id,
          name: validatedMember.name,
          workspace_id: currentWorkspace,
        });
      } catch (error) {
        logger.error('Failed to add personnel', error);
        throw error;
      }
    },
    [db, currentWorkspace]
  );

  const addMembers = useCallback(
    async (members: Omit<StaffMember, 'id'>[]) => {
      if (!db || !currentWorkspace) return { added: [], skipped: 0 };

      const existingCedulas = new Set(
        personnel.filter((p) => p.cedula).map((p) => p.cedula)
      );
      const newMembers: StaffMember[] = [];
      let skippedCount = 0;

      members.forEach((m) => {
        if (m.cedula && existingCedulas.has(m.cedula)) {
          skippedCount++;
          return;
        }
        const id = generateId('personnel');
        newMembers.push({ ...m, id, workspace_id: currentWorkspace } as any);
        if (m.cedula) existingCedulas.add(m.cedula);
      });

      if (newMembers.length > 0) {
        const repo = createPersonnelRepository(db, currentWorkspace);
        await repo.bulkAdd(newMembers);
      }

      return { added: newMembers, skipped: skippedCount };
    },
    [db, currentWorkspace, personnel]
  );

  const updateMember = useCallback(
    async (id: string, updates: Partial<StaffMember>) => {
      if (!db || !currentWorkspace) return;
      try {
        const repo = createPersonnelRepository(db, currentWorkspace);
        await repo.update(id, updates);
        logger.info('Personnel updated', { id, updates, workspace_id: currentWorkspace });
      } catch (error) {
        logger.error('Failed to update personnel', error);
        const { toast } = await import('sonner');
        toast.error(getUserFriendlyErrorMessage(error));
        throw error;
      }
    },
    [db, currentWorkspace]
  );

  const removeMember = useCallback(
    async (id: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createPersonnelRepository(db, currentWorkspace);
      await repo.remove(id);
    },
    [db, currentWorkspace]
  );

  const removeMembers = useCallback(
    async (ids: string[]) => {
      if (!db || !currentWorkspace) return;
      const repo = createPersonnelRepository(db, currentWorkspace);
      await repo.bulkRemove(ids);
    },
    [db, currentWorkspace]
  );

  const savePersonnel = useCallback(
    async (newPersonnel: StaffMember[]) => {
      if (!db || !currentWorkspace) return;
      const repo = createPersonnelRepository(db, currentWorkspace);
      await repo.syncAll(newPersonnel);
    },
    [db, currentWorkspace]
  );

  const isCedulaDuplicate = useCallback(
    (cedula: string, excludeId?: string) => {
      if (!cedula) return false;
      return personnel.some((p) => p.cedula === cedula && p.id !== excludeId);
    },
    [personnel]
  );

  const clearAllPersonnel = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createPersonnelRepository(db, currentWorkspace);
    await repo.clearAll();
    logger.info('All personnel cleared', { workspace_id: currentWorkspace });
  }, [db, currentWorkspace]);

  return {
    personnel,
    isLoaded,
    addMember,
    addMembers,
    updateMember,
    removeMember,
    removeMembers,
    savePersonnel,
    isCedulaDuplicate,
    clearAllPersonnel,
  };
}

