/**
 * Hook for managing incident reports with RxDB persistence.
 *
 * Provides CRUD operations for emergency service reports using RxDB.
 *
 * @returns Report state and operations
 * @property {Report[]} reports - List of all reports
 * @property {(report: Report) => void} addReport - Create new report
 * @property {(id: string) => void} removeReport - Delete report
 * @property {(report: Report) => void} updateReport - Update report
 * @property {() => void} clearAllReports - Delete all reports
 * @property {boolean} isLoaded - Loading state
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Report } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { ReportSchema, generateFormDataSchema } from '@/lib/validations/schemas';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { useTemplates } from './use-templates';
import { createReportRepository } from '@/lib/repositories';

export function useReports() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const { configs } = useTemplates();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createReportRepository(db, currentWorkspace);
    const sub = repo.watchAll().subscribe((data) => {
      setReports(data.map((d) => d.toJSON()) as Report[]);
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const getLatestReports = useCallback(async (): Promise<Report[]> => {
    if (!db || !currentWorkspace) return [];
    const repo = createReportRepository(db, currentWorkspace);
    return (await repo.findAll()).map((d) => d.toJSON()) as Report[];
  }, [db, currentWorkspace]);

  const validateReportContent = useCallback(
    (report: Report) => {
      const reportToValidate = { ...report, workspaceId: currentWorkspace };

      let validatedReport: Report;
      try {
        validatedReport = ReportSchema.parse(reportToValidate) as Report;
      } catch (err) {
        if (err instanceof z.ZodError) {
          logger.error('Base report validation failed', err, {
            feature: 'Reports',
            reportId: report.id,
            issues: err.issues,
          });
        }
        throw err;
      }

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
    },
    [configs, currentWorkspace]
  );

  const addReport = useCallback(
    async (newReport: Report) => {
      if (!db || !currentWorkspace) return;
      try {
        const validatedReport = validateReportContent(newReport);
        const repo = createReportRepository(db, currentWorkspace);
        await repo.add(validatedReport);
        logger.info('Report added', {
          id: validatedReport.id,
          title: validatedReport.title,
          workspaceId: currentWorkspace,
        });
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
        const repo = createReportRepository(db, currentWorkspace);
        await repo.update(validatedReport);
        logger.info('Report updated', {
          id: validatedReport.id,
          workspaceId: currentWorkspace,
        });
      } catch (error) {
        logger.error('Failed to update report', error, {
          feature: 'Reports',
          id: updatedReport?.id,
        });
        toast.error(getUserFriendlyErrorMessage(error));
      }
    },
    [db, validateReportContent, currentWorkspace]
  );

  const removeReport = useCallback(
    async (reportId: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createReportRepository(db, currentWorkspace);
      await repo.remove(reportId);
      logger.info('Report removed', { id: reportId });
    },
    [db, currentWorkspace]
  );

  const clearAllReports = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createReportRepository(db, currentWorkspace);
    await repo.clearAll();
  }, [db, currentWorkspace]);

  return useMemo(
    () => ({
      reports,
      addReport,
      updateReport,
      removeReport,
      clearAllReports,
      isLoaded,
      getLatestReports,
    }),
    [
      reports,
      addReport,
      updateReport,
      removeReport,
      clearAllReports,
      isLoaded,
      getLatestReports,
    ]
  );
}
