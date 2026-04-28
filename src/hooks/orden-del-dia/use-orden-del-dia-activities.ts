import { useState, useMemo, useCallback } from 'react';
import { generateId } from '@/lib/utils/id';
import { toast } from 'sonner';
import type { ManualNovedad } from '@/lib/types';

export function useOrdenDelDiaActivities(periodo: string, definiciones: any) {
  const [actividades, setActividades] = useState<ManualNovedad[]>([]);
  const [idActividadEditando, setIdActividadEditando] = useState<string | null>(null);

  const parseFechasDesdePeriodo = useCallback((periodoStr: string) => {
    const coincidencias = periodoStr.match(/(\d{2})\/(\d{2})\/(\d{4})/g);
    if (!coincidencias || coincidencias.length < 2) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);
      return { start: hoy.toISOString(), end: mañana.toISOString() };
    }
    const parsear = (s: string) => {
      const [d, m, y] = s.split('/').map(Number);
      const fecha = new Date(y!, m! - 1, d!);
      fecha.setHours(0, 0, 0, 0);
      return fecha.toISOString();
    };
    return { start: parsear(coincidencias[0]!), end: parsear(coincidencias[1]!) };
  }, []);

  const generarActividadesPorDefecto = useCallback((startDate: string, endDate: string, nombreEstado?: string): ManualNovedad[] => {
    const estado = nombreEstado || 'Anzoátegui';
    return [
      { id: 'def-1', date: startDate, time: '08:00 HLV', text: 'Se realiza cambio y recepción de Guardia' },
      { id: 'def-3', date: startDate, time: '08:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
      { id: 'def-4', date: startDate, time: '12:00 HLV - 13:00 HLV', text: 'Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
      { id: 'def-5', date: startDate, time: '14:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
      { id: 'def-6', date: startDate, time: '16:00 HLV', text: `Se envía segundo corte de novedades diarias a la central de Protección Civil ${estado}.` },
      { id: 'def-7', date: startDate, time: '17:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
      { id: 'def-8', date: startDate, time: '18:00 HLV - 19:00 HLV', text: 'Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
      { id: 'def-9', date: startDate, time: '20:00 HLV', text: 'Se realiza mantenimiento limpieza de las unidades e instalaciones de la sede.' },
      { id: 'def-10', date: startDate, time: '20:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
      { id: 'def-11', date: startDate, time: '21:00 HLV', text: 'Se inicia el periodo de descanso del personal.' },
      { id: 'def-12', date: endDate, time: '03:00 HLV', text: `Se envía primer corte de novedades diarias a la central de Protección Civil ${estado}.` },
      { id: 'def-13', date: endDate, time: '04:30 HLV', text: `Se envía reporte del estado del tiempo a la central de Protección Civil ${estado}.` },
      { id: 'def-14', date: endDate, time: '06:00 HLV - 07:00 HLV', text: 'Se realiza monitoreo de las condiciones meteorológicas con sus respectivas predicciones locales.' },
      { id: 'def-15', date: endDate, time: '06:00 HLV', text: 'Culmina el periodo de descanso del personal.' },
      { id: 'def-17', date: endDate, time: '08:00 HLV', text: 'Se envía reporte final de novedades correspondiente a la guardia de 24 Horas del día a la dirección estadal y ZOEDAN / Se da culminación a la guardia de 24 Horas.' },
    ];
  }, []);

  const buscarCampoInsensible = (definicionesMap: Record<string, any>, clave: string): string => {
    if (!definicionesMap) return '';
    const claveBaja = clave.toLowerCase();
    const claveEncontrada = Object.keys(definicionesMap).find((k) => k.toLowerCase() === claveBaja);
    if (!claveEncontrada) return '';
    return definicionesMap[claveEncontrada]?.value || '';
  };

  const manejarAñadirActividad = useCallback((actividad: Omit<ManualNovedad, 'id'>) => {
    setActividades((prev) => [
      ...prev,
      { ...actividad, id: generateId('activity') },
    ]);
  }, []);

  const manejarGuardarEdicionActividad = useCallback((actualizada: ManualNovedad) => {
    setActividades((prev) =>
      prev.map((act) => (act.id === actualizada.id ? actualizada : act))
    );
    setIdActividadEditando(null);
  }, []);

  const manejarEliminarActividad = useCallback((id: string) => {
    setActividades((prev) => prev.filter((act) => act.id !== id));
    if (idActividadEditando === id) setIdActividadEditando(null);
  }, [idActividadEditando]);

  const manejarEditarActividad = useCallback((actividad: ManualNovedad) => {
    setIdActividadEditando(actividad.id);
  }, []);

  const manejarCancelarEdicionActividad = useCallback(() => {
    setIdActividadEditando(null);
  }, []);

  const manejarRestaurarActividades = () => {
    const { start, end } = parseFechasDesdePeriodo(periodo);
    const estado = buscarCampoInsensible(definiciones, 'Estado');
    setActividades(generarActividadesPorDefecto(start, end, estado));
    toast.success('Actividades restauradas con las fechas del periodo');
  };

  const actividadesOrdenadas = useMemo(() => {
    return [...actividades].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [actividades]);

  return {
    actividades,
    setActividades,
    actividadesOrdenadas,
    idActividadEditando,
    manejarAñadirActividad,
    manejarGuardarEdicionActividad,
    manejarEliminarActividad,
    manejarEditarActividad,
    manejarCancelarEdicionActividad,
    manejarRestaurarActividades,
    parseFechasDesdePeriodo,
    generarActividadesPorDefecto,
    buscarCampoInsensible
  };
}
