import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { formatDateToPeriod, parsePeriodToDate, getPeriodDurationHours } from '@/lib/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Lock, Shield, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuardConfigCardProps {
  idGuardiaSeleccionada: string;
  setIdGuardiaSeleccionada: (id: string) => void;
  guardiaAbierta: boolean;
  guardias: any[];
  periodo: string;
  setPeriodo: (periodo: string) => void;
  duracion?: number;
  setDuracion?: (duracion: number) => void;
  manejarAbrirGuardia: () => void;
}

export const GuardConfigCard = ({
  idGuardiaSeleccionada,
  setIdGuardiaSeleccionada,
  guardiaAbierta,
  guardias,
  periodo,
  setPeriodo,
  duracion,
  setDuracion,
  manejarAbrirGuardia,
}: GuardConfigCardProps) => {
  const duracionActual = duracion || (periodo ? getPeriodDurationHours(periodo) : 24);

  const manejarCambioDuracion = (nuevaDuracion: number) => {
    setDuracion?.(nuevaDuracion);
    const startDate = new Date(parsePeriodToDate(periodo) + 'T12:00:00');
    setPeriodo(formatDateToPeriod(startDate, nuevaDuracion === 48 ? 2 : 1));
  };

  const manejarCambioFecha = (newDateStr: string) => {
    const date = new Date(newDateStr + 'T12:00:00');
    setPeriodo(formatDateToPeriod(date, duracionActual === 48 ? 2 : 1));
  };

  return (
    <Card className="border shadow-xs bg-card/90 backdrop-blur-xs rounded-2xl overflow-hidden">
      <div className="p-3.5 sm:p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        {/* Left: Indicator & Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl transition-colors shrink-0',
              guardiaAbierta
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-primary/10 text-primary'
            )}
          >
            {guardiaAbierta ? <Lock className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Configuración de Guardia
              </h3>
              {guardiaAbierta && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Activa ({duracionActual}h)
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              {guardiaAbierta
                ? `Guardia operativa de ${duracionActual} horas (${periodo}) protegida`
                : `Guardia de ${duracionActual}h: ${periodo}`}
            </p>
          </div>
        </div>

        {/* Right: Selectors & Open Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Guardia Select */}
          <div className="flex flex-col gap-1 min-w-[140px] flex-1 sm:flex-none">
            <Label htmlFor="guard-select" className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">
              Guardia de Turno
            </Label>
            <Select
              value={idGuardiaSeleccionada}
              onValueChange={setIdGuardiaSeleccionada}
              disabled={guardiaAbierta}
            >
              <SelectTrigger
                id="guard-select"
                className={cn(
                  'h-9 rounded-xl text-xs font-semibold shadow-2xs',
                  guardiaAbierta ? 'bg-muted opacity-80' : 'bg-background'
                )}
              >
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {guardias.map((guard: any) => (
                  <SelectItem key={guard.id} value={guard.id} className="text-xs font-medium cursor-pointer">
                    Guardia &quot;{guard.id}&quot;
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duración Select */}
          <div className="flex flex-col gap-1 min-w-[115px] flex-1 sm:flex-none">
            <Label htmlFor="duracion-select" className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">
              Duración
            </Label>
            <Select
              value={String(duracionActual)}
              onValueChange={(val) => manejarCambioDuracion(parseInt(val, 10))}
              disabled={guardiaAbierta}
            >
              <SelectTrigger
                id="duracion-select"
                className={cn(
                  'h-9 rounded-xl text-xs font-semibold shadow-2xs',
                  guardiaAbierta ? 'bg-muted opacity-80' : 'bg-background'
                )}
              >
                <SelectValue placeholder="Duración..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24" className="text-xs font-medium cursor-pointer">
                  24 Horas
                </SelectItem>
                <SelectItem value="48" className="text-xs font-medium cursor-pointer">
                  48 Horas
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Periodo DatePicker */}
          <div className="flex flex-col gap-1 min-w-[140px] flex-1 sm:flex-none">
            <Label htmlFor="periodo" className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">
              Fecha Inicio
            </Label>
            <DatePicker
              id="periodo"
              value={parsePeriodToDate(periodo)}
              onChange={manejarCambioFecha}
              disabled={guardiaAbierta}
              className={cn(
                'h-9 rounded-xl text-xs shadow-2xs',
                guardiaAbierta ? 'bg-muted opacity-80' : 'bg-background'
              )}
            />
          </div>

          {/* Abrir Guardia Button */}
          {!guardiaAbierta && (
            <div className="flex flex-col justify-end mt-auto pt-4 sm:pt-0">
              <Button
                onClick={manejarAbrirGuardia}
                disabled={!idGuardiaSeleccionada}
                size="sm"
                className="h-9 px-4 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-bold text-xs cursor-pointer transition-all active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Abrir Guardia
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
