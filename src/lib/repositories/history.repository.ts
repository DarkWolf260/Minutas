/**
 * History Repository — Encapsulates all operations on the `history` collection.
 * Currently handles guard history (guard_history type).
 */

import type { MinutasDatabase } from '@/lib/db/db';
import type { GuardReport } from '@/lib/types';
import { DbKeys } from './keys';
import { safeWrite, silentWrite } from './base.repository';

export function createHistoryRepository(db: MinutasDatabase, workspace_id: string) {
  const ws = workspace_id;

  const watchGuardHistory = () =>
    db.history.find({
      selector: { type: 'guard_history', workspace_id: ws },
      sort: [{ date: 'desc' }],
    }).$;

  const saveGuardReport = async (report: GuardReport) =>
    safeWrite(
      () =>
        db.history.upsert({
          id: DbKeys.guardHistory(ws, report.id),
          workspace_id: ws,
          type: 'guard_history',
          date: report.date,
          personnel_id: 'none',
          data: { ...report, workspace_id: ws },
        }),
      {
        feature: 'GuardHistory',
        successMessage: 'Reporte guardado en el historial.',
        errorMessage: 'Error al guardar el historial.',
      }
    );

  const deleteGuardReport = async (id: string) =>
    safeWrite(
      async () => {
        const doc = await db.history.findOne(DbKeys.guardHistory(ws, id)).exec();
        if (doc) await doc.remove();
      },
      {
        feature: 'GuardHistory',
        successMessage: 'Reporte eliminado del historial.',
        errorMessage: 'Error al eliminar el reporte.',
      }
    );

  const clearAllGuardHistory = async () =>
    silentWrite(
      async () => {
        const allDocs = await db.history
          .find({ selector: { type: 'guard_history', workspace_id: ws } })
          .exec();
        await db.history.bulkRemove(allDocs.map((d) => d.primary));
      },
      { feature: 'GuardHistory' }
    );

  return { watchGuardHistory, saveGuardReport, deleteGuardReport, clearAllGuardHistory };
}

export type HistoryRepository = ReturnType<typeof createHistoryRepository>;


