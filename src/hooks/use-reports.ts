
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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
      toast.error('No se pudieron cargar los reportes guardados.');
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
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        toast.error('El almacenamiento está lleno. No se pudo guardar.');
      } else {
        toast.error('Error al guardar en el almacenamiento local.');
      }
    }
  }, []);

  const addReport = useCallback((newReport: Report) => {
    saveReports([...reports, newReport]);
    toast.success('Reporte guardado correctamente.');
  }, [reports, saveReports]);

  const updateReport = useCallback((updatedReport: Report) => {
    saveReports(reports.map(r => (r.id === updatedReport.id ? updatedReport : r)));
    toast.success('Reporte actualizado correctamente.');
  }, [reports, saveReports]);

  const removeReport = useCallback((reportId: string) => {
    saveReports(reports.filter(r => r.id !== reportId));
    toast.success('Reporte eliminado.');
  }, [reports, saveReports]);

  const clearAllReports = useCallback(() => {
    saveReports([]);
    toast.success('Todos los reportes han sido eliminados.');
  }, [saveReports]);

  return { reports, addReport, updateReport, removeReport, clearAllReports, isLoaded, getLatestReports };
}
