import type { MinutasDatabase } from '@/lib/db/db';
import type { StaffMember } from '@/lib/types';
import { silentWrite } from './base.repository';
import { createSupabaseWatchAll, supabaseRepoUtils } from './supabase.repository';
import { map } from 'rxjs/operators';

export function createPersonnelRepository(db: MinutasDatabase | null, workspace_id: string, isCloud: boolean = false) {
  const ws = workspace_id;
  const TABLE = 'personnel';

  // Unified implementation using RxDB
  // (Replication is handled at the DatabaseProvider level)

  // RxDB Implementation (Default)
  if (!db) throw new Error('Database not initialized for RxDB repository');

  const watchAll = () =>
    db.personnel.find({
      selector: { workspace_id: ws },
      sort: [{ order: 'asc' }],
    }).$.pipe(
      map(docs => docs.map(d => d.toJSON() as StaffMember))
    );

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
        const { id: _, workspace_id: __, _rev, ...patchData } = updates as any;
        await doc.patch(patchData);
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

  const syncAll = async (newPersonnel: StaffMember[]) =>
    silentWrite(
      async () => {
        const existingDocs = await db.personnel
          .find({ selector: { workspace_id: ws } })
          .exec();
        const existingMap = new Map(existingDocs.map((d) => [d.id, d]));

        const preparedPersonnel = newPersonnel.map((p) => ({
          ...p,
          workspace_id: ws,
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
          await Promise.all(toUpdate.map(({ doc, data }) => {
            const { _rev, ...patchData } = data as any;
            return doc.patch(patchData);
          }));
        if (toInsert.length > 0) await db.personnel.bulkInsert(toInsert);
      },
      { feature: 'Personnel' }
    );

  const clearAll = async () =>
    silentWrite(
      async () => {
        const allDocs = await db.personnel
          .find({ selector: { workspace_id: ws } })
          .exec();
        await Promise.all(allDocs.map((d) => d.remove()));
      },
      { feature: 'Personnel', rethrow: true }
    );

  return { watchAll, add, bulkAdd, update, remove, bulkRemove, syncAll, clearAll };
}

export type PersonnelRepository = ReturnType<typeof createPersonnelRepository>;



