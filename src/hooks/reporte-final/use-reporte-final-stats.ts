import { useState, useMemo, useEffect, useRef } from 'react';
import { debounce } from '@/lib/utils';
import { calcularEstadisticasDia, formatearEstadisticasDia } from '@/lib/estadisticas-utils';
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
    if (settingsLoaded && settings.finalReportStatistics !== ultimaEstadisticaGuardada.current) {
      setEstadisticasLocal(settings.finalReportStatistics || '');
      ultimaEstadisticaGuardada.current = settings.finalReportStatistics;
    }
  }, [settingsLoaded, settings.finalReportStatistics]);

  const guardarEstadisticasDebounced = useMemo(
    () => debounce((value: string) => {
      if (!puedeAutoGuardar) return;
      saveSettings({ finalReportStatistics: value });
      ultimaEstadisticaGuardada.current = value;
    }, 500),
    [saveSettings, puedeAutoGuardar]
  );

  const manejarCalcularEstadisticas = () => {
    if (reportesFinalizados.length === 0) {
      toast.error('No hay reportes finalizados para calcular estadísticas.');
      return;
    }
    const dayStats = calcularEstadisticasDia(reportesFinalizados, templates, configs, configuracionesGlobales);
    const formateado = formatearEstadisticasDia(dayStats);
    
    if (formateado) {
      setEstadisticasLocal(formateado);
      guardarEstadisticasDebounced(formateado);
      toast.success('Estadísticas calculadas correctamente.');
    } else {
      toast.info('No se encontraron categorías estadísticas en los reportes de hoy.');
    }
  };

  return {
    estadisticasLocal,
    setEstadisticasLocal,
    guardarEstadisticasDebounced,
    manejarCalcularEstadisticas
  };
}
