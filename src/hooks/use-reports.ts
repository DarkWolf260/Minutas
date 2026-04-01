/**
 * Hook for managing incident reports with RxDB persistence.
 *
 * Provides CRUD operations for emergency service reports using RxDB.
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

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Report } from '@/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { ReportSchema, generateFormDataSchema } from '@/lib/validations/schemas';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { useTemplates } from './use-templates';

export function useReports() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const { configs } = useTemplates();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.reports
      .find({
        selector: { workspaceId: currentWorkspace },
        sort: [{ timestamp: 'desc' }],
      })
      .$.subscribe((data) => {
        setReports(data.map((d) => d.toJSON()) as Report[]);
        setIsLoaded(true);
      });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const getLatestReports = useCallback(async (): Promise<Report[]> => {
    if (!db || !currentWorkspace) return [];
    const docs = await db.reports
      .find({
        selector: { workspaceId: currentWorkspace },
        sort: [{ timestamp: 'desc' }],
      })
      .exec();
    return docs.map((d) => d.toJSON()) as Report[];
  }, [db, currentWorkspace]);

  const validateReportContent = useCallback((report: Report) => {
    // Inject workspaceId before validation/parsing if missing
    const reportToValidate = { ...report, workspaceId: currentWorkspace };
    
    // 1. Base validation
    let validatedReport: Report;
    try {
      validatedReport = ReportSchema.parse(reportToValidate) as Report;
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.error('Base report validation failed', err, { 
          feature: 'Reports', 
          reportId: report.id,
          issues: err.issues 
        });
      }
      throw err;
    }

    // 2. Dynamic validation for formData if config exists
    const config = configs[report.templateId];
    if (config && report.formData) {
      try {
        const dynamicSchema = generateFormDataSchema(config as any);
        dynamicSchema.parse(report.formData);
      } catch (err) {
        if (err instanceof z.ZodError) {
          logger.error('Dynamic form validation failed', err, {
            feature: 'Reports',
            issues: err.issues,
            templateId: report.templateId,
            formData: report.formData,
          });
        } else {
          logger.error('Dynamic form validation failed (non-zod)', err);
        }
        throw err;
      }
    }

    return validatedReport;
  }, [configs, currentWorkspace]);

  const addReport = useCallback(
    async (newReport: Report) => {
      if (!db || !currentWorkspace) return;
      try {
        const validatedReport = validateReportContent(newReport);
        await db.reports.insert(validatedReport as Report);
        logger.info('Report added', { id: validatedReport.id, title: validatedReport.title, workspaceId: currentWorkspace });
        toast.success('Reporte guardado correctamente.');
      } catch (error) {
        logger.error('Failed to add report', error, {
          feature: 'Reports',
          reportId: newReport?.id,
          templateId: newReport?.templateId,
        });
        toast.error(getUserFriendlyErrorMessage(error));
      }
    },
    [db, validateReportContent, currentWorkspace]
  );

  const updateReport = useCallback(
    async (updatedReport: Report) => {
      if (!db || !currentWorkspace) return;
      try {
        const validatedReport = validateReportContent(updatedReport);
        const doc = await db.reports.findOne(validatedReport.id).exec();
        if (doc) {
          await doc.patch(validatedReport as Partial<Report>);
          logger.info('Report updated', { id: validatedReport.id, workspaceId: currentWorkspace });
          // No toast for background auto-saves (managed by the UI elsewhere if needed)
          // toast.success('Reporte actualizado correctamente.');
        } else {
          logger.warn('Report not found for update', { id: validatedReport.id });
          toast.error('Reporte no encontrado.');
        }
      } catch (error) {
        logger.error('Failed to update report', error, { feature: 'Reports', id: updatedReport?.id });
        toast.error(getUserFriendlyErrorMessage(error));
      }
    },
    [db, validateReportContent, currentWorkspace]
  );

  const removeReport = useCallback(
    async (reportId: string) => {
      if (!db) return;
      try {
        const doc = await db.reports.findOne(reportId).exec();
        if (doc) {
          await doc.remove();
          logger.info('Report removed', { id: reportId });
          toast.success('Reporte eliminado.');
        }
      } catch (error) {
        logger.error('Failed to remove report', error, { feature: 'Reports' });
        toast.error('Error al eliminar el reporte.');
      }
    },
    [db]
  );

  const clearAllReports = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      const allDocs = await db.reports.find({
        selector: { workspaceId: currentWorkspace }
      }).exec();
      await Promise.all(allDocs.map((d) => d.remove()));
      toast.success('Todos los reportes han sido eliminados.');
    } catch (error) {
      logger.error('Failed to clear reports', error, { feature: 'Reports' });
      toast.error('Error al eliminar los reportes.');
    }
  }, [db, currentWorkspace]);

  return useMemo(() => ({
    reports,
    addReport,
    updateReport,
    removeReport,
    clearAllReports,
    isLoaded,
    getLatestReports,
  }), [reports, addReport, updateReport, removeReport, clearAllReports, isLoaded, getLatestReports]);
}
