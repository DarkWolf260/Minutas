'use client';

import { useState, useMemo } from 'react';
import { useReports } from '@/hooks/use-reports';
import { useActiveGuard } from '@/hooks/use-active-guard';
import { useRoles } from '@/hooks/use-roles';
import { useTemplates } from '@/hooks/use-templates';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { findValueInFormData } from '@/lib/report-sorter';

// Sub-hooks
import { useManualNovedades } from './reporte-final/use-manual-novedades';
import { useReporteFinalStats } from './reporte-final/use-reporte-final-stats';
import { useReporteFinalHistory } from './reporte-final/use-reporte-final-history';
import { useReporteFinalGenerator } from './reporte-final/use-reporte-final-generator';

export function useReporteFinal() {
  // 1. Data Hooks
  const { reports, clearAllReports, isLoaded: reportsLoaded } = useReports();
  const {
    guardsLoaded,
    activeGuard,
    settings,
    saveSettings,
    isLoaded: guardIsLoaded,
    settingsLoaded,
  } = useActiveGuard();
  const { roles, isLoaded: rolesLoadedHook } = useRoles();
  const { templates, configs, isLoaded: templatesLoaded } = useTemplates();
  const { definitions, isLoaded: definitionsLoaded } = useFieldDefinitions();

  // 2. Local UI State
  const [tabActiva, setTabActiva] = useState('generate');

  // 3. Common Memos
  const configuracionesGlobales = useMemo(() => {
    const settingsMap: Record<string, string> = {};
    Object.keys(definitions).forEach((key) => {
      if (definitions[key]?.value) {
        settingsMap[key] = definitions[key]!.value!;
      }
    });

    return Object.values(configs).reduce(
      (acc: any, config: any) => {
        Object.keys(config.fields).forEach((fieldName) => {
          const field = config.fields[fieldName];
          if (field && field.type === 'predefined' && field.value) {
            acc[fieldName] = field.value;
          }
        });
        return acc;
      },
      settingsMap
    );
  }, [configs, definitions]);

  const reportesFinalizados = useMemo(() => {
    const currentGuardId = activeGuard?.id;
    return reports.filter((report) => {
      if (report.status !== 'Finalizado') return false;
      if (currentGuardId) {
        const reportGuard = findValueInFormData(report.formData, 'Guardia');
        if (reportGuard && String(reportGuard).trim().toUpperCase() !== String(currentGuardId).trim().toUpperCase()) {
          return false;
        }
      }
      return true;
    });
  }, [reports, activeGuard?.id]);

  // 4. Orchestrate Sub-hooks
  const manual = useManualNovedades({ settings, saveSettings, settingsLoaded });
  
  const history = useReporteFinalHistory();

  const stats = useReporteFinalStats({
    settings,
    saveSettings,
    settingsLoaded,
    reportesFinalizados,
    templates,
    configs,
    configuracionesGlobales
  });

  const generator = useReporteFinalGenerator({
    reportesFinalizados,
    novedadesManuales: manual.novedadesManuales,
    estadisticasLocal: stats.estadisticasLocal,
    activeGuard,
    settings,
    saveSettings,
    saveGuardReport: history.saveGuardReport,
    clearAllReports,
    templates,
    configs,
    configuracionesGlobales,
    roles,
    setTabActiva,
    setEstadisticasLocal: stats.setEstadisticasLocal
  });

  const estaCargado =
    reportsLoaded && guardsLoaded && settingsLoaded && rolesLoadedHook && templatesLoaded && definitionsLoaded && guardIsLoaded && history.historialLoaded;

  return {
    // Shared state
    tabActiva,
    setTabActiva,
    estaCargado,
    
    // Manual novelties
    ...manual,

    // History
    ...history,
    
    // Stats
    ...stats,

    // Generator
    ...generator,

    // Re-exposing for UI
    reportesFinalizados
  };
}
