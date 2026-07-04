import React, { Suspense, memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNovedades } from '@/hooks/use-novedades';
import { cn } from '@/lib/utils';
import { NoGuardBanner } from '@/components/guards/guard-selector';

// Componentes extraídos (SOLID)
import { NovedadSidebar } from './novedades/components/novedad-sidebar';
import { NovedadMainContent } from './novedades/components/novedad-main-content';
import { NovedadModals } from './novedades/components/novedad-modals';
import { MobileHeader } from './novedades/components/mobile-header';

function NovedadesPageContent() {
  const isMobile = useIsMobile();
  const hook = useNovedades();
  const { 
    idReporteSeleccionado, 
    creandoReporte, 
    guardiaAbierta 
  } = hook;

  return (
    <>
      <div className="flex flex-col h-full w-full bg-background overflow-hidden sm:flex-row flex-1">
        {/* Sidebar Lateral */}
        <NovedadSidebar hook={hook} isMobile={isMobile} />

        {/* Área Principal */}
        <main
          className={cn(
            'flex-1 flex flex-col min-h-0 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300',
            !idReporteSeleccionado && !creandoReporte ? 'hidden sm:flex' : 'flex'
          )}
        >
          <MobileHeader hook={hook} isMobile={isMobile} />

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {!guardiaAbierta && !idReporteSeleccionado && !creandoReporte ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-muted/5 h-full">
                <NoGuardBanner
                  message="Para registrar nuevas novedades o gestionar reportes, primero debes abrir una nueva guardia."
                  allowOpenHere
                />
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="flex-1 p-6">
                    <div className="h-full w-full bg-muted/20 rounded-lg animate-pulse"></div>
                  </div>
                }
              >
                <NovedadMainContent hook={hook} />
              </Suspense>
            )}
          </div>
        </main>
      </div>

      {/* Capa de Diálogos y Modales */}
      <NovedadModals 
        isMobile={isMobile}
        estaMontado={hook.estaMontado}
        reporteAEliminar={hook.reporteAEliminar}
        setReporteAEliminar={hook.setReporteAEliminar}
        reporteADuplicar={hook.reporteADuplicar}
        setReporteADuplicar={hook.setReporteADuplicar}
        manejarConfirmarDuplicacion={hook.manejarConfirmarDuplicacion}
        manejarLimpiarTodo={hook.manejarLimpiarTodo}
        manejarEliminarReporte={hook.manejarEliminarReporte}
        esDialogOpenCrear={hook.esDialogOpenCrear}
        setEsDialogOpenCrear={hook.setEsDialogOpenCrear}
        templates={hook.templates}
        manejarSeleccionarPlantilla={hook.manejarSeleccionarPlantilla}
        navigate={hook.navigate}
        isConfirmExportOpen={hook.isConfirmExportOpen}
        setIsConfirmExportOpen={hook.setIsConfirmExportOpen}
        ejecutarExportacionWord={hook.ejecutarExportacionWord}
      />
    </>
  );
}

export default memo(NovedadesPageContent);
