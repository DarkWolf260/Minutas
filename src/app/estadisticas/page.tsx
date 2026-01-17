'use client';

import { useState, useMemo } from 'react';
import { useReports } from '@/hooks/use-reports';
import { useTemplates } from '@/hooks/use-templates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { calculateMonthlyStats } from '@/lib/statistics-utils';
import { STATISTICS_SECTIONS, DEFAULT_STATISTICS_CATEGORIES } from '@/constants/statistics';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function EstadisticasPage() {
    const { reports, isLoaded: reportsLoaded } = useReports();
    const { templates, isLoaded: templatesLoaded } = useTemplates();

    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth()); // 0-11

    // Generate years option (current year - 2 to current + 2)
    const years = useMemo(() => {
        const current = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => current - 2 + i);
    }, []);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const stats = useMemo(() => {
        if (!reportsLoaded || !templatesLoaded) return null;
        return calculateMonthlyStats(reports, templates, month, year);
    }, [reports, templates, month, year, reportsLoaded, templatesLoaded]);

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
                    <Button variant="outline" size="icon" onClick={() => {
                        if (month === 0) { setMonth(11); setYear(y => y - 1); }
                        else setMonth(m => m - 1);
                    }}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue>{months[month]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => (
                                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue>{year}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => {
                        if (month === 11) { setMonth(0); setYear(y => y + 1); }
                        else setMonth(m => m + 1);
                    }}>
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
                                    {daysArray.map(day => (
                                        <TableHead key={day} className="text-center w-[35px] min-w-[35px] p-0 font-semibold text-xs text-muted-foreground border-r last:border-r-0">
                                            {day}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center font-bold bg-muted/20 w-[60px] border-l">TOTAL</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {STATISTICS_SECTIONS.map((section) => (
                                    <>
                                        {/* Section Header */}
                                        <TableRow key={section.title} className="bg-muted/20 hover:bg-muted/20">
                                            <TableCell
                                                colSpan={2}
                                                className={`sticky left-0 z-10 font-bold text-center border-b border-t border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${section.headerColor || 'bg-muted/40'}`}
                                            >
                                                {section.title}
                                            </TableCell>
                                            {/* Fill remaining cells with same background for visual continuity */}
                                            {daysArray.map(day => (
                                                <TableCell key={`hdr-${day}`} className={`p-0 border-b border-t border-r ${section.headerColor || 'bg-muted/40'}`} />
                                            ))}
                                            <TableCell className={`border-l border-b border-t ${section.headerColor || 'bg-muted/40'}`} />
                                        </TableRow>

                                        {/* Items */}
                                        {section.items.map((item) => {
                                            const fullKey = `${item.code} ${item.label}`;
                                            const catStats = stats?.get(fullKey);
                                            let total = 0;

                                            if (catStats) {
                                                catStats.forEach(val => total += val);
                                            }

                                            return (
                                                <TableRow key={fullKey} className="hover:bg-muted/5">
                                                    <TableCell className="font-bold text-xs py-2 sticky left-0 z-10 bg-background border-r text-center shadow-[inset_-1px_0_0_0_hsl(var(--border))]">
                                                        {item.code}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-xs py-2 sticky left-[50px] z-10 bg-background border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] truncate max-w-[300px]" title={item.label}>
                                                        {item.label}
                                                    </TableCell>

                                                    {daysArray.map(day => {
                                                        const count = catStats?.get(day) || 0;
                                                        return (
                                                            <TableCell key={day} className={`text-center p-0 text-xs border-r border-muted/50 ${count > 0 ? 'font-bold text-foreground bg-primary/10' : 'text-muted-foreground/20'}`}>
                                                                {count > 0 ? count : '-'}
                                                            </TableCell>
                                                        );
                                                    })}
                                                    <TableCell className="text-center font-bold text-xs bg-muted/20 border-l">
                                                        {total}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </>
                                ))}
                                {/* Grand Total Row */}
                                <TableRow className="bg-muted/30 font-bold border-t-2">
                                    <TableCell className="sticky left-0 z-10 bg-muted/30 border-r text-center">-</TableCell>
                                    <TableCell className="sticky left-[50px] z-10 bg-muted/30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">TOTAL DIARIO</TableCell>
                                    {daysArray.map(day => {
                                        let dailyTotal = 0;
                                        if (stats) {
                                            stats.forEach((dayMap) => {
                                                dailyTotal += (dayMap.get(day) || 0);
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
                                                stats.forEach(dayMap => {
                                                    dayMap.forEach(val => grandTotal += val);
                                                });
                                            }
                                            return grandTotal;
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
