'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/types';
import { useDatabase, useWorkspaceManager } from '@/lib/db/db-context';
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
  const { currentWorkspace } = useWorkspaceManager();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db || !currentWorkspace) return;

    const sub = db.configs.findOne(`${currentWorkspace}:settings:app`).$.subscribe(async (doc) => {
      if (doc) {
        setSettings(doc.toJSON().data as AppSettings);
      } else {
        // If not found, attempt to insert safely for this workspace
        try {
          await db.configs.insert({ 
            id: `${currentWorkspace}:settings:app`, 
            workspaceId: currentWorkspace,
            type: 'settings', 
            data: { ...defaultSettings, workspaceId: currentWorkspace }
          });
        } catch (err: unknown) {
          const e = err as any;
          const isConflict = e.code === 'CONFLICT' || e.status === 409;
          if (!isConflict) {
            logger.error('Failed to insert default settings', err, { feature: 'Settings', workspaceId: currentWorkspace });
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
      try {
        const doc = await db.configs.findOne(`${currentWorkspace}:settings:app`).exec();
        const currentData = doc ? doc.toJSON().data : defaultSettings;
        await db.configs.upsert({ 
          id: `${currentWorkspace}:settings:app`, 
          workspaceId: currentWorkspace,
          type: 'settings', 
          data: { ...currentData, ...newSettings, workspaceId: currentWorkspace } 
        });
      } catch (error) {
        logger.error('Failed to save settings', error, { feature: 'Settings', workspaceId: currentWorkspace });
      }
    },
    [db, currentWorkspace]
  );

  const clearAllSettings = useCallback(async () => {
    if (!db || !currentWorkspace) return;
    try {
      await db.configs.upsert({ 
        id: `${currentWorkspace}:settings:app`, 
        workspaceId: currentWorkspace,
        type: 'settings', 
        data: { ...defaultSettings, workspaceId: currentWorkspace } 
      });
    } catch (error) {
      logger.error('Failed to clear settings', error, { feature: 'Settings', workspaceId: currentWorkspace });
    }
  }, [db, currentWorkspace]);

  return { settings, saveSettings, isLoaded, clearAllSettings };
}
