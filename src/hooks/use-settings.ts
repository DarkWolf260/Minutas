'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/lib/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
import { logger } from '@/lib/logger';
import { createConfigRepository } from '@/lib/repositories';

const defaultSettings: AppSettings = {
  active_guard_id: '',
  is_guard_open: false,
  guard_period: '',
  guard_shift_duration: 24,
  final_report_staff_snapshot: {},
  final_report_start_date: '',
  final_report_end_date: '',
  final_report_manual_novedades: [],
  final_report_statistics: '',
  reportarole_ids: [],
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
        // Just use defaults in state, do NOT init in DB to avoid cloud conflicts
        setSettings(defaultSettings);
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



