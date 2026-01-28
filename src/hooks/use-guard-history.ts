'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { GuardReport } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';
import { logger } from '@/lib/logger';

export function useGuardHistory() {
  const db = useDatabase();
  const [reports, setReports] = useState<GuardReport[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.guard_history.find().$.subscribe((data) => {
      setReports(data.map((d) => d.toJSON()) as GuardReport[]);
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const saveGuardReport = useCallback(
    async (report: GuardReport) => {
      if (!db) return;
      try {
        await db.guard_history.insert(report);
        toast.success('Reporte guardado en el historial.');
      } catch (error) {
        logger.error('Failed to save guard report', error, { feature: 'GuardHistory', metadata: { reportId: report.id } });
        toast.error('Error al guardar el historial.');
      }
    },
    [db]
  );

  const deleteGuardReport = useCallback(
    async (id: string) => {
      if (!db) return;
      try {
        const doc = await db.guard_history.findOne(id).exec();
        if (doc) await doc.remove();
        toast.success('Reporte eliminado del historial.');
      } catch (error) {
        logger.error('Failed to delete guard report', error, { feature: 'GuardHistory', metadata: { reportId: id } });
        toast.error('Error al eliminar el reporte.');
      }
    },
    [db]
  );

  const getGuardReportById = useCallback(
    (id: string) => {
      return reports.find((r) => r.id === id);
    },
    [reports]
  );

  return {
    reports,
    isLoaded,
    saveGuardReport,
    deleteGuardReport,
    getGuardReportById,
  };
}
