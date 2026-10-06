import { useState, useMemo, useEffect, useRef } from 'react';
import { debounce } from '@/lib/utils';
import { calcularEstadisticasPeriodo, formatearEstadisticasPeriodo } from '@/lib/estadisticas-utils';
import { toast } from 'sonner';

interface UseReporteFinalStatsProps {
  settings: any;
  saveSettings: (settings: any) => Promise<void>;
  settingsLoaded: boolean;
  reportesFinalizados: any[];
  templates: any[];
  configs: any;
  configuracionesGlobales: any;
}

export function useReporteFinalStats({
  settings,
  saveSettings,
  settingsLoaded,
  reportesFinalizados,
  templates,
  configs,
  configuracionesGlobales
}: UseReporteFinalStatsProps) {
  const [estadisticasLocal, setEstadisticasLocal] = useState('');
  const ultimaEstadisticaGuardada = useRef<string | undefined>(undefined);
  const [puedeAutoGuardar, setPuedeAutoGuardar] = useState(false);

  // Security timer for initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setPuedeAutoGuardar(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Sync from settings on initial load
  useEffect(() => {
    if (settingsLoaded && settings.final_report_statistics !== ultimaEstadisticaGuardada.current) {
      setEstadisticasLocal(settings.final_report_statistics || '');
      ultimaEstadisticaGuardada.current = settings.final_report_statistics;
    }
  }, [settingsLoaded, settings.final_report_statistics]);

  const guardarEstadisticasDebounced = useMemo(
    () => debounce((value: string) => {
      if (!puedeAutoGuardar) return;
      saveSettings({ final_report_statistics: value });
      ultimaEstadisticaGuardada.current = value;
    }, 500),
    [saveSettings, puedeAutoGuardar]
  );

  const manejarCalcularEstadisticas = () => {
    if (reportesFinalizados.length === 0) {
      toast.error('No hay reportes finalizados para calcular estadísticas.');
      return;
    }
    const result = calcularEstadisticasPeriodo(
      reportesFinalizados,
      templates,
      configs,
      configuracionesGlobales,
      [],
      settings.guard_period,
      settings.guard_shift_duration
    );
    const formateado = formatearEstadisticasPeriodo(result);
    
    if (formateado) {
      setEstadisticasLocal(formateado);
      guardarEstadisticasDebounced(formateado);
      toast.success(
        result.isMultiDay
          ? `Estadísticas calculadas y separadas por día (${result.durationHours} Horas).`
          : 'Estadísticas calculadas correctamente.'
      );
    } else {
      toast.info('No se encontraron categorías estadísticas en los reportes de la guardia.');
    }
  };

  const periodoStats = useMemo(() => {
    return calcularEstadisticasPeriodo(
      reportesFinalizados,
      templates,
      configs,
      configuracionesGlobales,
      [],
      settings.guard_period,
      settings.guard_shift_duration
    );
  }, [
    reportesFinalizados,
    templates,
    configs,
    configuracionesGlobales,
    settings.guard_period,
    settings.guard_shift_duration,
  ]);

  return {
    estadisticasLocal,
    setEstadisticasLocal,
    guardarEstadisticasDebounced,
    manejarCalcularEstadisticas,
    periodoStats
  };
}
