
'use client';

import { useCallback } from 'react';
import type { AppSettings } from '@/types';
import { useLocalStorage } from './use-local-storage';

const SETTINGS_STORAGE_KEY = 'app-settings';

const defaultSettings: AppSettings = {
  activeGuardId: '',
  guardShiftDuration: 24,
  finalReportStaffSnapshot: {},
  finalReportStartDate: '',
  finalReportEndDate: '',
};

export function useSettings() {
  const [settings, setSettings, isLoaded] = useLocalStorage<AppSettings>(
    SETTINGS_STORAGE_KEY,
    defaultSettings,
    {
      migrate: (stored: any) => {
        // Merge stored settings with defaults to ensure all required fields exist
        return { ...defaultSettings, ...stored };
      },
      onError: (error, operation) => {
        console.error(`Failed to ${operation} settings:`, error);
      }
    }
  );

  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
  }, [setSettings]);

  const clearAllSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, [setSettings]);

  return { settings, saveSettings, isLoaded, clearAllSettings };
}
