import React, { Fragment } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';

interface StatsSectionRowProps {
  seccion: any;
  arregloDias: number[];
  estadisticas: any;
}

export const StatsSectionRow = ({ seccion, arregloDias, estadisticas }: StatsSectionRowProps) => {
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
};
