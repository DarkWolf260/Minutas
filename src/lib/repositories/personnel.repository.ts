/**
 * Personnel Repository — Encapsulates all operations on the `personnel` collection.
 */

import type { MinutasDatabase } from '@/lib/db/db';
import type { StaffMember } from '@/lib/types';
import { safeWrite, silentWrite } from './base.repository';

export function createPersonnelRepository(db: MinutasDatabase, workspaceId: string) {
  const ws = workspaceId;

  const watchAll = () =>
    db.personnel.find({
      selector: { workspaceId: ws },
      sort: [{ order: 'asc' }],
    }).$;

  const add = async (member: StaffMember) =>
    silentWrite(
      () => db.personnel.insert(member),
      { feature: 'Personnel', rethrow: true }
    );

  const bulkAdd = async (members: StaffMember[]) =>
    db.personnel.bulkInsert(members);

  const update = async (id: string, updates: Partial<StaffMember>) =>
    silentWrite(
      async () => {
        const doc = await db.personnel.findOne(id).exec();
        if (!doc) throw new Error('Miembro del personal no encontrado.');
        await doc.patch(updates);
      },
      { feature: 'Personnel', rethrow: true }
    );

  const remove = async (id: string) => {
    const doc = await db.personnel.findOne(id).exec();
    if (doc) await doc.remove();
  };

  const bulkRemove = async (ids: string[]) => {
    const query = db.personnel.find({ selector: { id: { $in: ids } } });
    await query.remove();
  };

  /**
   * Full sync: replaces the entire workspace personnel list with `newPersonnel`.
   * Compares existing docs and applies only the delta (insert / patch / remove).
   */
  const syncAll = async (newPersonnel: StaffMember[]) =>
    silentWrite(
      async () => {
        const existingDocs = await db.personnel
          .find({ selector: { workspaceId: ws } })
          .exec();
        const existingMap = new Map(existingDocs.map((d) => [d.id, d]));

        const preparedPersonnel = newPersonnel.map((p) => ({
          ...p,
          workspaceId: ws,
        }));
        const newMap = new Map(preparedPersonnel.map((p) => [p.id, p]));

        const toRemove = existingDocs.filter((d) => !newMap.has(d.id));
        const toInsert = preparedPersonnel.filter((p) => !existingMap.has(p.id));
        const toUpdate: { doc: any; data: any }[] = [];

        for (const p of preparedPersonnel) {
          const existing = existingMap.get(p.id);
          if (existing) {
            const hasChanges =
              JSON.stringify(existing.toMutableJSON()) !== JSON.stringify(p);
            if (hasChanges) toUpdate.push({ doc: existing, data: p });
          }
        }

        if (toRemove.length > 0) await Promise.all(toRemove.map((d) => d.remove()));
        if (toUpdate.length > 0)
          await Promise.all(toUpdate.map(({ doc, data }) => doc.patch(data)));
        if (toInsert.length > 0) await db.personnel.bulkInsert(toInsert);
      },
      { feature: 'Personnel' }
    );

  const clearAll = async () =>
    silentWrite(
      async () => {
        const allDocs = await db.personnel
          .find({ selector: { workspaceId: ws } })
          .exec();
        await Promise.all(allDocs.map((d) => d.remove()));
      },
      { feature: 'Personnel', rethrow: true }
    );

  return { watchAll, add, bulkAdd, update, remove, bulkRemove, syncAll, clearAll };
}

export type PersonnelRepository = ReturnType<typeof createPersonnelRepository>;
