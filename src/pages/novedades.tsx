import React, { Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, PlusCircle, ChevronLeft, Clock, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import { ReportViewer } from '@/components/report/report-viewer';
import { NoGuardBanner } from '@/components/guards/guard-selector';
import { ReportGenerator } from '@/components/report/report-generator';
import type { Report, Template } from '@/lib/types';
import { cn, getTemplateIcon } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { findValueInFormData } from '@/lib/report-sorter';
import { useNovedades } from '@/hooks/use-novedades';
import { useIsMobile } from '@/hooks/use-mobile';

function NovedadesPageContent() {
  const isMobile = useIsMobile();
  const hook = useNovedades();
  const { 
    idReporteSeleccionado, 
    creandoReporte, 
    guardiaAbierta, 
    reporteSeleccionado 
  } = hook;

  return (
    <>
      <div className="flex flex-col h-full w-full bg-background overflow-hidden sm:flex-row flex-1">
        <SidebarLista hook={hook} isMobile={isMobile} />

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
            ) : creandoReporte || idReporteSeleccionado ? (
              <Suspense
                fallback={
                  <div className="flex-1 p-6">
                    <div className="h-full w-full bg-muted/20 rounded-lg animate-pulse"></div>
                  </div>
                }
              >
                <ContenidoPrincipal hook={hook} />
              </Suspense>
            ) : (
              <VistaVacia />
            )}
          </div>
        </main>
      </div>

      <ModalesNovedades hook={hook} isMobile={isMobile} />
    </>
  );
}

