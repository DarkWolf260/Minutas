import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cleanTemplateName } from '@/lib/template-parser';

interface MobileHeaderProps {
  hook: any;
  isMobile: boolean;
}

export const MobileHeader = ({ hook, isMobile }: MobileHeaderProps) => {
  const { 
    estaMontado, 
    creandoReporte, 
    reporteSeleccionado, 
    manejarCancelarCreacion,
    manejarSeleccionarReporte
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
        {creandoReporte ? cleanTemplateName(creandoReporte.name) : (reporteSeleccionado?.title || '')}
      </div>
    </div>
  );
};
