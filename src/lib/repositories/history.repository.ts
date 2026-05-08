import type { MinutasDatabase } from '@/lib/db/db';
import type { GuardReport } from '@/lib/types';
import { DbKeys } from './keys';
import { safeWrite, silentWrite } from './base.repository';
import { createSupabaseWatchAll, supabaseRepoUtils } from './supabase.repository';
import { supabase } from '@/lib/supabase';
import { map } from 'rxjs/operators';

export function createHistoryRepository(db: MinutasDatabase | null, workspace_id: string, isCloud: boolean = false) {
  const ws = workspace_id;
  const TABLE = 'history';

  if (isCloud) {
    return {
      watchGuardHistory: () => createSupabaseWatchAll<any>(TABLE, ws, { 
        filter: (q) => q.eq('type', 'guard_history'),
        orderCol: 'date',
        ascending: false
      }),
      saveGuardReport: async (report: GuardReport) =>
        supabaseRepoUtils.upsert(TABLE, {
          id: DbKeys.guardHistory(ws, report.id),
          workspace_id: ws,
          type: 'guard_history',
          date: report.date,
          personnel_id: 'none',
          data: { ...report, workspace_id: ws },
        }),
      deleteGuardReport: (id: string) => supabaseRepoUtils.remove(TABLE, DbKeys.guardHistory(ws, id)),
      clearAllGuardHistory: () => supabase.from(TABLE).delete().eq('workspace_id', ws).eq('type', 'guard_history')
    };
  }

  // RxDB Implementation
  if (!db) throw new Error('Database not initialized');

  const watchGuardHistory = () =>
    db.history.find({
      selector: { type: 'guard_history', workspace_id: ws },
      sort: [{ date: 'desc' }],
    }).$.pipe(
      map(docs => docs.map(d => d.toJSON()))
    );

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


