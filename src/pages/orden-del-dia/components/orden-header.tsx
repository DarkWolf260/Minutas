import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBarActionPortal } from '@/components/layout/app-bar-action-portal';

interface OrdenHeaderProps {
  guardiaAbierta?: boolean;
  idGuardiaSeleccionada: string;
  manejarGenerarOrden: () => void;
}

export const OrdenHeader = ({ idGuardiaSeleccionada, manejarGenerarOrden }: OrdenHeaderProps) => {
  return (
    <AppBarActionPortal>
      <Button
        onClick={manejarGenerarOrden}
        disabled={!idGuardiaSeleccionada}
        size="sm"
        className="hidden sm:flex h-9 px-4 rounded-xl gap-2 shadow-xs font-bold text-xs cursor-pointer transition-all active:scale-95"
      >
        <FileText className="h-4 w-4" />
        <span>Generar Orden</span>
      </Button>
    </AppBarActionPortal>
  );
};

