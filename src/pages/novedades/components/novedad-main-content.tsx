import React, { Suspense } from 'react';
import { FileText } from 'lucide-react';
import { ReportViewer } from '@/components/report/report-viewer';
import { ReportGenerator } from '@/components/report/report-generator';
import { cn } from '@/lib/utils';
import type { UseNovedadesReturn } from '@/hooks/novedades';

export interface NovedadMainContentProps {
  hook: Pick<
    UseNovedadesReturn,
    | 'creandoReporte'
    | 'configs'
    | 'datosBorradorInicial'
    | 'manejarCancelarCreacion'
    | 'manejarGuardarNuevoReporte'
    | 'reporteSeleccionado'
    | 'updateReport'
    | 'setReporteAEliminar'
    | 'generatorRef'
    | 'idReporteSeleccionado'
    | 'manejarSeleccionarReporte'
  >;
}

export const NovedadMainContent = ({ hook }: NovedadMainContentProps) => {
  const {
    creandoReporte,
    configs,
    datosBorradorInicial,
    manejarCancelarCreacion,
    manejarGuardarNuevoReporte,
    reporteSeleccionado,
    updateReport,
    setReporteAEliminar,
    generatorRef,
    idReporteSeleccionado,
    manejarSeleccionarReporte
  } = hook;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden h-full">
      {creandoReporte ? (
        <div key="generator" className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ReportGenerator
            ref={generatorRef}
            template={creandoReporte}
            config={configs[creandoReporte.id]}
            initialData={datosBorradorInicial}
            onCancel={manejarCancelarCreacion}
            onSave={manejarGuardarNuevoReporte}
          />
        </div>
      ) : reporteSeleccionado ? (
        <div key={idReporteSeleccionado} className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ReportViewer
            report={reporteSeleccionado}
            onSave={updateReport}
            onDelete={(id: string) => setReporteAEliminar(id)}
            onClose={() => manejarSeleccionarReporte(null)}
          />
        </div>
      ) : (
        <VistaVacia />
      )}
    </div>
  );
};

function VistaVacia() {
  return (
    <div className="empty-state-container">
      <div className="max-w-md">
        <div className="empty-state-icon-box">
          <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground" />
        </div>
        <h3 className="empty-state-title">Sin reporte seleccionado</h3>
        <p className="empty-state-desc">
          Selecciona un reporte de la lista lateral para consultar su información o editarlo.
        </p>
      </div>
    </div>
  );
}
