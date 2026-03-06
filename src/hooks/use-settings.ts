'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';
import { logger } from '@/lib/logger';

const defaultSettings: AppSettings = {
  activeGuardId: '',
  guardShiftDuration: 24,
  finalReportStaffSnapshot: {},
  finalReportStartDate: '',
  finalReportEndDate: '',
  reportaRoleIds: [],
};

export function useSettings() {
  const db = useDatabase();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.settings.findOne('app-settings').$.subscribe(async (doc) => {
      if (doc) {
        setSettings(doc.toJSON() as AppSettings);
      } else {
        // If not found, attempt to insert safely
        try {
          await db.settings.insert({ ...defaultSettings, id: 'app-settings' });
        } catch (err: unknown) {
          // Check for RxDB conflict (409 or 'CONFLICT')
          const e = err as Record<string, unknown>;
          const writeError = (e.parameters as Record<string, unknown> | undefined)?.writeError as Record<string, unknown> | undefined;
          const isConflict =
            e.code === 'CONFLICT' ||
            e.status === 409 ||
            (typeof e.message === 'string' && e.message.includes('conflict')) ||
            writeError?.status === 409;

          if (!isConflict) {
            logger.error('Failed to insert default settings', err, { feature: 'Settings' });
          }
        }
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const saveSettings = useCallback(
    async (newSettings: AppSettings) => {
      if (!db) return;
      try {
        await db.settings.upsert({ ...newSettings, id: 'app-settings' });
      } catch (error) {
        logger.error('Failed to save settings', error, { feature: 'Settings' });
      }
    },
    [db]
  );

  const clearAllSettings = useCallback(async () => {
    if (!db) return;
    try {
      await db.settings.upsert({ ...defaultSettings, id: 'app-settings' });
    } catch (error) {
      logger.error('Failed to clear settings', error, { feature: 'Settings' });
    }
  }, [db]);

  return { settings, saveSettings, isLoaded, clearAllSettings };
}
