
'use client';

import { useState, useEffect } from 'react';
import type { AppSettings } from '@/types';

const SETTINGS_STORAGE_KEY = 'app-settings';

const defaultSettings: AppSettings = {
  activeGuardId: '',
  guardShiftDuration: 24,
  finalReportStaffSnapshot: {},
  finalReportStartDate: '',
  finalReportEndDate: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // This effect now runs only on the client, after the initial render.
    // This prevents hydration mismatches.
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const initial = storedSettings ? JSON.parse(storedSettings) : {};
      setSettings({ ...defaultSettings, ...initial });
    } catch (error) {
      console.error('Failed to load settings from localStorage', error);
      // setSettings is already at default, so no need to set it again.
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
     try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings to localStorage', error);
    }
  }
  
  const clearAllSettings = () => {
     try {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Failed to clear settings from localStorage', error);
    }
  }

  return { settings, saveSettings, isLoaded, clearAllSettings };
}
