import React from 'react';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UseNovedadesReturn } from '@/hooks/novedades';

export interface MobileHeaderProps {
  hook: Pick<
    UseNovedadesReturn,
    | 'estaMontado'
    | 'creandoReporte'
    | 'reporteSeleccionado'
    | 'manejarCancelarCreacion'
    | 'manejarSeleccionarReporte'
  >;
  isMobile: boolean;
  onOpenWhatsApp?: () => void;
  isBotConnected?: boolean;
}

export const MobileHeader = ({
  hook,
  isMobile,
  onOpenWhatsApp,
  isBotConnected
}: MobileHeaderProps) => {
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
      <div className="flex items-center min-w-0 mr-2">
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
          className="mr-1"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver
        </Button>
        <div className="text-sm font-medium truncate">
          {creandoReporte ? creandoReporte.name : reporteSeleccionado?.title}
        </div>
      </div>

      {isBotConnected && onOpenWhatsApp && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenWhatsApp}
          className="h-8 px-2.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1.5 shrink-0 font-medium text-xs"
          title="Abrir Chat de WhatsApp"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Chat</span>
        </Button>
      )}
    </div>
  );
};
