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
    try {
        const storedReports = localStorage.getItem(REPORTS_STORAGE_KEY);
        return storedReports ? JSON.parse(storedReports) : [];
    } catch (error) {
        console.error('Failed to read reports from localStorage', error);
        return [];
    }
  }, []);

  const addReport = useCallback((newReport: Report) => {
    const currentReports = getLatestReports();
    const newReports = [...currentReports, newReport];
    try {
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(newReports));
        setReports(newReports);
    } catch (error) {
        console.error('Failed to save reports to localStorage', error);
    }
  }, [getLatestReports]);

  const updateReport = useCallback((updatedReport: Report) => {
    const currentReports = getLatestReports();
    const newReports = currentReports.map(r => (r.id === updatedReport.id ? updatedReport : r));
     try {
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(newReports));
        setReports(newReports);
    } catch (error) {
        console.error('Failed to save reports to localStorage', error);
    }
  }, [getLatestReports]);

  const removeReport = useCallback((reportId: string) => {
    const currentReports = getLatestReports();
    const newReports = currentReports.filter(r => r.id !== reportId);
    try {
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(newReports));
        setReports(newReports);
    } catch (error) {
        console.error('Failed to save reports to localStorage', error);
    }
  }, [getLatestReports]);

  const clearAllReports = useCallback(() => {
    try {
        localStorage.setItem(REPORTS_STORAGE_KEY, '[]');
        setReports([]);
    } catch (error) {
        console.error('Failed to clear reports from localStorage', error);
    }
  }, []);

  return { reports, addReport, updateReport, removeReport, clearAllReports, isLoaded, getLatestReports };
}
