import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/custom/date-picker';
import { formatDateToPeriod, parsePeriodToDate } from '@/lib/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Lock, Play } from 'lucide-react';

interface GuardConfigCardProps {
  idGuardiaSeleccionada: string;
  setIdGuardiaSeleccionada: (id: string) => void;
  guardiaAbierta: boolean;
  guardias: any[];
  periodo: string;
  setPeriodo: (periodo: string) => void;
  manejarAbrirGuardia: () => void;
}

export const GuardConfigCard = ({
  idGuardiaSeleccionada,
  setIdGuardiaSeleccionada,
  guardiaAbierta,
  guardias,
  periodo,
  setPeriodo,
  manejarAbrirGuardia
}: GuardConfigCardProps) => {
  return (
    <Card className="md:col-span-12 border shadow-sm bg-card overflow-hidden">
      <CardHeader className="py-2.5 border-b bg-muted/30 shrink-0">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-primary" />
          Configuración de la Guardia
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-wrap items-end gap-6">
        <div className="space-y-2 max-w-xs flex-1 min-w-[200px]">
          <Label
            htmlFor="guard-select"
            className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1"
          >
            Guardia de Turno
          </Label>
          <Select
            value={idGuardiaSeleccionada}
            onValueChange={setIdGuardiaSeleccionada}
            disabled={guardiaAbierta}
          >
            <SelectTrigger id="guard-select" className={`h-10 rounded-lg shadow-sm ${guardiaAbierta ? 'bg-muted opacity-80' : 'bg-background'}`}>
              <SelectValue placeholder="Selecciona una guardia..." />
            </SelectTrigger>
            <SelectContent>
              {guardias.map((guard: any) => (
                <SelectItem key={guard.id} value={guard.id}>
                  Guardia &quot;{guard.id}&quot;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 max-w-xs flex-1 min-w-[200px]">
          <Label
            htmlFor="periodo"
            className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1"
          >
            Periodo de Operaciones
          </Label>
          <DatePicker
            id="periodo"
            value={parsePeriodToDate(periodo)}
            onChange={(newDateStr) => {
              const date = new Date(newDateStr + 'T12:00:00'); // Use noon to avoid timezone issues
              setPeriodo(formatDateToPeriod(date));
            }}
            disabled={guardiaAbierta}
            className={`h-10 rounded-lg shadow-sm ${guardiaAbierta ? 'bg-muted opacity-80' : 'bg-background'}`}
          />
        </div>
        {!guardiaAbierta && (
          <Button
            onClick={manejarAbrirGuardia}
            disabled={!idGuardiaSeleccionada}
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold ml-auto"
          >
            <Play className="h-3 w-3 fill-current" />
            Abrir Nueva Guardia
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
