import { useState, useMemo, useCallback } from 'react';
import { useGuardHistory } from '@/hooks/use-guard-history';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function useReporteFinalHistory() {
  const { reports: reportesGuardados, isLoaded: historialLoaded, saveGuardReport, deleteGuardReport } = useGuardHistory();
  
  const [idReporteSeleccionado, setIdReporteSeleccionado] = useState<string | null>(null);
  const [esDialogOpenVista, setEsDialogOpenVista] = useState(false);
  const [esDialogOpenConfirmarEliminar, setEsDialogOpenConfirmarEliminar] = useState(false);
  const [idParaEliminarHistorial, setIdParaEliminarHistorial] = useState<string | null>(null);

  const manejarVerReporteGuardado = (id: string) => {
    setIdReporteSeleccionado(id);
    setEsDialogOpenVista(true);
  };

  const manejarEliminarReporteGuardado = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIdParaEliminarHistorial(id);
    setEsDialogOpenConfirmarEliminar(true);
  };

  const manejarConfirmarEliminacionHistorial = () => {
    if (idParaEliminarHistorial) {
      deleteGuardReport(idParaEliminarHistorial);
      if (idReporteSeleccionado === idParaEliminarHistorial) {
        setEsDialogOpenVista(false);
        setIdReporteSeleccionado(null);
      }
      setIdParaEliminarHistorial(null);
      setEsDialogOpenConfirmarEliminar(false);
      toast.success('Reporte eliminado del historial.');
    }
  };

  const manejarCorregirFechasHistorial = async () => {
    let fixedCount = 0;
    try {
      for (const report of reportesGuardados) {
        if (report.summary) {
          const parts = report.summary.split(/ AL | - | – | a /i).map(p => p.trim());
          const firstPart = parts[0];
          const match = firstPart?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) {
            const [_, d, m, y] = match;
            const archiveDate = new Date(parseInt(y!), parseInt(m!) - 1, parseInt(d!), 8, 0, 0);
            if (!isNaN(archiveDate.getTime())) {
              const isoDate20 = archiveDate.toISOString().split('.')[0] + 'Z';
              if (report.date !== isoDate20) {
                await saveGuardReport({ ...report, date: isoDate20 });
                fixedCount++;
              }
            }
          }
        }
      }
      if (fixedCount > 0) {
        toast.success(`${fixedCount} reportes corregidos exitosamente.`);
      } else {
        toast.info('No se encontraron reportes que necesiten corrección.');
      }
    } catch (error) {
      console.error('Error corrigiendo fechas', error);
      toast.error('Error al intentar corregir las fechas.');
    }
  };

  const reportesGuardadosOrdenados = useMemo(() => {
    return [...reportesGuardados].sort((a, b) => {
      const dateA = new Date(a.generated_at || (a as any).generatedAt || a.date).getTime();
      const dateB = new Date(b.generated_at || (b as any).generatedAt || b.date).getTime();
      
      const timeA = isNaN(dateA) ? 0 : dateA;
      const timeB = isNaN(dateB) ? 0 : dateB;
      
      return timeB - timeA;
    });
  }, [reportesGuardados]);

  const reporteGuardadoSeleccionado = useMemo(() => 
    reportesGuardados.find((r) => r.id === idReporteSeleccionado),
  [reportesGuardados, idReporteSeleccionado]);

  const manejarCopiarReporte = useCallback(() => {
    if (reporteGuardadoSeleccionado?.content) {
      navigator.clipboard.writeText(reporteGuardadoSeleccionado.content);
      toast.success('Reporte copiado al portapapeles');
    }
  }, [reporteGuardadoSeleccionado]);

  const manejarExportarWordHistorial = useCallback(async () => {
    if (!reporteGuardadoSeleccionado?.content) return;
    const { exportReportToWord } = await import('@/lib/export-word');
    const dateStr = format(new Date(reporteGuardadoSeleccionado.date), 'dd.MM.yyyy');
    const filename = `Reporte de Cierre - ${dateStr}`;
    await exportReportToWord(reporteGuardadoSeleccionado.content, filename);
    toast.success('Reporte exportado a Word con éxito');
  }, [reporteGuardadoSeleccionado]);

  return {
    reportesGuardados,
    historialLoaded,
    reportesGuardadosOrdenados,
    reporteGuardadoSeleccionado,
    idReporteSeleccionado,
    setIdReporteSeleccionado,
    esDialogOpenVista,
    setEsDialogOpenVista,
    esDialogOpenConfirmarEliminar,
    setEsDialogOpenConfirmarEliminar,
    manejarVerReporteGuardado,
    manejarEliminarReporteGuardado,
    manejarConfirmarEliminacionHistorial,
    manejarCorregirFechasHistorial,
    manejarCopiarReporte,
    manejarExportarWordHistorial,
    saveGuardReport
  };
}
