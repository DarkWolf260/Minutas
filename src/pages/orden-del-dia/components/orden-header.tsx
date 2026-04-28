import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrdenHeaderProps {
  guardiaAbierta: boolean;
  idGuardiaSeleccionada: string;
  manejarGenerarOrden: () => void;
}

export const OrdenHeader = ({ guardiaAbierta, idGuardiaSeleccionada, manejarGenerarOrden }: OrdenHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 shrink-0">
      <div className="flex items-center gap-4">
        <Link to="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
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
        {guardiaAbierta && (
          <Badge variant="outline" className="hidden md:flex h-9 px-4 gap-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold uppercase tracking-wider animate-pulse rounded-xl">
            <CheckCircle2 className="h-4 w-4" />
            Guardia Activa
          </Badge>
        )}
        <Button
          onClick={manejarGenerarOrden}
          disabled={!idGuardiaSeleccionada}
          size="sm"
          className="hidden sm:flex gap-2 shadow-sm font-bold"
        >
          <Eye className="h-4 w-4" />
          Generar Orden
        </Button>
      </div>
    </div>
  );
};
