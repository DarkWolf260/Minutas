
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useReports } from '@/hooks/use-reports';
import { Skeleton } from '@/components/ui/skeleton';
import { sortReports, findValueInFormData } from '@/lib/report-sorter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { useTemplates } from '@/hooks/use-templates';
import { renderFinalReport } from '@/lib/template-parser';
import { format } from 'date-fns';
import type { Report, StaffMember } from '@/types';
import { DatePicker } from '@/components/date-picker';
import { TimeHlvInput } from '@/components/time-hlv-input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ManualNovedad {
  id: string;
  date: Date;
  time: string;
  text: string;
}

const formatStaffMemberForReport = (member: StaffMember): string => {
    // Only show name for report generation
    return member.name;
};

export default function ReporteFinalPage() {
    const { reports, isLoaded: reportsLoaded, getLatestReports } = useReports();
    const { definitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
    const { guards, isLoaded: guardsLoaded } = useGuards();
    const { settings, saveSettings, isLoaded: settingsLoaded } = useSettings();
    const { roles, isLoaded: rolesLoadedHook } = useRoles();
    const { templates, configs, isLoaded: templatesLoaded } = useTemplates();
    const router = useRouter();
    
    const [statisticsText, setStatisticsText] = useState('');
    const [generatedReport, setGeneratedReport] = useState('');
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    const [copyButtonText, setCopyButtonText] = useState('Copiar');
    
    const [manualNovedades, setManualNovedades] = useState<ManualNovedad[]>([]);
    const [newNovedadDate, setNewNovedadDate] = useState(new Date());
    const [newNovedadTime, setNewNovedadTime] = useState('');
    const [newNovedadText, setNewNovedadText] = useState('');

    useEffect(() => {
        // This effect runs when settings are loaded or the custom period changes.
        // It establishes the default start and end guard entries.
        if (!settingsLoaded) return;

        const hasCustomDates = settings.finalReportStartDate && settings.finalReportEndDate;
        
        const startDate = hasCustomDates 
            ? new Date(settings.finalReportStartDate!) 
            : new Date();
        startDate.setHours(9, 0, 0, 0);

        const endDate = hasCustomDates 
            ? new Date(settings.finalReportEndDate!)
            : new Date(new Date().setDate(new Date().getDate() + 1));
        endDate.setHours(9, 0, 0, 0);
        
        const defaultStartNovedad: ManualNovedad = {
            id: `manual_${Date.now()}_start`,
            date: startDate,
            time: '09:00 HLV',
            text: 'Se inicia la guardia preventiva de 24 horas',
        };

        const defaultEndNovedad: ManualNovedad = {
            id: `manual_${Date.now()}_end`,
            date: endDate,
            time: '09:00 HLV',
            text: 'Se da culminación a la guardia preventiva de 24 horas',
        };

        // It's important to preserve any other manual entries the user might have added
        // during the session, so we filter out old defaults and add the new ones.
        setManualNovedades(prev => {
            const otherNovedades = prev.filter(n => !n.id.includes('_start') && !n.id.includes('_end'));
            return [...otherNovedades, defaultStartNovedad, defaultEndNovedad];
        });
    }, [settings.finalReportStartDate, settings.finalReportEndDate, settingsLoaded]);

    const globalSettings = useMemo(() => {
        const settings: Record<string, string> = {};
        Object.entries(definitions).forEach(([key, config]) => {
            if (config.type === 'predefined') {
                settings[key] = config.value || '';
            }
        });
        return settings;
    }, [definitions]);

    const activeGuard = useMemo(() => {
        if (!settings.activeGuardId || !guards.length) return null;
        return guards.find(g => g.id === settings.activeGuardId);
    }, [settings.activeGuardId, guards]);

    const sortedReports = useMemo(() => {
        return sortReports(reports, 'asc');
    }, [reports]);

    const hasCustomSettings = useMemo(() => {
        const staffSnapshot = settings.finalReportStaffSnapshot && Object.keys(settings.finalReportStaffSnapshot).length > 0;
        const customDates = !!settings.finalReportStartDate && !!settings.finalReportEndDate;
        return { staffSnapshot, customDates, any: staffSnapshot || customDates };
    }, [settings]);

    const handleClearSnapshot = () => {
        saveSettings({ ...settings, finalReportStaffSnapshot: {}, finalReportStartDate: '', finalReportEndDate: '' });
    };

    const handleAddManualNovedad = () => {
        if (!newNovedadTime || !newNovedadText) return;

        const newNovedad: ManualNovedad = {
            id: `manual_${Date.now()}`,
            date: newNovedadDate,
            time: newNovedadTime,
            text: newNovedadText
        };
        setManualNovedades(prev => [...prev, newNovedad]);
        setNewNovedadTime('');
        setNewNovedadText('');
    };

    const handleRemoveManualNovedad = (idToRemove: string) => {
        setManualNovedades(prev => prev.filter(n => n.id !== idToRemove));
    };

    const getSortDate = (novedad: Report | ManualNovedad): Date | null => {
        if ('templateId' in novedad) { // It's a Report
            const fechaStr = findValueInFormData(novedad.formData, 'Fecha') as string | undefined;
            const horaStr = findValueInFormData(novedad.formData, 'Hora') as string | undefined;

            if (!fechaStr || !horaStr) return null;

            const timeMatch = horaStr.match(/(\d{2}):(\d{2})/);
            if (!timeMatch) return null;

            const [hours, minutes] = timeMatch.slice(1).map(Number);
            if (isNaN(hours) || isNaN(minutes)) return null;
            
            // The date string from the form is 'YYYY-MM-DD'.
            // new Date('YYYY-MM-DD') parses it as UTC midnight.
            // By adding 'T00:00:00', we treat it as local time to avoid timezone shifts.
            const sortDate = new Date(`${fechaStr}T00:00:00`);
            if (isNaN(sortDate.getTime())) return null;

            sortDate.setHours(hours, minutes);
            return sortDate;

        } else { // It's a ManualNovedad
            const horaStr = novedad.time;
            const timeMatch = horaStr.match(/(\d{2}):(\d{2})/);
            if (!timeMatch) return null;
            const [hours, minutes] = timeMatch.slice(1).map(Number);
            if (isNaN(hours) || isNaN(minutes)) return null;

            const sortDate = new Date(novedad.date);
            sortDate.setHours(hours, minutes, 0, 0);
            return sortDate;
        }
    };
    
    const sortedManualNovedades = useMemo(() => {
        return [...manualNovedades].sort((a, b) => {
            const dateA = getSortDate(a);
            const dateB = getSortDate(b);
            if (dateA && dateB) {
                return dateA.getTime() - dateB.getTime();
            }
            if (dateA) return -1;
            if (dateB) return 1;
            return 0;
        });
    }, [manualNovedades]);

    const finishedReports = useMemo(() => {
        const latestReports = getLatestReports();
        return latestReports.filter(report => report.status === 'Finalizado');
    }, [reports, getLatestReports]);

    const handleGenerateReport = () => {
        const finalReportsToInclude = finishedReports;

        if (finalReportsToInclude.length === 0 && !statisticsText.trim() && manualNovedades.length === 0) {
            setGeneratedReport('No hay novedades finalizadas ni estadísticas para reportar.');
            setIsResultDialogOpen(true);
            return;
        }

        // Helper to find a key case-insensitively
        const findInsensitive = (obj: Record<string, string>, key: string): string => {
            if (!obj) return '';
            const keyLower = key.toLowerCase();
            const foundKey = Object.keys(obj).find(k => k.toLowerCase() === keyLower);
            return foundKey ? obj[foundKey] : '';
        };

        const director = findInsensitive(globalSettings, 'Director');
        const jefeDeOperaciones = findInsensitive(globalSettings, 'Jefe de Operaciones');
        const municipio = findInsensitive(globalSettings, 'Municipio');

        const dateRangeString = (() => {
            const hasCustomDates = settings.finalReportStartDate && settings.finalReportEndDate;
            const startDate = hasCustomDates ? new Date(settings.finalReportStartDate!) : new Date();
            const endDate = hasCustomDates ? new Date(settings.finalReportEndDate!) : new Date(new Date().setDate(new Date().getDate() + 1));

            const formatDatePart = (date: Date) => {
                const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
                const dayNumber = String(date.getDate()).padStart(2, '0');
                const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
                return `${dayName} ${dayNumber} de ${monthName}`.toUpperCase();
            };

            const year = startDate.getFullYear(); // Assuming same year for start and end
            return `DESDE EL ${formatDatePart(startDate)} HASTA EL ${formatDatePart(endDate)} DE ${year}`;
        })();
        
        const headerParts = [
            `*INSTITUTO AUTÓNOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES MUNICIPIO ${(municipio || '').toUpperCase()}*`,
            ``,
            `*DIRECTOR-PRESIDENTE*`,
            director,
            ``,
            `*JEFE DE OPERACIONES*`,
            jefeDeOperaciones,
            ``,
            `*REPORTE DE NOVEDADES ${dateRangeString}*`,
            ``
        ];
        
        const staffForReport = hasCustomSettings.staffSnapshot
            ? settings.finalReportStaffSnapshot
            : activeGuard?.staff;

        if (activeGuard && staffForReport) {
             headerParts.push(`- *EQUIPO DE GUARDIA:* GRUPO “${activeGuard.id}”`);
             roles.forEach(role => {
                 const staffKey = Object.keys(staffForReport).find(k => k.toLowerCase() === role.name.toLowerCase());
                 const staffList = staffKey ? staffForReport[staffKey as keyof typeof staffForReport] : undefined;
                 if (staffList && staffList.length > 0 && staffList.some(s => s.name.trim() !== '')) {
                     headerParts.push(`- *${role.name.toUpperCase()}:* ${staffList.map(formatStaffMemberForReport).join(' / ')}`);
                 }
             });
        }
        
        const allNovedades = [
          ...finalReportsToInclude.map(report => ({ type: 'report', data: report, sortDate: getSortDate(report) })),
          ...manualNovedades.map(novedad => ({ type: 'manual', data: novedad, sortDate: getSortDate(novedad) }))
        ];

        const sortedAllNovedades = allNovedades
          .filter(item => item.sortDate)
          .sort((a, b) => a.sortDate!.getTime() - b.sortDate!.getTime());

        const reportContent = sortedAllNovedades
            .map((item) => {
                if (item.type === 'report') {
                    const report = item.data as Report;
                    const sortDate = getSortDate(report);
                    if (!sortDate) return null;

                    const formattedDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(sortDate);
                    const horaStr = findValueInFormData(report.formData, 'Hora') as string | undefined;
                    const timestampText = `${formattedDate} ${horaStr || ''}`.trim();
                    
                    const template = templates.find(t => t.id === report.templateId);
                    const config = configs[report.templateId];
                    const formData = report.formData || {};
                    
                    const dynamicPredefinedValues = {...globalSettings};
                    if(activeGuard) {
                        dynamicPredefinedValues['Guardia'] = activeGuard.id;
                    }

                    let contentText = '';
                    if (template && config) {
                        contentText = renderFinalReport(template.content, formData, config, {}, true, dynamicPredefinedValues);
                    }
                    
                    const titleText = ` - *${timestampText}* - *${report.title}*`;
                    return contentText ? `${titleText}\n\n${contentText}` : titleText;

                } else { // Manual Novedad
                    const novedad = item.data as ManualNovedad;
                    const formattedDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(novedad.date);
                    const timestampText = `${formattedDate} ${novedad.time}`;
                    const contentText = novedad.text;
                    return ` - *${timestampText}* - *${contentText}*`;
                }

            })
            .filter(Boolean)
            .join('\n\n');

        const finalReportParts = [
            ...headerParts,
        ];

        if (statisticsText.trim()) {
            finalReportParts.push(
                ``,
                `*ESTADÍSTICAS DEL DÍA*`,
                ``,
                statisticsText.trim()
            );
        }
        
        if (reportContent.trim()) {
            finalReportParts.push(
                ``,
                `*NOVEDADES DEL DÍA*`,
                ``,
                reportContent
            );
        }
        
        finalReportParts.push(
            ``,
            `*PROTECCIÓN CIVIL ${(municipio || '').toUpperCase()}*`
        );
        
        const finalReportText = finalReportParts.join('\n').trim();
        setGeneratedReport(finalReportText);
        setIsResultDialogOpen(true);
        setCopyButtonText('Copiar');
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(generatedReport);
        setCopyButtonText('¡Copiado!');
        setTimeout(() => setCopyButtonText('Copiar'), 2000);
    };

    const isLoaded = reportsLoaded && definitionsLoaded && guardsLoaded && settingsLoaded && rolesLoadedHook && templatesLoaded;

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <Card className="max-w-4xl mx-auto shadow-lg">
                    <CardHeader>
                        <CardTitle>Generador de Reporte de Cierre de Guardia</CardTitle>
                        <CardDescription>
                            Añade las estadísticas y recopila todas las novedades del día para generar el reporte final.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!isLoaded ? (
                            <div className="space-y-6">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-48 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {hasCustomSettings.any ? (
                                    <Alert variant="default">
                                        <AlertDescription className="flex items-center justify-between gap-4">
                                            <span>
                                                Se ha emitido una Orden del Día. El reporte final usará el personal y periodo de esa emisión.
                                            </span>
                                            <Button variant="link" className="p-0 h-auto whitespace-nowrap" onClick={handleClearSnapshot}>
                                                Anular y usar valores actuales
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert variant="default">
                                        <AlertTitle>Aviso</AlertTitle>
                                        <AlertDescription className="flex items-center justify-between gap-4">
                                             <span>
                                                No se ha emitido una Orden del Día. El reporte se generará con la guardia activa y fecha actuales.
                                            </span>
                                            <Button variant="outline" size="sm" onClick={() => router.push('/orden-del-dia')}>
                                                Ir a Orden del Día
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="statistics-text">Estadísticas del Día</Label>
                                    <Textarea 
                                        id="statistics-text" 
                                        value={statisticsText}
                                        onChange={(e) => setStatisticsText(e.target.value)}
                                        placeholder="Introduce las estadísticas del día, una por línea. Ejemplo:&#10;- ATENCIONES PREHOSPITALARIAS 06"
                                        rows={5}
                                    />
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Novedades Registradas ({finishedReports.length} de {getLatestReports().length} finalizadas)</h4>
                                    <ScrollArea className="h-48 rounded-md border p-4 bg-muted/50">
                                        {reports.length > 0 ? (
                                            <ul className="space-y-2">
                                                {sortReports(reports).map(report => (
                                                    <li key={report.id} className="text-sm">
                                                        - {report.title}
                                                        {report.status === 'Finalizado' ? (
                                                            <span className="ml-2 text-xs text-green-600 font-semibold">(Finalizado)</span>
                                                        ) : (
                                                            <span className="ml-2 text-xs text-amber-600">(En proceso)</span>
                                                        )}
                                                        {findValueInFormData(report.formData, 'Hora') && (
                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                ({String(findValueInFormData(report.formData, 'Hora'))})
                                                            </span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center">No hay novedades para mostrar.</p>
                                        )}
                                    </ScrollArea>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="font-semibold">Añadir Novedad Manual</h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Fecha</Label>
                                                <DatePicker 
                                                    value={format(newNovedadDate, 'yyyy-MM-dd')} 
                                                    onChange={(val) => setNewNovedadDate(new Date(val + 'T00:00:00'))} 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Hora</Label>
                                                <TimeHlvInput value={newNovedadTime} onChange={setNewNovedadTime} showHelperText={false} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Texto de la Novedad</Label>
                                            <Textarea value={newNovedadText} onChange={(e) => setNewNovedadText(e.target.value)} placeholder="Ej: Se envía primer corte de novedades..." />
                                        </div>
                                        <div className="flex justify-end">
                                            <Button onClick={handleAddManualNovedad}><PlusCircle className="h-4 w-4 mr-2" />Añadir</Button>
                                        </div>
                                    </div>
                                    
                                    {manualNovedades.length > 0 && (
                                        <div className="space-y-2 pt-2">
                                            <Label>Novedades Manuales ({manualNovedades.length})</Label>
                                            <div className="space-y-2 rounded-md border p-2 bg-muted/50 max-h-48 overflow-y-auto">
                                                {sortedManualNovedades.map(novedad => (
                                                    <div key={novedad.id} className="flex items-center justify-between rounded-md p-2 text-sm bg-background">
                                                        <span>{`${format(novedad.date, 'dd/MM/yyyy')} ${novedad.time} - ${novedad.text}`}</span>
                                                        {!novedad.id.includes('_start') && !novedad.id.includes('_end') && (
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveManualNovedad(novedad.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleGenerateReport} disabled={finishedReports.length === 0 && !statisticsText.trim() && manualNovedades.length === 0}>Generar Reporte de Cierre</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent className="max-h-[90vh] max-w-[90vw] sm:max-w-2xl flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Reporte de Cierre de Guardia Generado</DialogTitle>
                        <DialogDescription>
                            Puedes copiar el texto generado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto -mx-6 px-6">
                        <Textarea
                            readOnly
                            value={generatedReport}
                            className="w-full h-full min-h-[50vh] text-sm whitespace-pre-wrap font-mono"
                        />
                    </div>
                    <DialogFooter className="mt-auto pt-4">
                        <Button type="button" onClick={handleCopyToClipboard}>
                            {copyButtonText}
                        </Button>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cerrar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
