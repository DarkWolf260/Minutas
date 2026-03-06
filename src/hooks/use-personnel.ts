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
import type { StaffMember } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';
import { StaffMemberSchema } from '@/lib/validations/schemas';
import { logger } from '@/lib/logger';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { generateId } from '@/lib/utils/id';

export function usePersonnel() {
  const db = useDatabase();
  const [personnel, setPersonnel] = useState<StaffMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.personnel.find().$.subscribe((data) => {
      setPersonnel(data.map((d) => d.toJSON()) as StaffMember[]);
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const addMember = useCallback(
    async (newMember: Omit<StaffMember, 'id'>) => {
      if (!db) return;
      try {
        // Generate ID and create complete member object
        const memberWithId: StaffMember = {
          ...newMember,
          id: generateId('personnel'),
        };

        // Validate with Zod
        const validatedMember = StaffMemberSchema.parse(memberWithId);
        await db.personnel.insert(validatedMember);
        logger.info('Personnel added', { id: validatedMember.id, name: validatedMember.name });
        toast.success('Personal agregado correctamente.');
      } catch (error) {
        logger.error('Failed to add personnel', error);
        toast.error(getUserFriendlyErrorMessage(error));
      }
    },
    [db]
  );

  const addMembers = useCallback(
    async (members: Omit<StaffMember, 'id'>[]) => {
      if (!db) return { added: [], skipped: 0 };

      const existingCedulas = new Set(personnel.filter((p) => p.cedula).map((p) => p.cedula));
      const newMembers: StaffMember[] = [];
      let skippedCount = 0;

      members.forEach((m) => {
        if (m.cedula && existingCedulas.has(m.cedula)) {
          skippedCount++;
          return;
        }

        const id = generateId('personnel');
        newMembers.push({ ...m, id });

        if (m.cedula) existingCedulas.add(m.cedula);
      });

      if (newMembers.length > 0) {
        await db.personnel.bulkInsert(newMembers);
      }

      return { added: newMembers, skipped: skippedCount };
    },
    [db, personnel]
  );

  const updateMember = useCallback(
    async (id: string, updates: Partial<StaffMember>) => {
      if (!db) return;
      try {
        // Validate with Zod
        const validatedUpdates = StaffMemberSchema.partial().parse(updates);
        const doc = await db.personnel.findOne(id).exec();
        if (doc) {
          await doc.patch(validatedUpdates);
          logger.info('Personnel updated', { id, updates: validatedUpdates });
          toast.success('Personal actualizado correctamente.');
        } else {
          logger.warn('Personnel not found for update', { id });
          toast.error('Miembro del personal no encontrado.');
        }
      } catch (error) {
        logger.error('Failed to update personnel', error);
        toast.error(getUserFriendlyErrorMessage(error));
      }
    },
    [db]
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
      if (!db) return;
      // Diff-based approach: compute adds, updates, and removes
      // instead of destructive delete-all + re-insert
      const existingDocs = await db.personnel.find().exec();
      const existingMap = new Map(existingDocs.map((d) => [d.id, d]));
      const newMap = new Map(newPersonnel.map((p) => [p.id, p]));

      // Documents to remove (exist in DB but not in new list)
      const toRemove = existingDocs.filter((d) => !newMap.has(d.id));

      // Documents to insert (exist in new list but not in DB)
      const toInsert = newPersonnel.filter((p) => !existingMap.has(p.id));

      // Documents to update (exist in both, check for changes)
      const toUpdate: { doc: typeof existingDocs[0]; data: StaffMember }[] = [];
      for (const p of newPersonnel) {
        const existing = existingMap.get(p.id);
        if (existing) {
          const existingData = existing.toMutableJSON();
          const hasChanges = JSON.stringify(existingData) !== JSON.stringify(p);
          if (hasChanges) {
            toUpdate.push({ doc: existing, data: p });
          }
        }
      }

      // Execute all operations
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
    [db]
  );

  const isCedulaDuplicate = useCallback(
    (cedula: string, excludeId?: string) => {
      if (!cedula) return false;
      return personnel.some((p) => p.cedula === cedula && p.id !== excludeId);
    },
    [personnel]
  );

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
  };
}
