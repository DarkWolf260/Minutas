import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { STATISTICS_SECTIONS } from '@/lib/constants/statistics';
import { StatsSectionRow } from './stats-section-row';
import { StatsTotalRow } from './stats-total-row';

interface StatsTableProps {
  hook: any;
}

export const StatsTable = ({ hook }: StatsTableProps) => {
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
              <StatsSectionRow 
                key={seccion.title} 
                seccion={seccion} 
                arregloDias={arregloDias} 
                estadisticas={estadisticas} 
              />
            ))}
            <StatsTotalRow hook={hook} />
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
};
