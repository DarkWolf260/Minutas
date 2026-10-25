import React from 'react';
import { ChevronLeft, ChevronRight, FileDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppBarActionPortal } from '@/components/layout/app-bar-action-portal';

import type { UseEstadisticasReturn } from '@/hooks/estadisticas';

export interface StatsHeaderProps {
  hook: Pick<
    UseEstadisticasReturn,
    | 'mes'
    | 'setMes'
    | 'anio'
    | 'setAnio'
    | 'modo'
    | 'setModo'
    | 'aniosDisponibles'
    | 'nombresMeses'
    | 'manejarMesAnterior'
    | 'manejarMesSiguiente'
  >;
}

export const StatsHeader = ({ hook }: StatsHeaderProps) => {
  const {
    mes, setMes, anio, setAnio, modo, setModo,
    aniosDisponibles, nombresMeses,
    manejarMesAnterior, manejarMesSiguiente
  } = hook;

  return (
    <AppBarActionPortal>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Button
          variant="outline"
          size="icon-sm"
          className="h-9 w-9 shadow-2xs"
          onClick={manejarMesAnterior}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v))}>
          <SelectTrigger className="w-[115px] sm:w-[130px] h-9 text-xs">
            <SelectValue>{nombresMeses[mes]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {nombresMeses.map((m: string, i: number) => (
              <SelectItem key={i} value={String(i)}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(anio)} onValueChange={(v) => setAnio(parseInt(v))}>
          <SelectTrigger className="w-[80px] sm:w-[90px] h-9 text-xs">
            <SelectValue>{anio}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {aniosDisponibles.map((a: number) => (
              <SelectItem key={a} value={String(a)}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon-sm"
          className="h-9 w-9 shadow-2xs"
          onClick={manejarMesSiguiente}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Select value={modo} onValueChange={(v: any) => setModo(v)}>
          <SelectTrigger className="hidden md:flex w-[155px] h-9 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="statistical">Corte 03:00 HLV</SelectItem>
            <SelectItem value="standard">Corte 00:00 HLV</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="secondary" size="icon-sm" className="hidden sm:flex h-9 w-9 shadow-2xs" title="Exportar (Próximamente)" aria-label="Exportar estadísticas">
          <FileDown className="h-4 w-4" />
        </Button>
      </div>
    </AppBarActionPortal>
  );
};


