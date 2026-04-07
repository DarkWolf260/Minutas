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
 *
 * @example
 * ```tsx
 * const { personnel, addMember, updateMember, isLoaded } = usePersonnel();
 *
 * // Wait for data to load
 * if (!isLoaded) return <Loading />;
 *
 * // Add new member (ID is auto-generated)
 * addMember({ name: 'Juan Pérez', cedula: 'V-12345678', rank: 'SGT' });
 *
 * // Update member
 * updateMember('member-id', { status: 'vacaciones' });
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { StaffMember } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { StaffMemberSchema } from '@/lib/validations/schemas';
import { logger } from '@/lib/logger';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { generateId } from '@/lib/utils/id';

export function usePersonnel() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [personnel, setPersonnel] = useState<StaffMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.personnel.find({
      selector: {
        workspaceId: currentWorkspace
      }
    }).$.subscribe((data) => {
      setPersonnel(data.map((d) => d.toJSON()) as StaffMember[]);
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const addMember = useCallback(
    async (newMember: Omit<StaffMember, 'id'>) => {
      if (!db || !currentWorkspace) return;
      try {
        // Generate ID and create complete member object
        const memberWithId: StaffMember = {
          ...newMember,
          id: generateId('personnel'),
          workspaceId: currentWorkspace,
        } as any;

        // Validate with Zod
        const validatedMember = StaffMemberSchema.parse(memberWithId) as StaffMember;
        await db.personnel.insert(validatedMember);
        logger.info('Personnel added', { id: validatedMember.id, name: validatedMember.name, workspaceId: currentWorkspace });
      } catch (error) {
        logger.error('Failed to add personnel', error);
        toast.error(getUserFriendlyErrorMessage(error));
        throw error;
      }
    },
    [db, currentWorkspace]
  );

  const addMembers = useCallback(
    async (members: Omit<StaffMember, 'id'>[]) => {
      if (!db || !currentWorkspace) return { added: [], skipped: 0 };

      const existingCedulas = new Set(personnel.filter((p) => p.cedula).map((p) => p.cedula));
      const newMembers: StaffMember[] = [];
      let skippedCount = 0;

      members.forEach((m) => {
        if (m.cedula && existingCedulas.has(m.cedula)) {
          skippedCount++;
          return;
        }

        const id = generateId('personnel');
        newMembers.push({ ...m, id, workspaceId: currentWorkspace } as any);

        if (m.cedula) existingCedulas.add(m.cedula);
      });

      if (newMembers.length > 0) {
        await db.personnel.bulkInsert(newMembers);
      }

      return { added: newMembers, skipped: skippedCount };
    },
    [db, currentWorkspace, personnel]
  );

  const updateMember = useCallback(
    async (id: string, updates: Partial<StaffMember>) => {
      if (!db) return;
      try {
        const doc = await db.personnel.findOne(id).exec();
        if (doc) {
          await doc.patch(updates);
          logger.info('Personnel updated', { id, updates, workspaceId: currentWorkspace });
        } else {
          logger.warn('Personnel not found for update', { id });
          toast.error('Miembro del personal no encontrado.');
          throw new Error('Personnel not found');
        }
      } catch (error) {
        logger.error('Failed to update personnel', error);
        toast.error(getUserFriendlyErrorMessage(error));
        throw error;
      }
    },
    [db, currentWorkspace]
  );

  const removeMember = useCallback(
    async (id: string) => {
      if (!db) return;
      const doc = await db.personnel.findOne(id).exec();
      if (doc) {
        await doc.remove();
      }
    },
    [db]
  );

  const removeMembers = useCallback(
    async (ids: string[]) => {
      if (!db) return;
      const query = db.personnel.find({
        selector: {
          id: { $in: ids },
        },
      });
      await query.remove();
    },
    [db]
  );

  const savePersonnel = useCallback(
    async (newPersonnel: StaffMember[]) => {
      if (!db || !currentWorkspace) return;
      
      const existingDocs = await db.personnel.find({
        selector: { workspaceId: currentWorkspace }
      }).exec();
      const existingMap = new Map(existingDocs.map((d) => [d.id, d]));
      
      // Ensure all incoming personnel have the workspaceId
      const preparedPersonnel = newPersonnel.map(p => ({ ...p, workspaceId: currentWorkspace }));
      const newMap = new Map(preparedPersonnel.map((p) => [p.id, p]));

      // Documents to remove
      const toRemove = existingDocs.filter((d) => !newMap.has(d.id));

      // Documents to insert
      const toInsert = preparedPersonnel.filter((p) => !existingMap.has(p.id));

      // Documents to update
      const toUpdate: { doc: any; data: any }[] = [];
      for (const p of preparedPersonnel) {
        const existing = existingMap.get(p.id);
        if (existing) {
          const existingData = existing.toMutableJSON();
          const hasChanges = JSON.stringify(existingData) !== JSON.stringify(p);
          if (hasChanges) {
            toUpdate.push({ doc: existing, data: p });
          }
        }
      }

      if (toRemove.length > 0) {
        await Promise.all(toRemove.map((d) => d.remove()));
      }
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(({ doc, data }) => doc.patch(data))
        );
      }
      if (toInsert.length > 0) {
        await db.personnel.bulkInsert(toInsert);
      }
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
    try {
      const allDocs = await db.personnel.find({
        selector: { workspaceId: currentWorkspace }
      }).exec();
      await Promise.all(allDocs.map((d) => d.remove()));
      logger.info('All personnel cleared', { workspaceId: currentWorkspace });
    } catch (error) {
      logger.error('Failed to clear personnel', error);
      throw error;
    }
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
