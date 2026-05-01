'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { createConfigRepository } from '@/lib/repositories';

const defaultSettings: AppSettings = {
  activeGuardId: '',
  guardShiftDuration: 24,
  finalReportStaffSnapshot: {},
  finalReportStartDate: '',
  finalReportEndDate: '',
  finalReportManualNovedades: [],
  finalReportStatistics: '',
  reportaRoleIds: [],
};

export function useSettings() {
  const db = useDatabase();
  const { currentWorkspace } = useWorkspaceManager();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const repo = createConfigRepository(db, currentWorkspace);

    const sub = repo.watchSettings().subscribe(async (doc) => {
      if (doc) {
        setSettings({ ...defaultSettings, ...(doc.toJSON().data as AppSettings) });
      } else {
        try {
          await repo.initSettings(defaultSettings);
        } catch (err: unknown) {
          const e = err as any;
          const isConflict = e.code === 'CONFLICT' || e.status === 409;
          if (!isConflict) {
            logger.error('Failed to insert default settings', err, {
              feature: 'Settings',
              workspaceId: currentWorkspace,
            });
          }
        }
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db, currentWorkspace]);

  const saveSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      if (!db || !currentWorkspace) return;
      const repo = createConfigRepository(db, currentWorkspace);
      await repo.saveSettings(settings, newSettings);
    },
    [db, currentWorkspace, settings]
  );

  const clearAllSettings = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    const repo = createConfigRepository(db, currentWorkspace);
    await repo.saveSettings(defaultSettings, {});
  }, [db, currentWorkspace]);

  return { settings, saveSettings, isLoaded, clearAllSettings };
}
