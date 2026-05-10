/**
 * Hook for managing guard history with RxDB persistence.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GuardReport } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { createHistoryRepository } from '@/lib/repositories';

export function useGuardHistory() {
  const db = useDatabase();
  const { currentWorkspace, isCloud } = useWorkspaceManager();
  const [reports, setReports] = useState<GuardReport[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createHistoryRepository(db, currentWorkspace, isCloud);
    const sub = repo.watchGuardHistory().subscribe((data) => {
      setReports(
        data.map((d) => {
          const item = d.toJSON ? d.toJSON() : d;
          return { ...(item.data as GuardReport), workspace_id: currentWorkspace };
        }) as GuardReport[]
      );
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace, isCloud]);

  const saveGuardReport = useCallback(
    async (report: GuardReport) => {
      if (!db || !currentWorkspace) return;
      const repo = createHistoryRepository(db, currentWorkspace, isCloud);
      await repo.saveGuardReport(report);
      logger.info('Guard report saved', {
        reportId: report.id,
        workspace_id: currentWorkspace,
      });
    },
    [db, currentWorkspace, isCloud]
  );

  const deleteGuardReport = useCallback(
    async (id: string) => {
      if (!db || !currentWorkspace) return;
      const repo = createHistoryRepository(db, currentWorkspace, isCloud);
      await repo.deleteGuardReport(id);
    },
    [db, currentWorkspace, isCloud]
  );

  const getGuardReportById = useCallback(
    (id: string) => reports.find((r) => r.id === id),
    [reports]
  );

  const clearAllGuardHistory = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createHistoryRepository(db, currentWorkspace, isCloud);
    await repo.clearAllGuardHistory();
    logger.info('Guard history cleared', { workspace_id: currentWorkspace });
  }, [db, currentWorkspace, isCloud]);

  return {
    reports,
    isLoaded,
    saveGuardReport,
    deleteGuardReport,
    getGuardReportById,
    clearAllGuardHistory,
  };
}

