/**
 * Hook for managing incident reports with localStorage persistence.
 * 
 * Provides CRUD operations for emergency service reports with
 * automatic QuotaExceededError handling and relevance filtering.
 * 
 * @returns Report state and operations
 * @property {Report[]} reports - List of all reports
 * @property {(report: Partial<Report>) => void} addReport - Create new report
 * @property {(id: string) => void} removeReport - Delete report
 * @property {(id: string, updates: Partial<Report>) => void} updateReport - Update report
 * @property {() => void} clearAllReports - Delete all reports
 * @property {boolean} isLoaded - Loading state
 * 
 * @example
 * ```tsx
 * const { reports, addReport, removeReport } = useReports();
 * 
 * addReport({
 *   templateId: 'template-1',
 *   title: 'Incidente en Zona Norte',
 *   content: 'Detalles del incidente...'
 * });
 * ```
 */

'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Report } from '@/types';
import { useLocalStorage } from './use-local-storage';

const REPORTS_STORAGE_KEY = 'app-reports';

export function useReports() {
  const [reports, setReports, isLoaded] = useLocalStorage<Report[]>(
    REPORTS_STORAGE_KEY,
    [],
    {
      onError: (error, operation) => {
        console.error(`Failed to ${operation} reports:`, error);
        if (operation === 'save') {
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            toast.error('El almacenamiento está lleno. No se pudo guardar.');
          } else {
            toast.error('Error al guardar en el almacenamiento local.');
          }
        } else if (operation === 'load') {
          toast.error('No se pudieron cargar los reportes guardados.');
        }
      }
    }
  );

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

  const addReport = useCallback((newReport: Report) => {
    setReports(prev => [...prev, newReport]);
    toast.success('Reporte guardado correctamente.');
  }, [setReports]);

  const updateReport = useCallback((updatedReport: Report) => {
    setReports(prev => prev.map(r => (r.id === updatedReport.id ? updatedReport : r)));
    toast.success('Reporte actualizado correctamente.');
  }, [setReports]);

  const removeReport = useCallback((reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    toast.success('Reporte eliminado.');
  }, [setReports]);

  const clearAllReports = useCallback(() => {
    setReports([]);
    toast.success('Todos los reportes han sido eliminados.');
  }, [setReports]);

  return { reports, addReport, updateReport, removeReport, clearAllReports, isLoaded, getLatestReports };
}
