'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEstadisticas } from '@/hooks/use-estadisticas';

// Componentes extraídos (SOLID)
import { StatsHeader } from './estadisticas/components/stats-header';
import { StatsTable } from './estadisticas/components/stats-table';

export default function EstadisticasPage() {
  const hook = useEstadisticas();
  const { mes, anio, modo, nombresMeses } = hook;

  return (
    <ScrollArea className="h-full w-full bg-background" type="always">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-32 sm:pb-16 space-y-8 h-full flex flex-col">
        {/* Cabecera y Filtros (SRP) */}
        <StatsHeader hook={hook} />

        {/* Card Principal de Datos (OCP) */}
        <Card className="overflow-hidden border-2 shadow-sm">
          <CardHeader className="bg-muted/30 py-4 border-b">
            <CardTitle className="text-lg font-bold text-center uppercase tracking-wide flex flex-col gap-1">
              <span>Estadística Mensual - {nombresMeses[mes]} {anio}</span>
              <span className="text-[10px] text-muted-foreground font-normal lowercase italic">
                {modo === 'statistical' ? 'Corte operacional de 03:00 a 03:00 HLV' : 'Corte estándar de 00:00 a 23:59 HLV'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            {/* Tabla de Datos (SRP) */}
            <StatsTable hook={hook} />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
