import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

interface StatsTotalRowProps {
  hook: any;
}

export const StatsTotalRow = ({ hook }: StatsTotalRowProps) => {
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
};
