import React, { Suspense } from 'react';
import { FileText } from 'lucide-react';
import { ReportViewer } from '@/components/report/report-viewer';
import { ReportGenerator } from '@/components/report/report-generator';
import { cn } from '@/lib/utils';

interface NovedadMainContentProps {
  hook: any;
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
    idReporteSeleccionado
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
    <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground p-6 text-center animate-in fade-in duration-500 w-full h-full">
      <div className="max-w-md space-y-4">
        <div className="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-2 border-2 border-dashed border-muted-foreground/10 opacity-60">
          <FileText className="h-9 w-9 opacity-20" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground/80 tracking-tight">Sin reporte seleccionado</h3>
          <p className="text-sm max-w-[280px] mx-auto text-muted-foreground/60 leading-relaxed">
            Selecciona un reporte de la lista lateral para visualizar sus detalles o realizar ediciones administrativas.
          </p>
        </div>
      </div>
    </div>
  );
}
