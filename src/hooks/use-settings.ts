
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
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const initial = storedSettings ? JSON.parse(storedSettings) : {};
      setSettings({ ...defaultSettings, ...initial });
    } catch (error) {
      console.error('Failed to load settings from localStorage', error);
      setSettings(defaultSettings);
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
