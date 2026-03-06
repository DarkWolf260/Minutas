'use client';

import { useState, useMemo, Fragment } from 'react';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
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
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { calculateMonthlyStats } from '@/lib/statistics-utils';
import { STATISTICS_SECTIONS } from '@/constants/statistics';

export default function EstadisticasPage() {
  const { reports, isLoaded: reportsLoaded } = useReports();
  const { templates, configs, isLoaded: templatesLoaded } = useTemplates();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // 0-11

  // Generate years option (current year - 2 to current + 2)
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - 2 + i);
  }, []);

  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const stats = useMemo(() => {
    if (!reportsLoaded || !templatesLoaded) return null;
    return calculateMonthlyStats(reports, templates, configs, month, year);
  }, [reports, templates, configs, month, year, reportsLoaded, templatesLoaded]);

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cuadro General de Estadísticas</h1>
          <p className="text-muted-foreground">Control mensual de incidencias y novedades</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (month === 0) {
                setMonth(11);
                setYear((y) => y - 1);
              } else setMonth((m) => m - 1);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>{months[month]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={String(i)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue>{year}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (month === 11) {
                setMonth(0);
                setYear((y) => y + 1);
              } else setMonth((m) => m + 1);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {/* Placeholder for export */}
          <Button variant="secondary" size="icon" title="Exportar (Próximamente)">
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-2">
        <CardHeader className="bg-muted/30 py-4">
          <CardTitle className="text-lg font-medium text-center uppercase tracking-wide">
            Estadística Mensual - {months[month]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {/* Add a wrapper with min-width to ensure readability on small screens */}
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
                  {daysArray.map((day) => (
                    <TableHead
                      key={day}
                      className="text-center w-[35px] min-w-[35px] p-0 font-semibold text-xs text-muted-foreground border-r last:border-r-0"
                    >
                      {day}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold bg-muted/20 w-[60px] border-l">
                    TOTAL
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STATISTICS_SECTIONS.map((section) => (
                  <Fragment key={section.title}>
                    {/* Section Header */}
                    <TableRow key={section.title} className="hover:bg-muted/10 border-b-2">
                      <TableCell
                        colSpan={2}
                        className="sticky left-0 z-20 font-bold text-[11px] text-center border-r shadow-[2px_0_10px_-2px_rgba(0,0,0,0.1)] py-2"
                        style={{
                          backgroundColor: section.headerColor?.includes('blue')
                            ? 'rgba(59, 130, 246, 0.2)'
                            : section.headerColor?.includes('green')
                              ? 'rgba(34, 197, 94, 0.2)'
                              : section.headerColor?.includes('red') ||
                                section.headerColor?.includes('orange')
                                ? 'rgba(239, 68, 68, 0.2)'
                                : section.headerColor?.includes('amber') ||
                                  section.headerColor?.includes('yellow')
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(156, 163, 175, 0.4)',
                        }}
                      >
                        {section.title}
                      </TableCell>
                      {/* Fill remaining cells with same background for visual continuity */}
                      {daysArray.map((day) => (
                        <TableCell
                          key={`hdr-${day}`}
                          className="p-0 border-r"
                          style={{
                            backgroundColor: section.headerColor?.includes('blue')
                              ? 'rgba(59, 130, 246, 0.2)'
                              : section.headerColor?.includes('green')
                                ? 'rgba(34, 197, 94, 0.2)'
                                : section.headerColor?.includes('red') ||
                                  section.headerColor?.includes('orange')
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : section.headerColor?.includes('amber') ||
                                    section.headerColor?.includes('yellow')
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'rgba(156, 163, 175, 0.4)',
                          }}
                        />
                      ))}
                      <TableCell
                        className="border-l"
                        style={{
                          backgroundColor: section.headerColor?.includes('blue')
                            ? 'rgba(59, 130, 246, 0.2)'
                            : section.headerColor?.includes('green')
                              ? 'rgba(34, 197, 94, 0.2)'
                              : section.headerColor?.includes('red') ||
                                section.headerColor?.includes('orange')
                                ? 'rgba(239, 68, 68, 0.2)'
                                : section.headerColor?.includes('amber') ||
                                  section.headerColor?.includes('yellow')
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(156, 163, 175, 0.4)',
                        }}
                      />
                    </TableRow>

                    {/* Items ... code previously updated ... */}

                    {/* Items */}
                    {section.items.map((item) => {
                      const fullKey = `${item.code} ${item.label}`;
                      const catStats = stats?.get(fullKey);
                      let total = 0;

                      if (catStats) {
                        catStats.forEach((val) => (total += val));
                      }

                      // Only render rows with data or keep all but hide zeros?
                      // User said "solo esté vacio por defecto", implying they want to see the labels but empty values.

                      return (
                        <TableRow key={fullKey} className="hover:bg-muted/5 group">
                          <TableCell className="font-bold text-[10px] py-1.5 sticky left-0 z-10 bg-background border-r text-center shadow-[inset_-1px_0_0_0_hsl(var(--border))] group-hover:bg-muted/10">
                            {item.code}
                          </TableCell>
                          <TableCell
                            className="font-medium text-[10px] py-1.5 sticky left-[50px] z-10 bg-background border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[300px] group-hover:bg-muted/10"
                            title={item.label}
                          >
                            {item.label}
                          </TableCell>

                          {daysArray.map((day) => {
                            const count = catStats?.get(day) || 0;
                            return (
                              <TableCell
                                key={day}
                                className={`text-center p-0 text-[10px] border-r border-muted/50 ${count > 0 ? 'font-bold text-foreground bg-primary/10' : ''}`}
                              >
                                {count > 0 ? count : ''}
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
                ))}
                {/* Grand Total Row */}
                <TableRow className="bg-muted/30 font-bold border-t-2">
                  <TableCell className="sticky left-0 z-10 bg-muted/30 border-r text-center">
                    -
                  </TableCell>
                  <TableCell className="sticky left-[50px] z-10 bg-muted/30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    TOTAL DIARIO
                  </TableCell>
                  {daysArray.map((day) => {
                    let dailyTotal = 0;
                    if (stats) {
                      stats.forEach((dayMap) => {
                        dailyTotal += dayMap.get(day) || 0;
                      });
                    }
                    return (
                      <TableCell key={day} className="text-center p-0 text-xs border-r">
                        {dailyTotal > 0 ? dailyTotal : ''}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center bg-muted/40 border-l">
                    {/* Total Monthly */}
                    {(() => {
                      let grandTotal = 0;
                      if (stats) {
                        stats.forEach((dayMap) => {
                          dayMap.forEach((val) => (grandTotal += val));
                        });
                      }
                      return grandTotal > 0 ? grandTotal : '';
                    })()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
