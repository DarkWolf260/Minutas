'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { GuardReport } from '@/types';
import { useLocalStorage } from './use-local-storage';

const GUARD_HISTORY_STORAGE_KEY = 'app-guard-history';

export function useGuardHistory() {
    const [reports, setReports, isLoaded] = useLocalStorage<GuardReport[]>(
        GUARD_HISTORY_STORAGE_KEY,
        [],
        {
            onError: (error, operation) => {
                console.error(`Failed to ${operation} guard history:`, error);
                if (operation === 'load') {
                    toast.error('No se pudo cargar el historial de guardias.');
                } else if (operation === 'save') {
                    if (error instanceof Error && error.name === 'QuotaExceededError') {
                        toast.error('Almacenamiento lleno. No se pudo guardar.');
                    } else {
                        toast.error('Error al guardar el historial.');
                    }
                }
            }
        }
    );

    const saveGuardReport = useCallback((report: GuardReport) => {
        setReports(prev => [...prev, report]);
        toast.success('Reporte guardado en el historial.');
    }, [setReports]);

    const deleteGuardReport = useCallback((id: string) => {
        setReports(prev => prev.filter(r => r.id !== id));
        toast.success('Reporte eliminado del historial.');
    }, [setReports]);

    const getGuardReportById = useCallback((id: string) => {
        // This still needs the current reports value
        return reports.find(r => r.id === id);
    }, [reports]);

    return {
        reports,
        isLoaded,
        saveGuardReport,
        deleteGuardReport,
        getGuardReportById
    };
}
