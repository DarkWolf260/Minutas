import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StatsHeaderProps {
  hook: any;
}

export const StatsHeader = ({ hook }: StatsHeaderProps) => {
  const { 
    mes, setMes, anio, setAnio, modo, setModo, 
    aniosDisponibles, nombresMeses, 
    manejarMesAnterior, manejarMesSiguiente 
  } = hook;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
      <div className="flex items-center gap-4">
        <Link to="/" className="shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-muted-foreground mt-1">
            Visualización de datos operacionales por mes y año.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shadow-sm"
          onClick={manejarMesAnterior}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v))}>
          <SelectTrigger className="w-[140px]">
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
          <SelectTrigger className="w-[100px]">
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
          size="icon"
          className="h-9 w-9 shadow-sm"
          onClick={manejarMesSiguiente}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Select value={modo} onValueChange={(v: any) => setModo(v)}>
          <SelectTrigger className="w-[180px] shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="statistical">Corte 03:00 HLV</SelectItem>
            <SelectItem value="standard">Corte 00:00 HLV</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="secondary" size="icon" className="h-9 w-9 shadow-sm" title="Exportar (Próximamente)">
          <FileDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