function SidebarLista({ hook, isMobile }: { hook: any, isMobile: boolean }) {
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
    navigate
  } = hook;

  return (
    <aside
      className={cn(
        'h-full w-full sm:w-80 lg:w-96 flex-col border-r bg-card flex gap-0 animate-in fade-in slide-in-from-left-4 duration-300 sm:animate-none',
        idReporteSeleccionado || creandoReporte ? 'hidden sm:flex' : 'flex'
      )}
    >
      <div className="flex items-center justify-between border-b p-4 min-h-[73px]">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">Novedades</h2>
        </div>
        <Button
          size="sm"
          onClick={() => setEsDialogOpenCrear(true)}
          disabled={!guardiaAbierta}
          className="shadow-sm gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <div className="p-4 space-y-4 border-b bg-muted/5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="report-search"
              name="report-search"
              placeholder="Buscar reportes..."
              className="pl-9 bg-background border-none shadow-sm focus-visible:ring-primary/20 rounded-lg"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOrdenamiento((prev: any) => prev === 'asc' ? 'desc' : 'asc')}
            className={cn(
              "h-9 w-9 shrink-0 rounded-lg border bg-background shadow-sm hover:bg-muted transition-all duration-300",
              ordenamiento === 'desc' ? "text-primary border-primary/20 bg-primary/5" : "text-muted-foreground"
            )}
            title={ordenamiento === 'desc' ? "Orden cronológico descendente" : "Orden cronológico ascendente"}
          >
            {ordenamiento === 'desc' ? (
              <ArrowDownWideNarrow className="h-4 w-4 animate-in fade-in zoom-in duration-300" />
            ) : (
              <ArrowUpNarrowWide className="h-4 w-4 animate-in fade-in zoom-in duration-300" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full w-full" type="always">
          <div className="space-y-1 p-3 pt-3 pb-32 sm:pb-3">
            {reportesFiltrados.map((report: Report) => {
              const horaValue = findValueInFormData(report.formData, 'Hora');
              return (
                <button
                  key={report.id}
                  onClick={() => manejarSeleccionarReporte(report.id)}
                  className={cn(
                    'w-full rounded-2xl p-3.5 text-left transition-all duration-200 group',
                    idReporteSeleccionado === report.id && !creandoReporte
                      ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-sm'
                      : 'hover:bg-muted/50 border-transparent'
                  )}
                >
                  <div className="flex w-full items-start gap-3.5">
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "font-semibold leading-tight mb-1 truncate",
                        idReporteSeleccionado === report.id && !creandoReporte ? "text-primary" : "text-foreground"
                      )}>
                        {report.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground/80">
                        {report.status && (
                          <div className="flex items-center gap-1.5 bg-muted/30 px-1.5 py-0.5 rounded">
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                report.status === 'Finalizado' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                              )}
                            />
                            <span className="font-bold text-[10px] uppercase tracking-tighter">{report.status}</span>
                          </div>
                        )}
                        {horaValue && (
                          <div className="flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            <Clock className="h-3 w-3 text-muted-foreground/50" />
                            <span>{String(horaValue)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {reportesFiltrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-500">
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
}

function ContenidoPrincipal({ hook }: { hook: any }) {
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
}

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

function MobileHeader({ hook, isMobile }: { hook: any, isMobile: boolean }) {
  const { 
    estaMontado, 
    creandoReporte, 
    reporteSeleccionado, 
    manejarCancelarCreacion,
    manejarSeleccionarReporte,
    navigate
  } = hook;

  if (!isMobile || !estaMontado) return null;
  if (!creandoReporte && !reporteSeleccionado) return null;

  return (
    <div className="sm:hidden border-b p-3 bg-card flex items-center justify-between sticky top-0 z-10 h-16 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (creandoReporte) {
            manejarCancelarCreacion();
          } else {
            manejarSeleccionarReporte(null, true);
          }
        }}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>
      <div className="text-sm font-medium truncate ml-2">
        {creandoReporte ? creandoReporte.name : reporteSeleccionado?.title}
      </div>
    </div>
  );
}

const ModalesNovedades = memo(function ModalesNovedades({ hook, isMobile }: { hook: any, isMobile: boolean }) {
  const {
    estaMontado,
    reporteAEliminar,
    setReporteAEliminar,
    manejarLimpiarTodo,
    manejarEliminarReporte,
    esDialogOpenCrear,
    setEsDialogOpenCrear,
    templates,
    manejarSeleccionarPlantilla,
    navigate
  } = hook;

  if (!estaMontado) return null;

  return (
    <>
      <ConfirmDialog
        open={!!reporteAEliminar}
        onOpenChange={(open) => !open && setReporteAEliminar(null)}
        onConfirm={() => {
          const id = reporteAEliminar;
          setReporteAEliminar(null);
          if (id === 'ALL') manejarLimpiarTodo();
          else if (id) manejarEliminarReporte(id);
        }}
        title="¿Estás seguro?"
        message={reporteAEliminar === 'ALL'
          ? 'Esta acción no se puede deshacer. Se eliminarán permanentemente TODOS los reportes guardados.'
          : 'Esta acción no se puede deshacer. El reporte será eliminado permanentemente.'}
        confirmText="Sí, eliminar"
        variant="destructive"
      />

      {isMobile ? (
        <Sheet open={esDialogOpenCrear} onOpenChange={setEsDialogOpenCrear}>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-xl flex flex-col p-6">
            <SheetHeader className="text-left">
              <SheetTitle>Crear Novedad</SheetTitle>
              <SheetDescription>Selecciona una plantilla para empezar.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 w-full mt-4" type="always">
              <div className="pb-24 grid grid-cols-1 gap-3">
                <ListaPlantillas 
                  templates={templates} 
                  onSelect={manejarSeleccionarPlantilla} 
                  onNavigateToTemplates={() => { setEsDialogOpenCrear(false); navigate('/plantillas'); }} 
                />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={esDialogOpenCrear} onOpenChange={setEsDialogOpenCrear}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Novedad</DialogTitle>
              <DialogDescription>Selecciona una plantilla para empezar.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] w-full mt-4" type="always">
              <div className="px-1 space-y-2">
                <ListaPlantillas 
                  templates={templates} 
                  onSelect={manejarSeleccionarPlantilla} 
                  onNavigateToTemplates={() => { setEsDialogOpenCrear(false); navigate('/plantillas'); }} 
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});

function ListaPlantillas({ templates, onSelect, onNavigateToTemplates }: { templates: Template[], onSelect: (id: string) => void, onNavigateToTemplates: () => void }) {
  const activas = templates.filter(t => t.isActive);
  
  if (activas.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No hay plantillas activas.</p>
        <Button variant="link" onClick={onNavigateToTemplates}>Ir a Plantillas</Button>
      </div>
    );
  }

  return (
    <>
      {activas.map((template) => {
        const Icon = getTemplateIcon(template.name);
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className="w-full text-left p-4 rounded-2xl border bg-card hover:bg-muted transition-all flex items-center gap-4 active:scale-[0.98] shadow-sm border-muted/60"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-sm tracking-tight">{template.name}</span>
          </button>
        );
      })}
    </>
  );
}

export default memo(NovedadesPageContent);
