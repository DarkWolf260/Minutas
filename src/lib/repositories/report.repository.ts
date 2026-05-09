import type { MinutasDatabase } from '@/lib/db/db';
import type { Report } from '@/lib/types';
import { safeWrite, silentWrite } from './base.repository';
import { createSupabaseWatchAll, supabaseRepoUtils } from './supabase.repository';
import { map } from 'rxjs/operators';
import { supabase } from '@/lib/supabase';

export function createReportRepository(db: MinutasDatabase | null, workspace_id: string, isCloud: boolean = false) {
  const ws = workspace_id;
  const TABLE = 'reports';

  // Unified implementation using RxDB
  // (Replication is handled at the DatabaseProvider level)

  // RxDB Implementation
  if (!db) throw new Error('Database not initialized');

  const watchAll = () =>
    db.reports.find({
      selector: { workspace_id: ws },
      sort: [{ timestamp: 'desc' }],
    }).$.pipe(
      map(docs => docs.map(d => d.toJSON() as Report))
    );

  const findAll = () =>
    db.reports
      .find({
        selector: { workspace_id: ws },
        sort: [{ timestamp: 'desc' }],
      })
      .exec();

  const add = async (report: Report) =>
    silentWrite(
      () => db.reports.insert(report),
      { feature: 'Reports' }
    );

  const update = async (validatedReport: Report) =>
    silentWrite(
      async () => {
        const doc = await db.reports.findOne(validatedReport.id).exec();
        if (!doc) throw new Error('Reporte no encontrado.');
        const { id, workspace_id, ...patchData } = validatedReport;
        await doc.patch(patchData as Partial<Report>);
      },
      { feature: 'Reports' }
    );

  const remove = async (reportId: string) =>
    safeWrite(
      async () => {
        const doc = await db.reports.findOne(reportId).exec();
        if (doc) await doc.remove();
      },
      { feature: 'Reports', successMessage: 'Reporte eliminado.' }
    );

  const clearAll = async () =>
    safeWrite(
      async () => {
        const allDocs = await db.reports
          .find({ selector: { workspace_id: ws } })
          .exec();
        await Promise.all(allDocs.map((d) => d.remove()));
      },
      { feature: 'Reports', successMessage: 'Todos los reportes han sido eliminados.' }
    );

  return { watchAll, findAll, add, update, remove, clearAll };
}

export type ReportRepository = ReturnType<typeof createReportRepository>;


