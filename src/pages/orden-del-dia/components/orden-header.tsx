import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrdenHeaderProps {
  guardiaAbierta?: boolean;
  idGuardiaSeleccionada: string;
  manejarGenerarOrden: () => void;
}

export const OrdenHeader = ({ idGuardiaSeleccionada, manejarGenerarOrden }: OrdenHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 shrink-0">
      <div className="flex items-center gap-4">
        <Link to="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Orden del Día</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Genera el reporte diario de operaciones para la guardia activa.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button
          onClick={manejarGenerarOrden}
          disabled={!idGuardiaSeleccionada}
          size="sm"
          className="hidden sm:flex h-9 px-4 rounded-xl gap-2 shadow-xs font-bold text-xs cursor-pointer transition-all active:scale-95"
        >
          <FileText className="h-4 w-4" />
          Generar Orden
        </Button>
      </div>
    </div>
  );
};
