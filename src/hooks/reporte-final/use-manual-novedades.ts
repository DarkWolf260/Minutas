import { useState, useMemo, useEffect } from 'react';
import { generateId } from '@/lib/utils/id';
import { toast } from 'sonner';
import { findValueInFormData } from '@/lib/report-sorter';
import type { Report } from '@/lib/types';

export interface NovedadManual {
  id: string;
  date: string; // ISO format
  time: string;
  text: string;
}

interface UseManualNovedadesProps {
  settings: any;
  saveSettings: (settings: any) => Promise<void>;
  settingsLoaded: boolean;
}

export function useManualNovedades({ settings, saveSettings, settingsLoaded }: UseManualNovedadesProps) {
  const [idEditandoManual, setIdEditandoManual] = useState<string | null>(null);
  const [nuevaNovedadFecha, setNuevaNovedadFecha] = useState(new Date());
  const [nuevaNovedadHora, setNuevaNovedadHora] = useState('');
  const [nuevaNovedadTexto, setNuevaNovedadTexto] = useState('');

  const novedadesManuales = useMemo(() => settings.finalReportManualNovedades || [], [settings.finalReportManualNovedades]);

  // Default novelties initialization
  useEffect(() => {
    if (!settingsLoaded) return;
    if (settings.finalReportManualNovedades && settings.finalReportManualNovedades.length > 0) return;

    const startDate = new Date();
    startDate.setHours(8, 0, 0, 0);

    const endDate = new Date(new Date().setDate(new Date().getDate() + 1));
    endDate.setHours(8, 0, 0, 0);

    const novedadInicioDefecto: NovedadManual = {
      id: `${generateId('manual')}_start`,
      date: startDate.toISOString(),
      time: '08:00 HLV',
      text: 'Se inicia la guardia preventiva de 24 horas',
    };

    const novedadFinDefecto: NovedadManual = {
      id: `${generateId('manual')}_end`,
      date: endDate.toISOString(),
      time: '08:00 HLV',
      text: 'Se da culminación a la guardia preventiva de 24 horas',
    };

    saveSettings({
      finalReportManualNovedades: [novedadInicioDefecto, novedadFinDefecto]
    });
  }, [settingsLoaded, settings.finalReportManualNovedades?.length, saveSettings]);

  const manejarAgregarNovedadManual = () => {
    if (!nuevaNovedadHora || !nuevaNovedadTexto) return;

    if (idEditandoManual) {
      saveSettings({
        finalReportManualNovedades: novedadesManuales.map((n: NovedadManual) => 
          n.id === idEditandoManual 
            ? { ...n, date: nuevaNovedadFecha.toISOString(), time: nuevaNovedadHora, text: nuevaNovedadTexto }
            : n
        )
      });
      setIdEditandoManual(null);
      toast.success('Novedad actualizada.');
    } else {
      const nuevaNovedad: NovedadManual = {
        id: generateId('manual'),
        date: nuevaNovedadFecha.toISOString(),
        time: nuevaNovedadHora,
        text: nuevaNovedadTexto,
      };
      saveSettings({
        finalReportManualNovedades: [...novedadesManuales, nuevaNovedad]
      });
    }
    setNuevaNovedadHora('');
    setNuevaNovedadTexto('');
  };

  const manejarEditarNovedadManual = (novedad: NovedadManual) => {
    setIdEditandoManual(novedad.id);
    setNuevaNovedadFecha(new Date(novedad.date));
    setNuevaNovedadHora(novedad.time);
    setNuevaNovedadTexto(novedad.text);
  };

  const manejarCancelarEdicion = () => {
    setIdEditandoManual(null);
    setNuevaNovedadHora('');
    setNuevaNovedadTexto('');
  };

  const manejarEliminarNovedadManual = (idParaEliminar: string) => {
    saveSettings({
      finalReportManualNovedades: novedadesManuales.filter((n: NovedadManual) => n.id !== idParaEliminar)
    });
  };

  const obtenerFechaOrdenamiento = (novedad: Report | NovedadManual | any): Date | null => {
    if ('templateId' in novedad) {
      const fechaStr = findValueInFormData(novedad.formData, 'Fecha') as string | undefined;
      const horaStr = findValueInFormData(novedad.formData, 'Hora') as string | undefined;

      if (fechaStr && horaStr) {
        const timeMatch = horaStr.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          const mappedValues = timeMatch.slice(1).map(Number);
          const hours = mappedValues[0];
          const minutes = mappedValues[1];
          if (hours !== undefined && minutes !== undefined && !isNaN(hours) && !isNaN(minutes)) {
            const sortDate = new Date(`${fechaStr}T00:00:00`);
            if (!isNaN(sortDate.getTime())) {
              sortDate.setHours(hours, minutes);
              return sortDate;
            }
          }
        }
      }
      return new Date(novedad.timestamp);
    } else {
      const sortDate = new Date(novedad.date);
      const timeMatch = novedad.time.match(/(\d{2}):(\d{2})/);
      
      if (timeMatch && timeMatch[1] && timeMatch[2]) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          sortDate.setHours(hours, minutes, 0, 0);
        }
      }
      return sortDate;
    }
  };

  const novedadesManualesOrdenadas = useMemo(() => {
    return [...novedadesManuales].sort((a, b) => {
      const dateA = obtenerFechaOrdenamiento(a);
      const dateB = obtenerFechaOrdenamiento(b);
      if (dateA && dateB) return dateA.getTime() - dateB.getTime();
      return 0;
    });
  }, [novedadesManuales]);

  return {
    novedadesManuales,
    novedadesManualesOrdenadas,
    idEditandoManual,
    setIdEditandoManual,
    nuevaNovedadFecha,
    setNuevaNovedadFecha,
    nuevaNovedadHora,
    setNuevaNovedadHora,
    nuevaNovedadTexto,
    setNuevaNovedadTexto,
    manejarAgregarNovedadManual,
    manejarEditarNovedadManual,
    manejarCancelarEdicion,
    manejarEliminarNovedadManual
  };
}
