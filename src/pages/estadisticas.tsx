'use client';

import { Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, FileDown, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STATISTICS_SECTIONS } from '@/lib/constants/statistics';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEstadisticas, ModoEstadistica } from '@/hooks/use-estadisticas';

export default function EstadisticasPage() {
  const hook = useEstadisticas();
  const { mes, anio, modo, nombresMeses } = hook;

  return (
    <ScrollArea className="h-full w-full" type="always">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 sm:pb-16 space-y-8 h-full flex flex-col">
        <CabeceraEstadisticas hook={hook} />

        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg font-medium text-center uppercase tracking-wide flex flex-col gap-1">
              <span>Estadística Mensual - {nombresMeses[mes]} {anio}</span>
              <span className="text-[10px] text-muted-foreground font-normal lowercase italic">
                {modo === 'statistical' ? 'Corte operacional de 03:00 a 03:00 HLV' : 'Corte estándar de 00:00 a 23:59 HLV'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <TablaEstadistica hook={hook} />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

function CabeceraEstadisticas({ hook }: { hook: any }) {
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

        <Select value={modo} onValueChange={(v: ModoEstadistica) => setModo(v)}>
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
}

function TablaEstadistica({ hook }: { hook: any }) {
  const { arregloDias, estadisticas } = hook;

  return (
    <ScrollArea className="w-full" type="always">
      <div className="min-w-[1200px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[50px] font-bold sticky left-0 z-20 bg-background border-r text-center shadow-[inset_-1px_0_0_0_hsl(var(--border))]">
                NO.
              </TableHead>
              <TableHead className="w-[300px] font-bold sticky left-[50px] z-20 bg-background border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                RUBROS / CATEGORÍAS
              </TableHead>
              {arregloDias.map((dia: number) => (
                <TableHead
                  key={dia}
                  className="text-center w-[35px] min-w-[35px] p-0 font-semibold text-xs text-muted-foreground border-r last:border-r-0"
                >
                  {dia}
                </TableHead>
              ))}
              <TableHead className="text-center font-bold bg-muted/20 w-[60px] border-l">
                TOTAL
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {STATISTICS_SECTIONS.map((seccion) => (
              <FilaSeccionEstadistica 
                key={seccion.title} 
                seccion={seccion} 
                arregloDias={arregloDias} 
                estadisticas={estadisticas} 
              />
            ))}
            <FilaTotalDiario hook={hook} />
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}

function FilaSeccionEstadistica({ seccion, arregloDias, estadisticas }: { seccion: any, arregloDias: number[], estadisticas: any }) {
  const colorFondo = seccion.headerColor?.includes('blue')
    ? 'rgba(59, 130, 246, 0.2)'
    : seccion.headerColor?.includes('green')
      ? 'rgba(34, 197, 94, 0.2)'
      : seccion.headerColor?.includes('red') || seccion.headerColor?.includes('orange')
        ? 'rgba(239, 68, 68, 0.2)'
        : seccion.headerColor?.includes('amber') || seccion.headerColor?.includes('yellow')
          ? 'rgba(245, 158, 11, 0.2)'
          : 'rgba(156, 163, 175, 0.4)';

  return (
    <Fragment>
      <TableRow className="hover:bg-muted/10 border-b-2">
        <TableCell
          colSpan={2}
          className="sticky left-0 z-20 font-bold text-[11px] text-center border-r shadow-[2px_0_10px_-2px_rgba(0,0,0,0.1)] py-2"
          style={{ backgroundColor: colorFondo }}
        >
          {seccion.title}
        </TableCell>
        {arregloDias.map((dia) => (
          <TableCell
            key={`hdr-${dia}`}
            className="p-0 border-r"
            style={{ backgroundColor: colorFondo }}
          />
        ))}
        <TableCell
          className="border-l"
          style={{ backgroundColor: colorFondo }}
        />
      </TableRow>

      {seccion.items.map((item: any) => {
        const claveCompleta = `${item.code} ${item.label}`;
        const datosCat = estadisticas?.get(claveCompleta);
        let total = 0;
        if (datosCat) {
          datosCat.forEach((val: number) => (total += val));
        }

        return (
          <TableRow key={claveCompleta} className="hover:bg-muted/5 group">
            <TableCell className="font-bold text-[10px] py-1.5 sticky left-0 z-10 bg-background border-r text-center shadow-[inset_-1px_0_0_0_hsl(var(--border))] group-hover:bg-muted/10">
              {item.code}
            </TableCell>
            <TableCell
              className="font-medium text-[10px] py-1.5 sticky left-[50px] z-10 bg-background border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[300px] group-hover:bg-muted/10"
              title={item.label}
            >
              {item.label}
            </TableCell>

            {arregloDias.map((dia) => {
              const valor = datosCat?.get(dia) || 0;
              return (
                <TableCell
                  key={dia}
                  className={`text-center p-0 text-[10px] border-r border-muted/50 ${valor > 0 ? 'font-bold text-foreground bg-primary/10' : ''}`}
                >
                  {valor > 0 ? valor : ''}
                </TableCell>
              );
            })}
            <TableCell className="text-center font-bold text-[10px] bg-muted/20 border-l">
              {total > 0 ? total : ''}
            </TableCell>
          </TableRow>
        );
      })}
    </Fragment>
  );
}

function FilaTotalDiario({ hook }: { hook: any }) {
  const { arregloDias, estadisticas } = hook;

  let totalMensual = 0;
  if (estadisticas) {
    estadisticas.forEach((mapaDia: Map<number, number>) => {
      mapaDia.forEach((val) => (totalMensual += val));
    });
  }

  return (
    <TableRow className="bg-muted/30 font-bold border-t-2">
      <TableCell className="sticky left-0 z-10 bg-muted/30 border-r text-center">
        -
      </TableCell>
      <TableCell className="sticky left-[50px] z-10 bg-muted/30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
        TOTAL DIARIO
      </TableCell>
      {arregloDias.map((dia: number) => {
        let totalDia = 0;
        if (estadisticas) {
          estadisticas.forEach((mapaDia: Map<number, number>) => {
            totalDia += mapaDia.get(dia) || 0;
          });
        }
        return (
          <TableCell key={dia} className="text-center p-0 text-xs border-r">
            {totalDia > 0 ? totalDia : ''}
          </TableCell>
        );
      })}
      <TableCell className="text-center bg-muted/40 border-l">
        {totalMensual > 0 ? totalMensual : ''}
      </TableCell>
    </TableRow>
  );
}
