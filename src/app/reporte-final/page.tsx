
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useReports } from '@/hooks/use-reports';
import { Skeleton } from '@/components/ui/skeleton';
import { sortReports } from '@/lib/report-sorter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';
import { useGuards } from '@/hooks/use-guards';
import { useSettings } from '@/hooks/use-settings';
import { useRoles } from '@/hooks/use-roles';
import { useTemplates } from '@/hooks/use-templates';
import { renderFinalReport } from '@/lib/template-parser';

export default function ReporteFinalPage() {
    const { reports, isLoaded: reportsLoaded } = useReports();
    const { definitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
    const { guards, isLoaded: guardsLoaded } = useGuards();
    const { settings, isLoaded: settingsLoaded } = useSettings();
    const { roles, isLoaded: rolesLoadedHook } = useRoles();
    const { templates, configs, isLoaded: templatesLoaded } = useTemplates();
    
    const [statisticsText, setStatisticsText] = useState('');
    const [generatedReport, setGeneratedReport] = useState('');
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    const [copyButtonText, setCopyButtonText] = useState('Copiar');

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

    const handleGenerateReport = () => {
        if (reports.length === 0 && !statisticsText.trim()) {
            setGeneratedReport('No hay novedades ni estadísticas para reportar.');
            setIsResultDialogOpen(true);
            return;
        }

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formatDatePart = (date: Date) => {
            const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date);
            const dayNumber = String(date.getDate()).padStart(2, '0');
            const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(date);
            return `${dayName} ${dayNumber} de ${monthName}`.toUpperCase();
        };

        const year = today.getFullYear();
        const dateRangeString = `DESDE EL ${formatDatePart(today)} HASTA EL ${formatDatePart(tomorrow)} DE ${year}`;
        
        const headerParts = [
            `*INSTITUTO AUTÓNOMO DE PROTECCIÓN CIVIL Y ADMINISTRACIÓN DE DESASTRES MUNICIPIO ${(globalSettings['Municipio'] || '').toUpperCase()}*`,
            ``,
            `*DIRECTOR-PRESIDENTE*`,
            (globalSettings['Director'] || '').toUpperCase(),
            ``,
            `*JEFE DE OPERACIONES*`,
            (globalSettings['Jefe de Operaciones'] || '').toUpperCase(),
            ``,
            `*REPORTE DE NOVEDADES ${dateRangeString}*`,
            ``
        ];

        if (activeGuard) {
             headerParts.push(`- *EQUIPO DE GUARDIA:* GRUPO “${activeGuard.id}”`);
             roles.forEach(role => {
                 const staffList = activeGuard.staff[role.name];
                 if (staffList && staffList.length > 0 && staffList.some(s => s.trim() !== '')) {
                     headerParts.push(`- *${role.name.toUpperCase()}:* ${staffList.join(' / ')}`);
                 }
             });
        }
        
        const reportContent = sortedReports
            .map((report) => {
                const fecha = report.formData?.['Fecha'];
                const hora = report.formData?.['Hora'] || '';
                
                let formattedDate = '';
                if (fecha && typeof fecha === 'string') {
                    const dateParts = fecha.split('-');
                    if(dateParts.length === 3) {
                       formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                    }
                }
                
                const title = report.title || 'Novedad sin título';
                const prefix = ` - *${formattedDate} ${hora}* - *${title}*`;

                const template = templates.find(t => t.id === report.templateId);
                const config = configs[report.templateId];
                const formData = report.formData || {};

                if (!template || !config) {
                    return `${prefix}\n\n[No se pudo generar el resumen para este reporte. Plantilla no encontrada.]`;
                }

                const summaryContent = renderFinalReport(template.content, formData, config, globalSettings, true);

                if (summaryContent.trim() === '') {
                    return prefix;
                }
                
                return `${prefix}\n\n${summaryContent}`;
            })
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
            `*PROTECCIÓN CIVIL ${(globalSettings['Municipio'] || '').toUpperCase()}*`
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
                                    <h4 className="font-semibold mb-2">Novedades a Incluir ({sortedReports.length})</h4>
                                    <ScrollArea className="h-48 rounded-md border p-4 bg-muted/50">
                                        {sortedReports.length > 0 ? (
                                            <ul className="space-y-2">
                                                {sortedReports.map(report => (
                                                    <li key={report.id} className="text-sm">
                                                        - {report.title}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center">No hay novedades para mostrar.</p>
                                        )}
                                    </ScrollArea>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleGenerateReport} disabled={reports.length === 0 && !statisticsText.trim()}>Generar Reporte de Cierre</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Reporte de Cierre de Guardia Generado</DialogTitle>
                        <DialogDescription>
                            Puedes copiar el texto generado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            readOnly
                            value={generatedReport}
                            className="h-80 text-sm whitespace-pre-wrap font-mono"
                        />
                    </div>
                    <DialogFooter>
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
