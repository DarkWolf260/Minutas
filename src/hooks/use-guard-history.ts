'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { GuardReport } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';

export function useGuardHistory() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [reports, setReports] = useState<GuardReport[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.history.find({
      selector: { 
        type: 'guard_history',
        workspaceId: currentWorkspace
      },
      sort: [{ date: 'desc' }]
    }).$.subscribe((data) => {
      setReports(data.map((d) => {
        const json = d.toJSON();
        return { ...(json.data as GuardReport), workspaceId: currentWorkspace };
      }) as GuardReport[]);
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveGuardReport = useCallback(
    async (report: GuardReport) => {
      if (!db || !currentWorkspace) return;
      try {
        await db.history.insert({
          id: `${currentWorkspace}:ghistory:${report.id}`,
          workspaceId: currentWorkspace,
          type: 'guard_history' as const,
          date: report.date,
          personnelId: 'none',
          data: { ...report, workspaceId: currentWorkspace }
        });
        toast.success('Reporte guardado en el historial.');
      } catch (error) {
        logger.error('Failed to save guard report', error, { feature: 'GuardHistory', workspaceId: currentWorkspace, metadata: { reportId: report.id } });
        toast.error('Error al guardar el historial.');
      }
    },
    [db, currentWorkspace]
  );

  const deleteGuardReport = useCallback(
    async (id: string) => {
      if (!db || !currentWorkspace) return;
      try {
        const doc = await db.history.findOne(`${currentWorkspace}:ghistory:${id}`).exec();
        if (doc) await doc.remove();
        toast.success('Reporte eliminado del historial.');
      } catch (error) {
        logger.error('Failed to delete guard report', error, { feature: 'GuardHistory', workspaceId: currentWorkspace, metadata: { reportId: id } });
        toast.error('Error al eliminar el reporte.');
      }
    },
    [db, currentWorkspace]
  );

  const getGuardReportById = useCallback(
    (id: string) => {
      return reports.find((r) => r.id === id);
    },
    [reports]
  );

  const clearAllGuardHistory = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const allDocs = await db.history.find({ selector: { type: 'guard_history', workspaceId: currentWorkspace } }).exec();
      await db.history.bulkRemove(allDocs.map((d) => d.primary));
      logger.info('Guard history cleared', { workspaceId: currentWorkspace });
    } catch (error) {
      logger.error('Failed to clear guard history', error, { feature: 'GuardHistory', workspaceId: currentWorkspace });
    }
  }, [db, currentWorkspace]);

  return {
    reports,
    isLoaded,
    saveGuardReport,
    deleteGuardReport,
    getGuardReportById,
    clearAllGuardHistory,
  };
}
