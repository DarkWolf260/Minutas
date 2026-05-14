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
import { ReportSchema, generateform_dataSchema } from '@/lib/validations/schemas';
import { getUserFriendlyErrorMessage } from '@/lib/error-handler';
import { useTemplates } from './use-templates';
import { createReportRepository } from '@/lib/repositories';

export function useReports() {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const { configs } = useTemplates();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createReportRepository(db, currentWorkspace, isCloud);
    const sub = repo.watchAll().subscribe({
      next: (data) => {
        setReports(data);
        setIsLoaded(true);
      }
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const getLatestReports = useCallback(async (): Promise<Report[]> => {
    if (!db || !currentWorkspace) return [];
    const repo = createReportRepository(db, currentWorkspace, isCloud);
    return await repo.findAll();
  }, [db, currentWorkspace, isCloud]);

  const validateReportContent = useCallback(
    (report: Report) => {
      const reportToValidate = { ...report, workspace_id: currentWorkspace };

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

      const config = configs[report.template_id];
      if (config && report.form_data) {
        try {
          const dynamicSchema = generateform_dataSchema(config as any);
          dynamicSchema.parse(report.form_data);
        } catch (err) {
          if (err instanceof z.ZodError) {
            logger.error('Dynamic form validation failed', err, {
              feature: 'Reports',
              issues: err.issues,
              template_id: report.template_id,
              form_data: report.form_data,
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
        const repo = createReportRepository(db, currentWorkspace, isCloud);
        await repo.add(validatedReport);
        logger.info('Report added', {
          id: validatedReport.id,
          title: validatedReport.title,
          workspace_id: currentWorkspace,
        });
      } catch (error) {
        logger.error('Failed to add report', error, {
          feature: 'Reports',
          reportId: newReport?.id,
          template_id: newReport?.template_id,
        });
        toast.error(getUserFriendlyErrorMessage(error));
      }
    },
    [db, validateReportContent, currentWorkspace, isCloud]
  );

  const updateReport = useCallback(
    async (updatedReport: Report) => {
      if (!db || !currentWorkspace) return;
      try {
        const validatedReport = validateReportContent(updatedReport);
        const repo = createReportRepository(db, currentWorkspace, isCloud);
        await repo.update(validatedReport);
        logger.info('Report updated', {
          id: validatedReport.id,
          workspace_id: currentWorkspace,
        });
      } catch (error) {
        logger.error('Failed to update report', error, {
          feature: 'Reports',
          id: updatedReport?.id,
        });
        toast.error(getUserFriendlyErrorMessage(error));
      }
    },
    [db, validateReportContent, currentWorkspace, isCloud]
  );

  const removeReport = useCallback(
    async (reportId: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createReportRepository(db, currentWorkspace, isCloud);
      await repo.remove(reportId);
      logger.info('Report removed', { id: reportId });
    },
    [db, currentWorkspace, isCloud]
  );

  const clearAllReports = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createReportRepository(db, currentWorkspace, isCloud);
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


