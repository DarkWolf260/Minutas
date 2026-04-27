import { useState, useMemo } from 'react';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useGuardHistory } from '@/hooks/use-guard-history';
import { calcularEstadisticasMensuales } from '@/lib/estadisticas-utils';

export type ModoEstadistica = 'standard' | 'statistical';

export function useEstadisticas() {
  const { reports, isLoaded: reportesCargados } = useReports();
  const { reports: reportesGuardados, isLoaded: historialCargado } = useGuardHistory();
  const { templates, configs, isLoaded: plantillasCargadas } = useTemplates();
  const { definitions, isLoaded: definicionesCargadas } = useFieldDefinitions();

  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth()); // 0-11
  const [modo, setModo] = useState<ModoEstadistica>('statistical');

  const configuracionesGlobales = useMemo(() => {
    const settingsMap: Record<string, string> = {};
    Object.keys(definitions).forEach((key) => {
      if (definitions[key]?.value) {
        settingsMap[key] = definitions[key]!.value!;
      }
    });

    return Object.values(configs).reduce((acc, config) => {
      Object.keys(config.fields).forEach((fieldName) => {
        const field = config.fields[fieldName];
        if (field && field.type === 'predefined' && field.value) {
          acc[fieldName] = field.value;
        }
      });
      return acc;
    }, settingsMap);
  }, [configs, definitions]);

  const aniosDisponibles = useMemo(() => {
    const actual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => actual - 2 + i);
  }, []);

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const estadisticas = useMemo(() => {
    if (!reportesCargados || !plantillasCargadas || !definicionesCargadas || !historialCargado) return null;
    return calcularEstadisticasMensuales(
      reports,
      templates,
      configs,
      mes,
      anio,
      modo,
      configuracionesGlobales,
      reportesGuardados
    );
  }, [
    reports,
    reportesGuardados,
    templates,
    configs,
    mes,
    anio,
    modo,
    reportesCargados,
    historialCargado,
    plantillasCargadas,
    definicionesCargadas,
    configuracionesGlobales
  ]);

  const diasEnMes = useMemo(() => {
    return new Date(anio, mes + 1, 0).getDate();
  }, [anio, mes]);

  const arregloDias = Array.from({ length: diasEnMes }, (_, i) => i + 1);

  const manejarMesAnterior = () => {
    if (mes === 0) {
      setMes(11);
      setAnio((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  };

  const manejarMesSiguiente = () => {
    if (mes === 11) {
      setMes(0);
      setAnio((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  };

  const estaTodoCargado = reportesCargados && plantillasCargadas && definicionesCargadas && historialCargado;

  return {
    // Estado
    anio,
    setAnio,
    mes,
    setMes,
    modo,
    setModo,
    aniosDisponibles,
    nombresMeses,
    estadisticas,
    arregloDias,
    estaTodoCargado,
    
    // Handlers
    manejarMesAnterior,
    manejarMesSiguiente,
  };
}
