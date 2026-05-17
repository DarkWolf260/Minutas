import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, X, ClipboardCheck, History, Save, FileDown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReporteModalsProps {
  hook: any;
  isMobile: boolean;
}

export function ReporteModals({ hook, isMobile }: ReporteModalsProps) {
  const {
    esDialogOpenResultado,
    setEsDialogOpenResultado,
    reporteGenerado,
    textoBotonCopiar,
    manejarCopiarAlPortapapeles,
    setEsDialogOpenConfirmarGuardar,
    esDialogOpenVista,
    setEsDialogOpenVista,
    reporteGuardadoSeleccionado,
    manejarCopiarReporte,
    esDialogOpenConfirmarGuardar,
    manejarFinalizarYGuardar,
    esDialogOpenConfirmarEliminar,
    setEsDialogOpenConfirmarEliminar,
    manejarConfirmarEliminacionHistorial,
    manejarExportarWord,
    manejarExportarWordHistorial
  } = hook;

  return (
    <>
      {isMobile ? (
        <Sheet open={esDialogOpenResultado} onOpenChange={setEsDialogOpenResultado}>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-[2.5rem] p-6 flex flex-col">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="text-xl font-bold">Reporte Final Generado</SheetTitle>
              <SheetDescription>Previsualización del reporte consolidado de la guardia</SheetDescription>
            </SheetHeader>

            <div className="flex-1 min-h-0 mt-2 border rounded-md bg-muted/50 overflow-hidden">
              <ScrollArea className="h-[60vh] w-full" type="always">
                <pre className="p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text break-words">
                  {reporteGenerado}
                </pre>
              </ScrollArea>
            </div>

            <SheetFooter className="pt-4 border-t flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={manejarCopiarAlPortapapeles}
                className="w-full h-12 font-bold rounded-xl border-2"
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                {textoBotonCopiar}
              </Button>
              <Button
                onClick={() => setEsDialogOpenConfirmarGuardar(true)}
                className="w-full h-12 font-bold shadow-lg shadow-primary/20 rounded-xl"
              >
                <Save className="h-4 w-4 mr-2" />
                Finalizar y Archivar
              </Button>
              <Button
                variant="outline"
                onClick={manejarExportarWord}
                className="w-full h-12 font-bold rounded-xl border-2"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar a Word
              </Button>
              <SheetClose asChild>
                <Button type="button" variant="secondary" className="w-full h-11 font-bold">
                  Cerrar
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={esDialogOpenResultado} onOpenChange={setEsDialogOpenResultado}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0 border-none rounded-3xl shadow-2xl">
            <DialogHeader className="p-6 pb-4 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">Reporte Final Generado</DialogTitle>
                    <DialogDescription>Previsualización del reporte consolidado de la guardia</DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 mt-2 border rounded-md bg-muted/50 overflow-hidden">
              <ScrollArea className="h-[50vh] w-full" type="always">
                <pre className="p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap select-text break-words">
                  {reporteGenerado}
                </pre>
              </ScrollArea>
            </div>

            <DialogFooter className="p-6 bg-muted/30 border-t flex items-center justify-end gap-3">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  onClick={() => setEsDialogOpenConfirmarGuardar(true)}
                  className="flex-1 sm:flex-none h-11 px-6 font-bold shadow-lg shadow-primary/20 rounded-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Finalizar y Archivar
                </Button>
                <Button
                  variant="outline"
                  onClick={manejarExportarWord}
                  className="flex-1 sm:flex-none h-11 px-6 font-bold border-2 rounded-xl"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar Word
                </Button>
                <Button
                  variant="outline"
                  onClick={manejarCopiarAlPortapapeles}
                  className="flex-1 sm:flex-none h-11 px-6 font-bold border-2 rounded-xl"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  {textoBotonCopiar}
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="h-11 px-6 font-bold rounded-xl">
                    Cerrar
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Vista Reporte */}
      {isMobile ? (
        <Sheet open={esDialogOpenVista} onOpenChange={setEsDialogOpenVista}>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-[2.5rem] p-6 flex flex-col">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="text-xl font-bold line-clamp-1">{reporteGuardadoSeleccionado?.summary}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Badge variant="outline" className="font-bold">Grupo {reporteGuardadoSeleccionado?.guardGroup}</Badge>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  {reporteGuardadoSeleccionado && format(new Date(reporteGuardadoSeleccionado.date), 'dd/MM/yyyy', { locale: es })}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 min-h-0 mt-2 border rounded-md bg-muted/50 overflow-hidden">
              <ScrollArea className="h-[60vh] w-full" type="always">
                <pre className="p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text break-words">
                  {reporteGuardadoSeleccionado?.content}
                </pre>
              </ScrollArea>
            </div>

            <SheetFooter className="pt-4 border-t flex flex-col gap-3">
              <Button
                onClick={manejarCopiarReporte}
                className="w-full h-12 font-bold rounded-xl"
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                {textoBotonCopiar}
              </Button>
              <Button
                variant="outline"
                onClick={manejarExportarWordHistorial}
                className="w-full h-12 font-bold rounded-xl border-2"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar a Word
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={esDialogOpenVista} onOpenChange={setEsDialogOpenVista}>
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-8 rounded-[2rem]">
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-center justify-between pr-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold">{reporteGuardadoSeleccionado?.summary}</DialogTitle>
                    <DialogDescription className="flex items-center gap-3 mt-0.5">
                      <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">
                        Grupo {reporteGuardadoSeleccionado?.guardGroup}
                      </Badge>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {reporteGuardadoSeleccionado && format(new Date(reporteGuardadoSeleccionado.date), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 mt-2 border rounded-md bg-muted/50 overflow-hidden">
              <ScrollArea className="h-[60vh] w-full" type="always">
                <pre className="p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text break-words">
                  {reporteGuardadoSeleccionado?.content}
                </pre>
              </ScrollArea>
            </div>

            <DialogFooter className="pt-4 border-t flex items-center gap-3">
              <Button
                onClick={manejarCopiarReporte}
                className="h-11 px-8 font-bold rounded-xl shadow-lg shadow-primary/10"
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                {textoBotonCopiar}
              </Button>
              <Button
                variant="outline"
                onClick={manejarExportarWordHistorial}
                className="h-11 px-8 font-bold border-2 rounded-xl"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar Word
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={esDialogOpenConfirmarGuardar}
        onOpenChange={setEsDialogOpenConfirmarGuardar}
        onConfirm={manejarFinalizarYGuardar}
        title="¿Cerrar y Limpiar Guardia?"
        message="Al archivar este reporte, se limpiarán permanentemente todas las novedades de la sesión actual para iniciar una nueva guardia. Esta acción no se puede deshacer."
        confirmText="Sí, finalizar y limpiar"
        variant="destructive"
      />

      <ConfirmDialog
        open={esDialogOpenConfirmarEliminar}
        onOpenChange={setEsDialogOpenConfirmarEliminar}
        onConfirm={manejarConfirmarEliminacionHistorial}
        title="¿Eliminar del Historial?"
        message="Esta acción eliminará permanentemente el reporte archivado del historial local. No se puede deshacer."
        confirmText="Sí, eliminar reporte"
        variant="destructive"
      />
    </>
  );
}
