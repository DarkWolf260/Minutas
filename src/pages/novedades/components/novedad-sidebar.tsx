import React from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NoGuardBanner } from '@/components/guards/guard-selector';
import { cn } from '@/lib/utils';
import { NovedadItem } from './novedad-item';
import { NovedadFilters } from './novedad-filters';

interface NovedadSidebarProps {
  hook: any;
  isMobile: boolean;
}

export const NovedadSidebar = ({ hook, isMobile }: NovedadSidebarProps) => {
  const { 
    idReporteSeleccionado, 
    creandoReporte, 
    guardiaAbierta, 
    setEsDialogOpenCrear,
    busqueda,
    setBusqueda,
    ordenamiento,
    setOrdenamiento,
    reportesFiltrados,
    manejarSeleccionarReporte,
    manejarExportarTodasWord
  } = hook;

  return (
    <aside
      id="novedades-sidebar"
      className={cn(
        'h-full w-full sm:w-80 lg:w-96 flex-col border-r bg-card flex gap-0 animate-in fade-in slide-in-from-left-4 duration-300 sm:animate-none',
        idReporteSeleccionado || creandoReporte ? 'hidden sm:flex' : 'flex'
      )}
    >
      <div className="flex items-center justify-between border-b p-3 sm:p-4 min-h-[60px] sm:min-h-[73px]">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">Novedades</h2>
        <Button
          size="sm"
          onClick={() => setEsDialogOpenCrear(true)}
          disabled={!guardiaAbierta}
          className="shadow-sm gap-2 h-8 sm:h-9 text-xs sm:text-sm"
        >
          <PlusCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Nuevo
        </Button>
      </div>

      <NovedadFilters 
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        ordenamiento={ordenamiento}
        setOrdenamiento={setOrdenamiento}
        manejarExportarTodasWord={manejarExportarTodasWord}
      />
      
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full" type="always">
          <div className={cn(
            "space-y-1 p-3 pt-3 sm:pb-3",
            reportesFiltrados.length > 0 ? "pb-32" : "pb-6"
          )}>
            {reportesFiltrados.map((report: any) => (
              <NovedadItem 
                key={report.id}
                report={report}
                isSelected={idReporteSeleccionado === report.id && !creandoReporte}
                onSelect={manejarSeleccionarReporte}
              />
            ))}
            
            {reportesFiltrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-2 sm:py-12 px-4 text-center animate-in fade-in duration-500 w-full">
                {!guardiaAbierta && isMobile ? (
                  <NoGuardBanner
                    message="Para registrar novedades primero debes abrir una nueva guardia."
                    allowOpenHere
                  />
                ) : (
                  <>
                    <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-muted-foreground/10 opacity-60">
                      <Search className="h-7 w-7 opacity-20" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground/70 tracking-tight">Sin resultados</h3>
                      <p className="text-xs text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                        No se encontraron reportes registrados.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};
