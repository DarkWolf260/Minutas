
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Report } from '@/types';

const REPORTS_STORAGE_KEY = 'app-reports';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial data from localStorage exactly once on mount.
  useEffect(() => {
    try {
      const storedReports = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (storedReports) {
        setReports(JSON.parse(storedReports));
      }
    } catch (error) {
      console.error('Failed to load reports from localStorage', error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const getLatestReports = useCallback((): Report[] => {
    if (typeof window === 'undefined') return [];
    try {
        const storedReports = localStorage.getItem(REPORTS_STORAGE_KEY);
        return storedReports ? JSON.parse(storedReports) : [];
    } catch (error) {
        console.error('Failed to read reports from localStorage', error);
        return [];
    }
  }, []);
  
  const saveReports = useCallback((newReports: Report[]) => {
    setReports(newReports);
    try {
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(newReports));
    } catch (error) {
        console.error('Failed to save reports to localStorage', error);
    }
  }, []);

  const addReport = useCallback((newReport: Report) => {
    saveReports([...reports, newReport]);
  }, [reports, saveReports]);

  const updateReport = useCallback((updatedReport: Report) => {
    saveReports(reports.map(r => (r.id === updatedReport.id ? updatedReport : r)));
  }, [reports, saveReports]);

  const removeReport = useCallback((reportId: string) => {
    saveReports(reports.filter(r => r.id !== reportId));
  }, [reports, saveReports]);

  const clearAllReports = useCallback(() => {
    saveReports([]);
  }, [saveReports]);

  return { reports, addReport, updateReport, removeReport, clearAllReports, isLoaded, getLatestReports };
}
