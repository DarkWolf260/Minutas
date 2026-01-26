'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '@/types';
import { useDatabase } from '@/lib/db/db-provider';

const defaultSettings: AppSettings = {
  activeGuardId: '',
  guardShiftDuration: 24,
  finalReportStaffSnapshot: {},
  finalReportStartDate: '',
  finalReportEndDate: '',
};

export function useSettings() {
  const db = useDatabase();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!db) return;

    const sub = db.settings.findOne('app-settings').$.subscribe(doc => {
      if (doc) {
        setSettings(doc.toJSON() as AppSettings);
      } else {
        // If not found, insert default
        db.settings.insert({ ...defaultSettings, id: 'app-settings' })
          .catch(err => console.error('Failed to insert default settings:', err));
      }
      setIsLoaded(true);
    });

    return () => sub.unsubscribe();
  }, [db]);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    if (!db) return;
    try {
      await db.settings.upsert({ ...newSettings, id: 'app-settings' });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [db]);

  const clearAllSettings = useCallback(async () => {
    if (!db) return;
    try {
      await db.settings.upsert({ ...defaultSettings, id: 'app-settings' });
    } catch (error) {
      console.error('Failed to clear settings:', error);
    }
  }, [db]);

  return { settings, saveSettings, isLoaded, clearAllSettings };
}
