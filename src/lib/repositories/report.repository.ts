/**
 * Report Repository — Encapsulates all operations on the `reports` collection.
 */

import type { MinutasDatabase } from '@/lib/db/db';
import type { Report } from '@/lib/types';
import { safeWrite, silentWrite } from './base.repository';

export function createReportRepository(db: MinutasDatabase, workspaceId: string) {
  const ws = workspaceId;

  const watchAll = () =>
    db.reports.find({
      selector: { workspaceId: ws },
      sort: [{ timestamp: 'desc' }],
    }).$;

  const findAll = () =>
    db.reports
      .find({
        selector: { workspaceId: ws },
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
        const { id, workspaceId, ...patchData } = validatedReport;
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
          .find({ selector: { workspaceId: ws } })
          .exec();
        await Promise.all(allDocs.map((d) => d.remove()));
      },
      { feature: 'Reports', successMessage: 'Todos los reportes han sido eliminados.' }
    );

  return { watchAll, findAll, add, update, remove, clearAll };
}

export type ReportRepository = ReturnType<typeof createReportRepository>;
