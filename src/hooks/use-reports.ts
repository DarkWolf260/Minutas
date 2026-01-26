/**
 * Hook for managing incident reports with localStorage persistence.
 * 
 * Provides CRUD operations for emergency service reports with
 * automatic QuotaExceededError handling and relevance filtering.
 * 
 * @returns Report state and operations
 * @property {Report[]} reports - List of all reports
 * @property {(report: Partial<Report>) => void} addReport - Create new report
 * @property {(id: string) => void} removeReport - Delete report
 * @property {(id: string, updates: Partial<Report>) => void} updateReport - Update report
 * @property {() => void} clearAllReports - Delete all reports
 * @property {boolean} isLoaded - Loading state
 * 
 * @example
 * ```tsx
 * const { reports, addReport, removeReport } = useReports();
 * 
 * addReport({
 *   templateId: 'template-1',
 *   title: 'Incidente en Zona Norte',
 *   content: 'Detalles del incidente...'
 * });
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { Report } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';

export function useReports() {
  const db = useDatabase();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.reports.find({
      sort: [{ timestamp: 'desc' }]
    }).$.subscribe(data => {
      setReports(data.map(d => d.toJSON()) as Report[]);
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const getLatestReports = useCallback(async (): Promise<Report[]> => {
    if (!db) return [];
    const docs = await db.reports.find({
      sort: [{ timestamp: 'desc' }]
    }).exec();
    return docs.map(d => d.toJSON()) as Report[];
  }, [db]);

  const addReport = useCallback(async (newReport: Report) => {
    if (!db) return;
    try {
      await db.reports.insert(newReport);
      toast.success('Reporte guardado correctamente.');
    } catch (error) {
      console.error('Failed to add report:', error);
      toast.error('Error al guardar el reporte.');
    }
  }, [db]);

  const updateReport = useCallback(async (updatedReport: Report) => {
    if (!db) return;
    try {
      const doc = await db.reports.findOne(updatedReport.id).exec();
      if (doc) {
        await doc.patch(updatedReport);
        toast.success('Reporte actualizado correctamente.');
      }
    } catch (error) {
      console.error('Failed to update report:', error);
      toast.error('Error al actualizar el reporte.');
    }
  }, [db]);

  const removeReport = useCallback(async (reportId: string) => {
    if (!db) return;
    try {
      const doc = await db.reports.findOne(reportId).exec();
      if (doc) {
        await doc.remove();
        toast.success('Reporte eliminado.');
      }
    } catch (error) {
      console.error('Failed to remove report:', error);
      toast.error('Error al eliminar el reporte.');
    }
  }, [db]);

  const clearAllReports = useCallback(async () => {
    if (!db) return;
    try {
      const allDocs = await db.reports.find().exec();
      await Promise.all(allDocs.map(d => d.remove()));
      toast.success('Todos los reportes han sido eliminados.');
    } catch (error) {
      console.error('Failed to clear reports:', error);
      toast.error('Error al eliminar los reportes.');
    }
  }, [db]);

  return { reports, addReport, updateReport, removeReport, clearAllReports, isLoaded, getLatestReports };
}
