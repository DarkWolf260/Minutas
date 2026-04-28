import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReporteFinal } from '@/hooks/use-reporte-final';

// Componentes extraídos (SOLID) - DISEÑO PRESERVADO AL 100%
import { ReporteHeader } from './reporte-final/components/reporte-header';
import { ReporteGenerar } from './reporte-final/components/reporte-generar';
import { ReporteHistorial } from './reporte-final/components/reporte-historial';
import { ReporteModals } from './reporte-final/components/reporte-modals';

export default function ReporteFinalPage() {
  const isMobile = useIsMobile();
  const hook = useReporteFinal();

  const {
    tabActiva,
    setTabActiva,
    estaCargado,
    manejarGenerarReporte
  } = hook;

  return (
    <div className="flex flex-col min-h-screen md:h-full bg-background overflow-y-auto md:overflow-hidden relative">
      {/* Botón flotante móvil para generar reporte */}
      {tabActiva === 'generate' && (
        <div className="sm:hidden fixed bottom-24 right-6 z-[60] animate-in fade-in zoom-in duration-300 ease-out">
          <Button
            onClick={manejarGenerarReporte}
            disabled={!estaCargado}
            size="icon"
            className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary-foreground/10 hover:scale-105 active:scale-95 transition-all duration-300"
            title="Generar Reporte Final"
          >
            <FileText className="h-7 w-7" />
          </Button>
        </div>
      )}

      <Tabs value={tabActiva} onValueChange={setTabActiva} className="flex-1 flex flex-col md:overflow-hidden">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-32 sm:pb-10 flex flex-col md:flex-1 md:min-h-0">
          
          {/* Header Modular (SRP) */}
          <ReporteHeader hook={hook} isMobile={isMobile} />

          <TabsContent
            value="generate"
            className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in slide-in-from-left-4 duration-500 ease-in-out"
          >
            <ReporteGenerar hook={hook} />
          </TabsContent>

          <TabsContent
            value="history"
            className="mt-0 focus-visible:outline-none ring-offset-background data-[state=active]:flex data-[state=active]:flex-col md:data-[state=active]:flex-1 md:min-h-0 bg-transparent animate-in fade-in slide-in-from-right-4 duration-500 ease-in-out"
          >
            <ReporteHistorial hook={hook} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Modales y Diálogos Centralizados (SRP) */}
      <ReporteModals hook={hook} isMobile={isMobile} />
    </div>
  );
}
