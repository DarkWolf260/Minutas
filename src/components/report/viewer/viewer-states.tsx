import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Report } from '@/lib/types';

export const ViewerEmpty = () => (
  <div className="flex h-full flex-col items-center justify-center bg-card text-center">
    <FileText className="h-12 w-12 text-muted-foreground opacity-20" />
    <h3 className="mt-4 text-lg font-semibold">No hay reporte seleccionado</h3>
    <p className="text-muted-foreground">Selecciona un reporte de la lista.</p>
  </div>
);

export const ViewerLoading = () => (
  <div className="flex h-full flex-col items-center justify-center p-8 bg-muted/5">
    <div className="h-full w-full max-w-[1000px] bg-muted/20 rounded-2xl animate-pulse aspect-video mb-4"></div>
    <p className="text-muted-foreground animate-pulse">Cargando plantilla...</p>
  </div>
);

interface ViewerErrorProps {
  report: Report;
  onDelete: (id: string) => void;
}

export const ViewerError = ({ report, onDelete }: ViewerErrorProps) => (
  <div className="flex h-full flex-col overflow-hidden">
    <ScrollArea className="flex-1 w-full" type="always">
      <div className="p-6 text-center max-w-2xl mx-auto">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
        <h3 className="mt-4 text-lg font-semibold text-destructive">Error en la Plantilla</h3>
        <p className="text-muted-foreground mb-6">La plantilla no se encuentra o tiene un error.</p>
        <div className="text-left">
          <Label>Contenido Original</Label>
          <div className="mt-2 p-4 bg-muted/40 rounded-md border font-mono text-sm whitespace-pre-wrap leading-relaxed min-h-[200px]">
            {report.content}
          </div>
        </div>
        <Button variant="destructive" className="mt-6" onClick={() => onDelete(report.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar Reporte
        </Button>
      </div>
    </ScrollArea>
  </div>
);
