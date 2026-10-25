import React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppBarActionPortal } from '@/components/layout/app-bar-action-portal';
import type { UseReporteFinalReturn } from '@/hooks/reporte-final';

export interface ReporteHeaderProps {
  hook: Pick<
    UseReporteFinalReturn,
    | 'tabActiva'
    | 'manejarGenerarReporte'
    | 'estaCargado'
  >;
  isMobile: boolean;
}

export function ReporteHeader({ hook, isMobile }: ReporteHeaderProps) {
  const {
    tabActiva,
    manejarGenerarReporte,
    estaCargado
  } = hook;

  return (
    <AppBarActionPortal>
      <div className="flex items-center gap-2">
        <TabsList className="grid w-[180px] sm:w-[200px] grid-cols-2 h-9 p-1 shadow-xs bg-muted/60">
          <TabsTrigger value="generate" className="text-xs font-semibold">Generar</TabsTrigger>
          <TabsTrigger value="history" className="text-xs font-semibold">Historial</TabsTrigger>
        </TabsList>

        {tabActiva === 'generate' && !isMobile && estaCargado && (
          <Button
            onClick={manejarGenerarReporte}
            size="sm"
            className="hidden sm:flex h-9 px-3.5 gap-2 shadow-xs font-bold rounded-xl"
          >
            <FileText className="h-4 w-4" />
            <span>Generar Reporte</span>
          </Button>
        )}
      </div>
    </AppBarActionPortal>
  );
}


