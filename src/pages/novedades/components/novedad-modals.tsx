import React from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ui/custom/confirm-dialog';
import { TemplateList } from './template-list';

interface NovedadModalsProps {
  isMobile: boolean;
  estaMontado: boolean;
  reporteAEliminar: string | null;
  setReporteAEliminar: (val: string | null) => void;
  manejarLimpiarTodo: () => void;
  manejarEliminarReporte: (id: string) => void;
  esDialogOpenCrear: boolean;
  setEsDialogOpenCrear: (val: boolean) => void;
  templates: any[];
  manejarSeleccionarPlantilla: (id: string) => void;
  navigate: (path: string) => void;
}

export const NovedadModals = React.memo(({
  isMobile,
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
}: NovedadModalsProps) => {
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
                <TemplateList 
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
                <TemplateList 
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

NovedadModals.displayName = 'NovedadModals';
