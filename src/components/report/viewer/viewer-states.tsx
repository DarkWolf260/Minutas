import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Report } from '@/lib/types';

export const ViewerEmpty = () => (
  <div className="empty-state-container bg-card">
    <div className="empty-state-icon-box">
      <FileText className="h-6 w-6 text-muted-foreground" />
    </div>
    <h3 className="empty-state-title">No hay reporte seleccionado</h3>
    <p className="empty-state-desc">Selecciona un reporte de la lista para ver su detalle.</p>
  </div>
);

export const ViewerLoading = () => (
  <div className="flex h-full flex-col items-center justify-center p-8 bg-muted/5">
    <div className="h-full w-full max-w-[1000px] bg-muted/20 rounded-xl animate-pulse aspect-video mb-4"></div>
    <p className="text-muted-foreground animate-pulse text-sm">Cargando plantilla...</p>
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
        <div className="empty-state-icon-box bg-destructive/10 border-destructive/20 text-destructive mb-3">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-destructive">Error en la Plantilla</h3>
        <p className="text-sm text-muted-foreground mb-6">La plantilla no se encuentra disponible o contiene errores de sintaxis.</p>
        <div className="text-left">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Contenido Original</span>
          <div className="mt-2 p-4 bg-muted/30 rounded-xl border font-mono text-xs whitespace-pre-wrap leading-relaxed min-h-[200px]">
            {report.content}
          </div>
        </div>
        <Button variant="destructive" size="sm" className="mt-6" onClick={() => onDelete(report.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar Reporte
        </Button>
      </div>
    </ScrollArea>
  </div>
);
